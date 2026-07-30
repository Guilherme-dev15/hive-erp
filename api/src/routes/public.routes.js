const express = require('express');
const {
  getConfigBySlug,
  getPublicConfig,
  validateCoupon,
  getPublicProducts,
  getPublicCategories,
  createOrder
} = require('../controllers/public.controller');

const router = express.Router();

router.get('/config-by-slug', getConfigBySlug);
router.get('/config-public', getPublicConfig);
router.post('/validate-coupon', validateCoupon);
router.get('/products-public', getPublicProducts);
router.get('/categories-public', getPublicCategories);
router.post('/orders', createOrder);

module.exports = router;
