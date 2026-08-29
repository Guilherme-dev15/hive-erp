const express = require('express');

function createAdminRoutes(db) {
  const router = express.Router();
  const adminController = require('../controllers/admin.controller')(db);

  // Products
  router.get('/products', adminController.getProducts);
  router.post('/products', adminController.createProduct);
  router.put('/products/:id', adminController.updateProduct);
  router.delete('/products/:id', adminController.deleteProduct);
  router.post('/products/bulk', adminController.bulkCreateProducts);

  // Categories
  router.get('/categories', adminController.getCategories);
  router.post('/categories', adminController.createCategory);
  router.delete('/categories/:id', adminController.deleteCategory);

  // Suppliers
  router.get('/suppliers', adminController.getSuppliers);
  router.post('/suppliers', adminController.createSupplier);

  // Transactions
  router.get('/transactions', adminController.getTransactions);
  router.post('/transactions', adminController.createTransaction);
  router.delete('/transactions/:id', adminController.deleteTransaction);

  // Orders
  router.get('/orders', adminController.getOrders);
  router.put('/orders/:id', adminController.updateOrder);
  router.patch('/orders/:id/status', adminController.updateOrderStatus);
  router.delete('/orders/:id', adminController.deleteOrder);


  // Inventory
  router.post('/inventory/adjust', adminController.adjustInventory);
  router.get('/inventory/logs/:productId', adminController.getInventoryLogs);



  return router;
}

module.exports = createAdminRoutes;
