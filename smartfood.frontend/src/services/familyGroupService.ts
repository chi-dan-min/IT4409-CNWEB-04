// src/services/familyGroupService.js
import axios from 'axios';

// Thay thế bằng URL backend của bạn
const API_URL = import.meta.env.VITE_BACKEND_URL || '/api'; // Ví dụ nếu bạn dùng Vite

// Lấy token từ localStorage (hoặc nơi bạn lưu trữ token)
const getToken = () => {
  // Lấy token trực tiếp từ khóa 'userToken'
  const token = localStorage.getItem('userToken');
  console.log('Token from userToken key:', token); // DEBUG
  if (token) {
    return token;
  }
  console.log('No token found in localStorage under key "userToken".'); // DEBUG
  return null;
};

const config = () => {
  const token = getToken();
  if (!token) {
    throw new Error("No authorization token available. Please log in.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Lấy tất cả nhóm gia đình mà người dùng thuộc về
const getFamilyGroups = async () => {
  const response = await axios.get(`${API_URL}/family-groups`, config());
  return response.data;
};

// Tạo nhóm gia đình mới
const createFamilyGroup = async (name) => {
  const response = await axios.post(`${API_URL}/family-groups`, { name }, config());
  return response.data;
};

// Mời thành viên vào nhóm
const inviteMember = async (groupId, email) => {
  // Đã sửa cú pháp URL
  const response = await axios.post(`${API_URL}/family-groups/${groupId}/invite`, { email }, config());
  return response.data;
};

// Xóa thành viên khỏi nhóm
const removeMember = async (groupId, memberId) => {
  // Đã sửa cú pháp URL
  const response = await axios.delete(`${API_URL}/family-groups/${groupId}/members/${memberId}`, config());
  return response.data;
};

// Cập nhật vai trò thành viên
const updateMemberRole = async (groupId, memberId, role) => {
  // Đã sửa cú pháp URL
  const response = await axios.put(`${API_URL}/family-groups/${groupId}/members/${memberId}`, { role }, config());
  return response.data;
};

const familyGroupService = {
  getFamilyGroups,
  createFamilyGroup,
  inviteMember,
  removeMember,
  updateMemberRole,
};

export default familyGroupService;