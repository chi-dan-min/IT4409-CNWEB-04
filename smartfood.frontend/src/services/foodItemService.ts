import axios from "axios";

const API_URL = "/api/fooditems"; // Đảm bảo đây là địa chỉ API chính xác của bạn

const getToken = () => {
  // Lấy token xác thực từ localStorage hoặc nơi bạn lưu trữ nó sau khi đăng nhập
  return localStorage.getItem("userToken");
};

const getConfig = () => {
  const token = getToken();
  if (!token) {
    console.error("Không tìm thấy token xác thực. Vui lòng đăng nhập.");
    // Trong ứng dụng thực tế, bạn có thể chuyển hướng người dùng đến trang đăng nhập ở đây
    throw new Error("Không có token xác thực.");
  }
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// Định nghĩa kiểu dữ liệu cho Food Item khi gửi đi hoặc nhận về
export interface FoodItemData {
  _id?: string; // ID từ MongoDB, optional khi tạo mới
  name: string;
  quantity: number;
  unit: string;
  category?: string; // Tùy chọn
  expiryDate: string; // Sẽ là ISO string khi truyền qua API
  storageLocation: string;
  isExpired?: boolean; // Mặc định là false, có thể được gửi đi khi cập nhật
  createdAt?: string; // Tự động thêm bởi backend
  updatedAt?: string; // Tự động thêm bởi backend
}

/**
 * @desc Lấy tất cả thực phẩm trong tủ lạnh của người dùng
 * @returns Promise<FoodItemData[]>
 */
const getFoodItems = async (): Promise<FoodItemData[]> => {
  const response = await axios.get(API_URL, getConfig());
  return response.data;
};

/**
 * @desc Tạo một thực phẩm mới thủ công
 * @param foodItem Dữ liệu thực phẩm cần tạo
 * @returns Promise<FoodItemData>
 */
const createFoodItem = async (
  foodItem: Omit<FoodItemData, "_id" | "createdAt" | "updatedAt" | "isExpired">
): Promise<FoodItemData> => {
  const response = await axios.post(API_URL, foodItem, getConfig());
  return response.data;
};

/**
 * @desc Cập nhật một thực phẩm hiện có
 * @param id ID của thực phẩm cần cập nhật
 * @param updatedData Dữ liệu cập nhật
 * @returns Promise<FoodItemData>
 */
const updateFoodItem = async (
  id: string,
  updatedData: Partial<Omit<FoodItemData, "_id" | "createdAt" | "updatedAt">>
): Promise<FoodItemData> => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    updatedData,
    getConfig()
  );
  return response.data;
};

/**
 * @desc Xóa một thực phẩm
 * @param id ID của thực phẩm cần xóa
 * @returns Promise<any>
 */
const deleteFoodItem = async (id: string) => {
  const response = await axios.delete(`${API_URL}/${id}`, getConfig());
  return response.data;
};

/**
 * @desc Lấy các thực phẩm sắp hết hạn
 * @returns Promise<FoodItemData[]>
 */
const getExpiringFoodItems = async (): Promise<FoodItemData[]> => {
  const response = await axios.get(`${API_URL}/expiring`, getConfig());
  return response.data;
};

/**
 * @desc Thêm một thực phẩm vào tủ lạnh từ một mục trong danh sách mua sắm
 * @param data Chứa shoppingItemId, expiryDate và storageLocation
 * @returns Promise<FoodItemData>
 */
const addFoodItemFromShoppingList = async (data: {
  shoppingItemId: string;
  expiryDate: string;
  storageLocation: string;
}): Promise<FoodItemData> => {
  const response = await axios.post(
    `${API_URL}/from-shoppinglist`,
    data,
    getConfig()
  );
  return response.data;
};

// Export tất cả các hàm để có thể sử dụng ở các component khác
export {
  getFoodItems,
  createFoodItem,
  updateFoodItem,
  deleteFoodItem,
  getExpiringFoodItems,
  addFoodItemFromShoppingList,
};
