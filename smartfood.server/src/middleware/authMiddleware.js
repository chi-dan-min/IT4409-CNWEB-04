// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const FamilyGroup = require('../models/FamilyGroup'); // Import FamilyGroup model
require('dotenv').config();

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        res.status(401).json({ message: 'Not authorized, user not found' });
        return; // Dừng lại nếu không tìm thấy user
      }

      // --- BẮT ĐẦU PHẦN CẬP NHẬT: Populate thông tin nhóm gia đình vào req.user ---
      // Tìm tất cả các nhóm gia đình mà người dùng hiện tại là thành viên
      const userFamilyGroups = await FamilyGroup.find({ 'members.user': req.user._id });

      // Định dạng lại để dễ sử dụng ở frontend (chỉ cần _id và vai trò)
      req.user.memberOfFamilyGroups = userFamilyGroups.map(group => ({
        _id: group._id,
        name: group.name,
        // Có thể thêm vai trò của người dùng trong nhóm này nếu cần
        role: group.members.find(m => m.user.toString() === req.user._id.toString())?.role
      }));
      // --- KẾT THÚC PHẦN CẬP NHẬT ---

      next();
    } catch (error) {
      console.error(error);
      // Đảm bảo gửi mã lỗi 401 nếu xác thực thất bại
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  } else {
    // Nếu không có token, gửi lỗi 401
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Not authorized as an admin' });
  }
};

module.exports = { protect, admin };