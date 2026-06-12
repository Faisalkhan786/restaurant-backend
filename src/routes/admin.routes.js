const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const orderController = require('../controllers/order.controller');
const couponController = require('../controllers/coupon.controller');
const adminController = require('../controllers/admin.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const menuValidator = require('../validators/menu.validator');
const orderValidator = require('../validators/order.validator');
const couponValidator = require('../validators/coupon.validator');
const adminValidator = require('../validators/admin.validator');

// All admin routes require auth + admin role
router.use(authenticate, authorize('admin'));

// Categories
router.get('/categories', menuController.getAllCategories);
router.post('/categories', upload.single('image'), validate(menuValidator.createCategory), menuController.createCategory);
router.put('/categories/:id', upload.single('image'), validate(menuValidator.updateCategory), menuController.updateCategory);
router.delete('/categories/:id', menuController.deleteCategory);

// Menu Items
router.get('/items', menuController.getAllItems);
router.post('/items', upload.single('image'), validate(menuValidator.createItem), menuController.createItem);
router.put('/items/:id', upload.single('image'), validate(menuValidator.updateItem), menuController.updateItem);
router.patch('/items/:id/toggle', menuController.toggleAvailability);
router.delete('/items/:id', menuController.deleteItem);

// Orders
router.get('/orders', orderController.getAllOrders);
router.patch('/orders/:id/status', validate(orderValidator.updateStatus), orderController.updateOrderStatus);
router.patch('/orders/:id/assign', validate(orderValidator.assignDeliveryBoy), orderController.assignDeliveryBoy);

// Coupons
router.get('/coupons', couponController.getAllCoupons);
router.post('/coupons', validate(couponValidator.createCoupon), couponController.createCoupon);
router.put('/coupons/:id', validate(couponValidator.updateCoupon), couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

// Dashboard & Reports
router.get('/dashboard', adminController.getDashboard);
router.get('/reports', adminController.getReports);
router.get('/top-items', adminController.getTopItems);
router.get('/delivery-boys', adminController.getDeliveryBoys);

// Restaurant Config
router.get('/config', adminController.getConfig);
router.put('/config', validate(adminValidator.updateConfig), adminController.updateConfig);

module.exports = router;
