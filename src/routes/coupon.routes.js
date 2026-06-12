const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const authenticate = require('../middleware/auth');

// Public — validate coupon (customer)
router.get('/validate/:code', authenticate, couponController.validateCoupon);

module.exports = router;
