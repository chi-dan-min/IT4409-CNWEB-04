// src/routes/shoppingListRoutes.js
const express = require('express');
const {
  getShoppingLists,
  createShoppingList,
  updateShoppingList,
  deleteShoppingList,
  submitShare
} = require('../controllers/shoppingListController');
const { protect } = require('../middleware/authMiddleware');
const router = express.Router();

// GET: Lấy danh sách mua sắm (cá nhân hoặc theo nhóm)
// POST: Tạo danh sách mua sắm mới (cá nhân hoặc gán cho nhóm)
router.route('/')
  .get(protect, getShoppingLists)
  .post(protect, createShoppingList);

// PUT: Cập nhật danh sách mua sắm (bao gồm việc gán/hủy gán nhóm)
// DELETE: Xóa danh sách mua sắm
router.route('/:id')
  .put(protect, updateShoppingList)
  .delete(protect, deleteShoppingList);

router.route('/share')
  .put(protect, submitShare);

module.exports = router;