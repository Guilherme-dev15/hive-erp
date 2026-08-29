const { admin, COLLECTIONS } = require('../config/firebase');
const { canTransition } = require('../services/order.service');

module.exports = (db) => ({
    // Products
    getProducts: async (req, res) => {
        try {
            const s = await db.collection(COLLECTIONS.PRODUCTS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
            res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    createProduct: async (req, res) => {
        const productData = { ...req.body, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() };
        const ref = await db.collection(COLLECTIONS.PRODUCTS).add(productData);
        
        // DUAL WRITE - Fase 5.3
        // dualWriteService.syncProduct(ref.id, req.body).catch(err => console.error('[DUAL WRITE ERROR]', err));
        res.json({ id: ref.id, ...productData });
    },
    updateProduct: async (req, res) => {
        await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update(req.body);
        
        // DUAL WRITE - Fase 5.3
        // dualWriteService.syncProduct(req.params.id, req.body).catch(err => console.error('[DUAL WRITE ERROR]', err));
        res.json({ id: req.params.id });
    },
    deleteProduct: async (req, res) => {
        await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).delete();
        res.sendStatus(204);
    },
    bulkCreateProducts: async (req, res) => {
        const batch = db.batch();
        req.body.forEach(p => batch.set(db.collection(COLLECTIONS.PRODUCTS).doc(), { ...p, userId: req.user.uid, createdAt: admin.firestore.FieldValue.serverTimestamp() }));
        await batch.commit();
        res.json({ success: true });
    },

    // Categories
    getCategories: async (req, res) => {
        const s = await db.collection(COLLECTIONS.CATEGORIES).where('userId', '==', req.user.uid).orderBy('name').get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    createCategory: async (req, res) => {
        const ref = await db.collection(COLLECTIONS.CATEGORIES).add({ ...req.body, userId: req.user.uid });
        res.json({ id: ref.id });
    },
    deleteCategory: async (req, res) => {
        await db.collection(COLLECTIONS.CATEGORIES).doc(req.params.id).delete();
        res.sendStatus(204);
    },

    // Suppliers
    getSuppliers: async (req, res) => {
        const s = await db.collection(COLLECTIONS.SUPPLIERS).where('userId', '==', req.user.uid).get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    createSupplier: async (req, res) => {
        const ref = await db.collection(COLLECTIONS.SUPPLIERS).add({ ...req.body, userId: req.user.uid });
        res.json({ id: ref.id });
    },

    // Transactions
    getTransactions: async (req, res) => {
        try {
            const s = await db.collection(COLLECTIONS.TRANSACTIONS).where('userId', '==', req.user.uid).orderBy('date', 'desc').get();
            res.json(s.docs.map(d => ({ id: d.id, ...d.data(), date: d.data().date?.toDate?.() || d.data().date })));
        } catch (e) { res.status(500).json({ error: e.message }); }
    },
    createTransaction: async (req, res) => {
        const t = req.body;
        if (t.date) t.date = admin.firestore.Timestamp.fromDate(new Date(t.date));
        const ref = await db.collection(COLLECTIONS.TRANSACTIONS).add({ ...t, userId: req.user.uid });
        res.json({ id: ref.id });
    },
    deleteTransaction: async (req, res) => {
        await db.collection(COLLECTIONS.TRANSACTIONS).doc(req.params.id).delete();
        res.sendStatus(204);
    },

    // Orders
    getOrders: async (req, res) => {
        const s = await db.collection(COLLECTIONS.ORDERS).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    updateOrder: async (req, res) => {
        await db.collection(COLLECTIONS.ORDERS).doc(req.params.id).update({ status: req.body.status });
        res.json({ id: req.params.id });
    },
    updateOrderStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status: toStatus } = req.body;

            const orderRef = db.collection(COLLECTIONS.ORDERS).doc(id);
            const orderDoc = await orderRef.get();

            if (!orderDoc.exists) {
                return res.status(404).json({ error: "Pedido não encontrado." });
            }

            const fromStatus = orderDoc.data().status;

            if (!canTransition(fromStatus, toStatus)) {
                return res.status(400).json({
                    error: `Transição de status inválida de "${fromStatus}" para "${toStatus}".`
                });
            }

            await orderRef.update({
                status: toStatus,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.json({ message: `Status do pedido atualizado para "${toStatus}".` });

        } catch (error) {
            console.error("Erro ao atualizar status do pedido:", error);
            res.status(500).json({ error: "Erro interno ao atualizar status do pedido." });
        }
    },
    deleteOrder: async (req, res) => {
        try {
            await db.collection('orders').doc(req.params.id).delete();
            res.json({ success: true, message: "Pedido excluído do sistema." });
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
            res.status(500).json({ error: "Erro interno ao processar a exclusão." });
        }
    },

    // Inventory
    adjustInventory: async (req, res) => {
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
    },
    getInventoryLogs: async (req, res) => {
        const s = await db.collection(COLLECTIONS.INVENTORY_LOGS).where('productId', '==', req.params.productId).where('userId', '==', req.user.uid).orderBy('createdAt', 'desc').limit(20).get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    }
});
