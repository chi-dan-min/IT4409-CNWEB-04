const asyncHandler = require('express-async-handler'); // Đảm bảo bạn đã cài gói này: npm install express-async-handler
const User = require('../models/User');

// @desc    Lấy tất cả người dùng
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
  // Tìm tất cả người dùng, loại bỏ trường password
  // Bạn có thể thêm các tùy chọn lọc, phân trang nếu cần
  const users = await User.find({}).select('-password');
  res.json(users);
});

// @desc    Lấy người dùng theo ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');

  if (user) {
    res.json(user);
  } else {
    // asyncHandler sẽ bắt lỗi này và chuyển đến middleware xử lý lỗi
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Tạo người dùng mới
// @route   POST /api/users
// @access  Private/Admin
const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.body;

  // Kiểm tra email hoặc username đã tồn tại chưa
  const userExists = await User.findOne({ $or: [{ email }, { username }] });

  if (userExists) {
    res.status(400); // Bad Request
    throw new Error('User with that email or username already exists');
  }

  // Tạo người dùng mới
  const user = await User.create({
    username,
    email,
    password, // Password sẽ được hash bởi middleware pre-save trong User model
    role: role || 'user', // Mặc định là 'user' nếu không cung cấp role
  });

  if (user) {
    res.status(201).json({ // 201 Created
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Cập nhật thông tin người dùng
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Cập nhật các trường được phép
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email;
    user.role = req.body.role || user.role; // Cho phép cập nhật role

    // Nếu có password mới, hash nó (middleware pre-save của model sẽ lo)
    if (req.body.password) {
      user.password = req.body.password; 
    }

    const updatedUser = await user.save();

    res.json({
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
    });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Xóa người dùng
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (user) {
    // Optional: Ngăn admin tự xóa tài khoản của mình
    if (req.user._id.toString() === user._id.toString()) {
      res.status(400);
      throw new Error('You cannot delete your own admin account through this endpoint.');
    }

    await User.deleteOne({ _id: req.params.id }); // Sử dụng deleteOne cho Mongoose 6+
    res.json({ message: 'User removed successfully' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};