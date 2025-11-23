// src/routes/recipeRoutes.js
const express = require('express');
const {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  suggestRecipes,
} = require('../controllers/recipeController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// Routes chính
router.route('/')
  .get(protect, getRecipes)
  .post(protect, createRecipe);

// Route gợi ý món ăn
router.route('/suggest')
  .get(protect, suggestRecipes);

// Routes cho recipe cụ thể
router.route('/:id')
  .get(protect, getRecipeById)
  .put(protect, updateRecipe)
  .delete(protect, deleteRecipe);

module.exports = router;