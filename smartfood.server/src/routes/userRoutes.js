const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware'); // Import middleware của bạn

// Các route yêu cầu quyền admin
// GET /api/users: Lấy danh sách tất cả người dùng
// POST /api/users: Tạo người dùng mới
router.route('/').get(protect, admin, getUsers).post(protect, admin, createUser);

// GET /api/users/:id: Lấy thông tin người dùng theo ID
// PUT /api/users/:id: Cập nhật thông tin người dùng theo ID
// DELETE /api/users/:id: Xóa người dùng theo ID
router
  .route('/:id')
  .get(protect, admin, getUserById)
  .put(protect, admin, updateUser)
  .delete(protect, admin, deleteUser);

module.exports = router;