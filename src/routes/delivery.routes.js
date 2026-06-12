const express = require('express');
const router = express.Router();
const deliveryController = require('../controllers/delivery.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { updateDeliveryStatus, updateLocation, updateProfile } = require('../validators/delivery.validator');

// All delivery routes require auth + delivery_boy role
router.use(authenticate, authorize('delivery_boy'));

// Profile
router.get('/profile', deliveryController.getProfile);
router.put('/profile', validate(updateProfile), deliveryController.updateProfile);

// Availability toggle
router.patch('/toggle', deliveryController.toggleAvailability);

// Location update
router.patch('/location', validate(updateLocation), deliveryController.updateLocation);

// Orders
router.get('/orders', deliveryController.getMyAssignedOrders);
router.get('/orders/:id', deliveryController.getOrderDetail);
router.patch('/orders/:id', validate(updateDeliveryStatus), deliveryController.updateDeliveryStatus);

module.exports = router;
