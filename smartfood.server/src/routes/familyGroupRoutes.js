const express = require('express');
const {
  createFamilyGroup,
  getFamilyGroups,
  inviteMember,
  removeMember,
  updateMemberRole,
} = require('../controllers/familyGroupController');
const { protect } = require('../middleware/authMiddleware'); // Đảm bảo đã import middleware protect

const router = express.Router();

// Routes cho việc tạo và lấy danh sách nhóm gia đình của người dùng
router.route('/')
  .post(protect, createFamilyGroup) // POST: Tạo nhóm mới (người tạo là admin)
  .get(protect, getFamilyGroups);  // GET: Lấy các nhóm mà người dùng thuộc về

// Route để mời thành viên mới vào nhóm (chỉ admin)
router.post('/:id/invite', protect, inviteMember);

// Routes cho thao tác trên thành viên cụ thể trong nhóm (chỉ admin)
router.route('/:groupId/members/:memberId')
  .delete(protect, removeMember) // DELETE: Xóa thành viên khỏi nhóm
  .put(protect, updateMemberRole); // PUT: Cập nhật vai trò của thành viên (admin/member)

module.exports = router;