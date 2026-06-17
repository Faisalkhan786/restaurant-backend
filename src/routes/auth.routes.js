const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const validate = require('../middleware/validate');
const { register, login, refreshToken, createUser, forgotPassword, resetPassword } = require('../validators/auth.validator');

// Public routes
router.post('/register', validate(register), authController.register);
router.post('/login', validate(login), authController.login);
router.post('/refresh-token', validate(refreshToken), authController.refreshToken);
router.post('/forgot-password', validate(forgotPassword), authController.forgotPassword);
router.post('/reset-password', validate(resetPassword), authController.resetPassword);

// Protected routes
router.get('/me', authenticate, authController.getMe);
router.post('/logout', authenticate, authController.logout);

// Admin only — create delivery boy or admin
router.post('/create-user', authenticate, authorize('admin'), validate(createUser), authController.createUser);

module.exports = router;
