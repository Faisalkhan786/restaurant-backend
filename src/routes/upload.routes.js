const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const authenticate = require('../middleware/auth');
const authorize = require('../middleware/role');
const upload = require('../middleware/upload');

// Only admin can upload images
router.post('/image', authenticate, authorize('admin'), upload.single('image'), uploadController.uploadImage);

module.exports = router;
