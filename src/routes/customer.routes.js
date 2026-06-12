const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customer.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { updateProfile, addAddress, updateAddress } = require('../validators/customer.validator');

// All customer routes require auth + customer role
router.use(authenticate, authorize('customer'));

// Profile
router.get('/profile', customerController.getProfile);
router.put('/profile', validate(updateProfile), customerController.updateProfile);

// Addresses
router.post('/addresses', validate(addAddress), customerController.addAddress);
router.get('/addresses', customerController.getAddresses);
router.put('/addresses/:id', validate(updateAddress), customerController.updateAddress);
router.delete('/addresses/:id', customerController.deleteAddress);

module.exports = router;
