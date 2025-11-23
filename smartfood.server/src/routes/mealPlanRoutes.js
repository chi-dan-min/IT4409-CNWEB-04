// src/routes/mealPlanRoutes.js
const express = require('express');
const {
  getMealPlans,
  createMealPlan,
  updateMealPlan,
  deleteMealPlan,
  suggestMealPlan,
  addMealPlanEntry,       // Import hàm mới
  updateMealPlanEntry,    // Import hàm mới
  deleteMealPlanEntry,    // Import hàm mới
} = require('../controllers/mealPlanController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

router.route('/').get(protect, getMealPlans).post(protect, createMealPlan);
router.route('/suggest').get(protect, suggestMealPlan);
router.route('/:id').put(protect, updateMealPlan).delete(protect, deleteMealPlan);

// Thêm các route cho việc quản lý từng bữa ăn trong một kế hoạch
router.route('/:mealPlanId/meals')
  .post(protect, addMealPlanEntry); // Thêm bữa ăn vào kế hoạch

router.route('/:mealPlanId/meals/:mealEntryId')
  .put(protect, updateMealPlanEntry) // Cập nhật bữa ăn trong kế hoạch
  .delete(protect, deleteMealPlanEntry); // Xóa bữa ăn khỏi kế hoạch


module.exports = router;