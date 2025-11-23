// utils/auth.js (hoặc trong một file tiện ích khác của bạn)

export const getUserInfo = () => {
  try {
    const userInfoString = localStorage.getItem("userInfo");
    if (userInfoString) {
      return JSON.parse(userInfoString);
    }
    return null; // Trả về null nếu không tìm thấy dữ liệu
  } catch (error) {
    console.error("Lỗi khi đọc hoặc phân tích userInfo từ localStorage:", error);
    return null;
  }
};

export const removeUserInfo = () => {
  localStorage.removeItem("userInfo");
};