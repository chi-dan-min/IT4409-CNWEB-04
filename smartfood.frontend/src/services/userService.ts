import axios from 'axios';

const API_URL = '/api/users'; // URL của API backend

// Hàm để lấy token từ localStorage
const getToken = () => {
  const userInfoString = localStorage.getItem('userInfo');
  if (userInfoString) {
    try {
      const userInfo = JSON.parse(userInfoString);
      return userInfo.token;
    } catch (error) {
      console.error("Failed to parse userInfo from localStorage", error);
      return null;
    }
  }
  return null;
};

// Cấu hình header với token xác thực
const config = () => {
  const token = getToken();
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Lấy tất cả người dùng
const getUsers = async () => {
  try {
    const response = await axios.get(API_URL, config());
    // Backend trả về `username` thay vì `name`, cần ánh xạ lại
    return response.data.map((user: any) => ({
      id: user._id,
      name: user.username, // Ánh xạ username thành name cho frontend
      email: user.email,
      role: user.role,
      // ĐÃ BỎ TRƯỜNG 'status' ở đây
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

// Lấy người dùng theo ID
const getUserById = async (id: string) => {
  try {
    const response = await axios.get(`${API_URL}/${id}`, config());
    const user = response.data;
    return {
      id: user._id,
      name: user.username,
      email: user.email,
      role: user.role,
      // ĐÃ BỎ TRƯỜNG 'status' ở đây
    };
  } catch (error) {
    console.error(`Error fetching user with ID ${id}:`, error);
    throw error;
  }
};

// Tạo người dùng mới
const createUser = async (userData: { username: string; email: string; password?: string; role?: string }) => {
  try {
    const response = await axios.post(API_URL, userData, config());
    const newUser = response.data;
    return {
      id: newUser._id,
      name: newUser.username,
      email: newUser.email,
      role: newUser.role,
      // ĐÃ BỎ TRƯỜNG 'status' ở đây
    };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
};

// Cập nhật người dùng
const updateUser = async (id: string, userData: { username?: string; email?: string; password?: string; role?: string }) => {
  try {
    const response = await axios.put(`${API_URL}/${id}`, userData, config());
    const updatedUser = response.data;
    return {
      id: updatedUser._id,
      name: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      // ĐÃ BỎ TRƯỜNG 'status' ở đây
    };
  } catch (error) {
    console.error(`Error updating user with ID ${id}:`, error);
    throw error;
  }
};

// Xóa người dùng
const deleteUser = async (id: string) => {
  try {
    await axios.delete(`${API_URL}/${id}`, config());
    return true; // Trả về true nếu xóa thành công
  } catch (error) {
    console.error(`Error deleting user with ID ${id}:`, error);
    throw error;
  }
};

const userService = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};

export default userService;