const express = require('express');
const router = express.Router();
const orderController = require('../controllers/order.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { placeOrder, cancelOrder } = require('../validators/order.validator');

// Customer order routes
router.use(authenticate, authorize('customer'));

router.post('/', validate(placeOrder), orderController.placeOrder);
router.get('/', orderController.getMyOrders);
router.get('/:id', orderController.getOrderDetail);
router.patch('/:id/cancel', validate(cancelOrder), orderController.cancelOrder);

module.exports = router;
