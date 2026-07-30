const { db, admin, COLLECTIONS } = require('../config/firebase');

// Products
exports.getProducts = async (req, res) => {
    try {
        const s = await db.collection(COLLECTIONS.PRODUCTS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.createProduct = async (req, res) => {
    const productData = { ...req.body, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await db.collection(COLLECTIONS.PRODUCTS).add(productData);
    res.json({ id: ref.id, ...productData });
};
exports.updateProduct = async (req, res) => {
    await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update(req.body);
    res.json({ id: req.params.id });
};
exports.deleteProduct = async (req, res) => {
    await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).delete();
    res.sendStatus(204);
};
exports.bulkCreateProducts = async (req, res) => {
    const batch = db.batch();
    req.body.forEach(p => batch.set(db.collection(COLLECTIONS.PRODUCTS).doc(), { ...p, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
    await batch.commit();
    res.json({ success: true });
};

// Categories
exports.getCategories = async (req, res) => {
    const s = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', req.user.uid).orderBy('name').get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
};
exports.createCategory = async (req, res) => {
    const ref = await db.collection(COLLECTIONS.CATEGORIES).add({ ...req.body, userId: req.user.uid });
    res.json({ id: ref.id });
};
exports.deleteCategory = async (req, res) => {
    await db.collection(COLLECTIONS.CATEGORIES).doc(req.params.id).delete();
    res.sendStatus(204);
};

// Suppliers
exports.getSuppliers = async (req, res) => {
    const s = await db.collection(COLLECTIONS.SUPPLIERS).where('userId', '==', req.user.uid).get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
};
exports.createSupplier = async (req, res) => {
    const ref = await db.collection(COLLECTIONS.SUPPLIERS).add({ ...req.body, userId: req.user.uid });
    res.json({ id: ref.id });
};

// Transactions
exports.getTransactions = async (req, res) => {
    try {
        const s = await db.collection(COLLECTIONS.TRANSACTIONS).where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() || d.data().date })));
    } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.createTransaction = async (req, res) => {
    const t = req.body;
    if (t.date) t.date = admin.firestore.Timestamp.fromDate(new Date(t.date));
    const ref = await db.collection(COLLECTIONS.TRANSACTIONS).add({ ...t, userId: req.user.uid });
    res.json({ id: ref.id });
};
exports.deleteTransaction = async (req, res) => {
    await db.collection(COLLECTIONS.TRANSACTIONS).doc(req.params.id).delete();
    res.sendStatus(204);
};

// Orders
exports.getOrders = async (req, res) => {
    const s = await db.collection(COLLECTIONS.ORDERS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
};
exports.updateOrder = async (req, res) => {
    await db.collection(COLLECTIONS.ORDERS).doc(req.params.id).update({ status: req.body.status });
    res.json({ id: req.params.id });
};
exports.updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await db.collection('orders').doc(id).update({
            status: status,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        res.json({ message: "Status atualizado no banco!" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
exports.deleteOrder = async (req, res) => {
    try {
        await db.collection('orders').doc(req.params.id).delete();
        res.json({ success: true, message: "Pedido excluído do sistema." });
    } catch (error) {
        res.status(500).json({ error: "Erro interno ao processar a exclusão." });
    }
};

// Dashboard
exports.getDashboardStats = async (req, res) => {
    try {
        const snapshot = await db.collection(COLLECTIONS.ORDERS).where('userId', '==', req.user.uid).get();
        let totalFaturamento = 0;
        let pedidosHoje = 0;
        let totalPedidos = 0;
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        snapshot.forEach(doc => {
            const data = doc.data();
            const statusValidos = ['pago', 'paid', 'approved', 'sep', 'env'];
            const statusAtual = (data.status || '').toLowerCase();

            if (statusValidos.some(s => statusAtual.includes(s))) {
                totalFaturamento += Number(data.total) || 0;
                totalPedidos++;
                let dataPedido = data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt);
                if (dataPedido >= hoje) {
                    pedidosHoje++;
                }
            }
        });
        const ticketMedio = totalPedidos > 0 ? (totalFaturamento / totalPedidos) : 0;
        res.json({
            revenue: totalFaturamento,
            ordersToday: pedidosHoje,
            totalOrders: totalPedidos,
            averageTicket: ticketMedio
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao calcular dashboard" });
    }
};

// Inventory
exports.adjustInventory = async (req, res) => {
    const { productId, type, quantity, userName } = req.body;
    try {
        const productRef = db.collection(COLLECTIONS.PRODUCTS).doc(productId);
        await db.runTransaction(async (t) => {
            const doc = await t.get(productRef);
            const newQty = type === 'entry' ? (doc.data().quantity || 0) + Number(quantity) : (doc.data().quantity || 0) - Number(quantity);
            t.update(productRef, { quantity: newQty });
            t.set(db.collection(COLLECTIONS.INVENTORY_LOGS).doc(), { userId: req.user.uid, productId, type, change: quantity, newQuantity: newQty, user: userName, createdAt: admin.firestore.FieldValue.serverTimestamp() });
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
exports.getInventoryLogs = async (req, res) => {
    const s = await db.collection(COLLECTIONS.INVENTORY_LOGS).where('productId', '==', req.params.productId).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(20).get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
};

// Coupons
exports.getCoupons = async (req, res) => {
    const s = await db.collection(COLLECTIONS.COUPONS).where('userId', '==', req.user.uid).get();
    res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
};
exports.createCoupon = async (req, res) => {
    const data = { ...req.body, userId: req.user.uid, code: req.body.code.toUpperCase(), createdAt: admin.firestore.FieldValue.serverTimestamp() };
    const ref = await db.collection(COLLECTIONS.COUPONS).add(data);
    res.json({ id: ref.id, ...data });
};
exports.deleteCoupon = async (req, res) => {
    await db.collection(COLLECTIONS.COUPONS).doc(req.params.id).delete();
    res.sendStatus(204);
};

// Config
exports.saveConfig = async (req, res) => {
    await db.collection(COLLECTIONS.CONFIG).doc('settings').set({
        ...req.body,
        userId: req.user.uid,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    res.json(req.body);
};
exports.getConfig = async (req, res) => {
    try {
        const snapshot = await db.collection(COLLECTIONS.CONFIG).where('userId', '==', req.user.uid).limit(1).get();
        if (snapshot.empty) return res.json({});
        return res.json({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
    } catch (e) {
        return res.status(500).json({ error: e.message });
    }
};
