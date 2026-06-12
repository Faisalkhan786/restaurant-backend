const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');

// Public menu routes
router.get('/', menuController.getFullMenu);
router.get('/item/:id', menuController.getItemDetail);
router.get('/:categoryId', menuController.getByCategory);

module.exports = router;
