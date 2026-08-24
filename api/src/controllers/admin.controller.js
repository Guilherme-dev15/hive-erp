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
        dualWriteService.syncProduct(ref.id, req.body).catch(err => console.error('[DUAL WRITE ERROR]', err));
        res.json({ id: ref.id, ...productData });
    },
    updateProduct: async (req, res) => {
        await db.collection(COLLECTIONS.PRODUCTS).doc(req.params.id).update(req.body);
        
        // DUAL WRITE - Fase 5.3
        dualWriteService.syncProduct(req.params.id, req.body).catch(err => console.error('[DUAL WRITE ERROR]', err));
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

    // Dashboard
    getDashboardStats: async (req, res) => {
        try {
            const ordersRef = db.collection(COLLECTIONS.ORDERS).where('userId', '==', req.user.uid);

            // Agregação 1: Total e Receita
            const totalAggQuery = ordersRef.aggregate({
                totalOrders: admin.firestore.AggregateField.count(),
                totalRevenue: admin.firestore.AggregateField.sum('total')
            });

            // Agregação 2: Pedidos Hoje
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            const todayTimestamp = admin.firestore.Timestamp.fromDate(startOfToday);

            const todayAggQuery = ordersRef
                .where('createdAt', '>=', todayTimestamp)
                .aggregate({
                    ordersToday: admin.firestore.AggregateField.count()
                });

            const [totalSnap, todaySnap] = await Promise.all([
                totalAggQuery.get(),
                todayAggQuery.get()
            ]);

            const totalOrders = totalSnap.data().totalOrders || 0;
            const totalRevenue = totalSnap.data().totalRevenue || 0;
            const ordersToday = todaySnap.data().ordersToday || 0;
            const averageTicket = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;

            res.json({
                stats: {
                    totalVendas: totalRevenue,
                    lucroLiquido: totalRevenue * 0.4, // Simulação temporária
                    totalDespesas: totalRevenue * 0.6, // Simulação temporária
                    saldoTotal: totalRevenue,
                    activeProducts: 0 // Placeholder, ideal seria uma agregação em productsRef
                },
                charts: {
                    salesByDay: [],
                    incomeVsExpense: []
                },
                // Mantendo os dados do refactor (retrocompatibilidade caso necessário)
                revenue: totalRevenue,
                ordersToday: ordersToday,
                totalOrders: totalOrders,
                averageTicket: averageTicket
            });

        } catch (error) {
            console.error("Erro ao buscar estatísticas do dashboard:", error);
            res.status(500).json({ error: "Erro ao buscar estatísticas do dashboard" });
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
    },

    // Coupons
    getCoupons: async (req, res) => {
        const s = await db.collection(COLLECTIONS.COUPONS).where('userId', '==', req.user.uid).get();
        res.json(s.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    createCoupon: async (req, res) => {
        const data = { ...req.body, userId: req.user.uid, code: req.body.code.toUpperCase(), createdAt: admin.firestore.FieldValue.serverTimestamp() };
        const ref = await db.collection(COLLECTIONS.COUPONS).add(data);
        res.json({ id: ref.id, ...data });
    },
    deleteCoupon: async (req, res) => {
        await db.collection(COLLECTIONS.COUPONS).doc(req.params.id).delete();
        res.sendStatus(204);
    },

    // Config
    saveConfig: async (req, res) => {
        await db.collection(COLLECTIONS.CONFIG).doc('settings').set({
            ...req.body,
            userId: req.user.uid,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        res.json(req.body);
    },
    getConfig: async (req, res) => {
        try {
            const snapshot = await db.collection(COLLECTIONS.CONFIG).where('userId', '==', req.user.uid).limit(1).get();
            if (snapshot.empty) return res.json({});
            return res.json({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
        } catch (e) {
            return res.status(500).json({ error: e.message });
        }
    },
});
