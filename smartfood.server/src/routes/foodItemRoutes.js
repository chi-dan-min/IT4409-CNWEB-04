// src/routes/foodItemRoutes.js
const express = require('express');
const {
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getExpiringFoodItems,
} = require('../controllers/foodItemController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getFoodItems).post(protect, createFoodItem);
router.route('/expiring').get(protect, getExpiringFoodItems);
router.route('/:id').put(protect, updateFoodItem).delete(protect, deleteFoodItem);

module.exports = router;