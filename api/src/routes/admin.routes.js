const express = require('express');
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkCreateProducts,
  getCategories,
  createCategory,
  deleteCategory,
  getSuppliers,
  createSupplier,
  getTransactions,
  createTransaction,
  deleteTransaction,
  getOrders,
  updateOrder,
  updateOrderStatus,
  deleteOrder,
  getDashboardStats,
  adjustInventory,
  getInventoryLogs,
  getCoupons,
  createCoupon,
  deleteCoupon,
  getConfig,
  saveConfig
} = require('../controllers/admin.controller');

const router = express.Router();

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/products/bulk', bulkCreateProducts);

// Categories
router.get('/categories', getCategories);
router.post('/categories', createCategory);
router.delete('/categories/:id', deleteCategory);

// Suppliers
router.get('/suppliers', getSuppliers);
router.post('/suppliers', createSupplier);

// Transactions
router.get('/transactions', getTransactions);
router.post('/transactions', createTransaction);
router.delete('/transactions/:id', deleteTransaction);

// Orders
router.get('/orders', getOrders);
router.put('/orders/:id', updateOrder);
router.patch('/orders/:id/status', updateOrderStatus);
router.delete('/orders/:id', deleteOrder);

// Dashboard
router.get('/dashboard/stats', getDashboardStats);

// Inventory
router.post('/inventory/adjust', adjustInventory);
router.get('/inventory/logs/:productId', getInventoryLogs);

// Coupons
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Config
router.get('/config', getConfig);
router.post('/config', saveConfig);

module.exports = router;
