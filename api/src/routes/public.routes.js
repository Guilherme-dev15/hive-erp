const express = require('express');

function createPublicRoutes(db) {
  const router = express.Router();
  const publicController = require('../controllers/public.controller')(db);

  router.get('/config-by-slug', publicController.getConfigBySlug);
  router.get('/config-public', publicController.getPublicConfig);
  router.post('/validate-coupon', publicController.validateCoupon);
  router.get('/products-public', publicController.getPublicProducts);
  router.get('/categories-public', publicController.getPublicCategories);
  router.post('/orders', publicController.createOrder);

  return router;
}

module.exports = createPublicRoutes;
