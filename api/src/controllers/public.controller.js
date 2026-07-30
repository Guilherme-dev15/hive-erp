const { db, COLLECTIONS } = require('../config/firebase');

exports.getConfigBySlug = async (req, res) => {
  const { slug } = req.query;
  if (!slug) return res.status(400).json({ error: "Nome da loja não informado" });

  try {
    const snapshot = await db.collection(COLLECTIONS.CONFIG).where('slug', '==', slug.toLowerCase()).limit(1).get();
    if (snapshot.empty) return res.status(404).json({ message: "Loja não encontrada" });

    const doc = snapshot.docs[0];
    const data = doc.data();
    const realStoreId = data.userId || doc.id;
    res.json({ ...data, storeId: realStoreId });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

exports.getPublicConfig = async (req, res) => {
  const { storeId } = req.query;
  if (!storeId) return res.status(400).json({ error: "storeId é necessário" });

  try {
    let doc = await db.collection(COLLECTIONS.CONFIG).doc(storeId).get();
    if (!doc.exists) {
      const snap = await db.collection(COLLECTIONS.CONFIG).where('userId', '==', storeId).limit(1).get();
      if (!snap.empty) doc = snap.docs[0];
    }
    if (!doc.exists) return res.json({ storeName: "Loja Virtual", primaryColor: "#000000", banners: [] });
    res.json(doc.data());
  } catch (e) { res.status(500).json({ error: e.message }); }
};

exports.validateCoupon = async (req, res) => {
    const { code, storeId } = req.body;
    if (!code || !storeId) return res.status(200).json({ valid: false, message: "Dados incompletos" });

    try {
      const snapshot = await db.collection(COLLECTIONS.COUPONS)
        .where('userId', '==', storeId)
        .where('code', '==', code.toUpperCase())
        .get();

      if (snapshot.empty) return res.status(200).json({ valid: false, message: "Cupom inválido" });

      const cupom = snapshot.docs[0].data();
      if (cupom.status && cupom.status !== 'ativo') return res.status(200).json({ valid: false, message: "Cupom inativo" });

      res.json({
        valid: true,
        discountValue: Number(cupom.discountValue || cupom.discountPercent || cupom.percent || 0),
        type: cupom.type || 'percentage',
        code: cupom.code
      });
    } catch (e) { res.status(500).json({ valid: false, message: "Erro interno" }); }
};

exports.getPublicProducts = async (req, res) => {
    if (!db) return res.json([]);
    try {
      let query = db.collection(COLLECTIONS.PRODUCTS).where('status', '==', 'ativo');
      if (req.query.storeId) query = query.where('userId', '==', req.query.storeId);

      const snapshot = await query.get();
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        salePrice: parseFloat(doc.data().salePrice || 0),
        quantity: parseInt(doc.data().quantity || 0)
      }));
      res.json(products);
    } catch (error) { res.status(500).json([]); }
};

exports.getPublicCategories = async (req, res) => {
    if (!db) return res.json([]);
    try {
      let query = db.collection(COLLECTIONS.CATEGORIES);
      if (req.query.storeId) query = query.where('userId', '==', req.query.storeId);
      const s = await query.orderBy('name').get();
      res.json(s.docs.map(d => d.data().name));
    } catch (e) { res.json([]); }
};

exports.createOrder = async (req, res) => {
    const { admin } = require('../config/firebase');
    try {
      let storeOwnerId = null;
      if (req.body.items?.length > 0) {
        const firstProductRef = db.collection(COLLECTIONS.PRODUCTS).doc(req.body.items[0].id);
        const firstProduct = await firstProductRef.get();
        if (!firstProduct.exists) return res.status(404).json({ error: "Um dos produtos no carrinho não foi encontrado." });
        storeOwnerId = firstProduct.data().userId;
      }
      if (!storeOwnerId && req.body.storeId) storeOwnerId = req.body.storeId;

      const orderData = {
        ...req.body,
        userId: storeOwnerId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        status: 'Aguardando Pagamento'
      };

      const batch = db.batch();
      const orderRef = db.collection(COLLECTIONS.ORDERS).doc();
      batch.set(orderRef, orderData);

      if (orderData.items && Array.isArray(orderData.items)) {
        orderData.items.forEach(item => {
          const prodRef = db.collection(COLLECTIONS.PRODUCTS).doc(item.id);
          batch.update(prodRef, { quantity: admin.firestore.FieldValue.increment(-item.quantidade) });
        });
      }
      await batch.commit();
      res.status(201).json({ id: orderRef.id, ...orderData });
    } catch (e) { res.status(500).json({ error: e.message }); }
};
