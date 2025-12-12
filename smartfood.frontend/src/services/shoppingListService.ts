// src/services/shoppingListService.ts
import axios from 'axios';

const API_BASE_URL = '/api'; // Đổi thành URL gốc của API của bạn

// Tạo một instance Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Thêm interceptor để tự động gắn token vào mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Định nghĩa các interface cho dữ liệu trả về và gửi đi
interface ShoppingItem {
  _id?: string; // Optional if not yet saved to DB
  name: string;
  quantity: number;
  unit: string;
  isPurchased: boolean;
  category?: string; // Add if your schema supports it
}

interface ShoppingList {
  _id: string;
  user: string; // User ID of the creator
  name: string;
  type: string;
  items: ShoppingItem[];
  familyGroup: string | null; // Null if it's a personal list
  createdAt: string;
  updatedAt: string;
}

interface CreateShoppingListData {
  name: string;
  type: string;
  items?: ShoppingItem[];
  familyGroupId?: string | null; // Use familyGroupId for consistency with backend
}

interface UpdateShoppingListData {
  name?: string;
  type?: string;
  items?: ShoppingItem[];
  familyGroupId?: string | null; // Use familyGroupId for consistency with backend
}

interface ShareShoppingListResponse {
  message: string;
  updatedList: ShoppingList;
}

const shoppingListService = {
  /**
   * Lấy tất cả danh sách mua sắm, có thể lọc theo ID nhóm gia đình.
   * @param familyGroupId (Optional) ID của nhóm gia đình để lọc danh sách.
   * @returns Promise chứa mảng các ShoppingList.
   */
  getShoppingLists: async (familyGroupId?: string | null): Promise<ShoppingList[]> => {
    const url = familyGroupId ? `/shoppinglists?familyGroupId=${familyGroupId}` : '/shoppinglists';
    const response = await api.get(url);
    return response.data;
  },

  /**
   * Tạo một danh sách mua sắm mới (cá nhân hoặc cho một nhóm gia đình).
   * @param listData Dữ liệu của danh sách mới, bao gồm tên, loại, các mặt hàng và optional familyGroupId.
   * @returns Promise chứa ShoppingList đã được tạo.
   */
  createShoppingList: async (listData: CreateShoppingListData): Promise<ShoppingList> => {
    const response = await api.post('/shoppinglists', listData);
    return response.data;
  },

  /**
   * Cập nhật một danh sách mua sắm hiện có.
   * @param listId ID của danh sách cần cập nhật.
   * @param updatedData Dữ liệu cần cập nhật (tên, loại, mặt hàng, familyGroupId).
   * @returns Promise chứa ShoppingList đã được cập nhật.
   */
  updateShoppingList: async (listId: string, updatedData: UpdateShoppingListData): Promise<ShoppingList> => {
    const response = await api.put(`/shoppinglists/${listId}`, updatedData);
    return response.data;
  },

  /**
   * Xóa một danh sách mua sắm.
   * @param listId ID của danh sách cần xóa.
   * @returns Promise chứa thông báo xác nhận.
   */
  deleteShoppingList: async (listId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/shoppinglists/${listId}`);
    return response.data;
  },

  /**
   * Gán một danh sách đi chợ (cá nhân hoặc của nhóm khác) cho một nhóm gia đình cụ thể.
   * Tương ứng với hàm `submitShare` ở backend.
   * @param shoppingListId ID của danh sách đi chợ cần gán/chia sẻ.
   * @param familyGroupId ID của nhóm gia đình đích.
   * @returns Promise chứa thông tin về việc gán thành công và danh sách đã cập nhật.
   */
  shareShoppingListToGroup: async (shoppingListId: string, familyGroupId: string): Promise<ShareShoppingListResponse> => {
    const response = await api.put('/shoppinglists/share', { shoppingListId, familyGroupId });
    return response.data;
  },
};

export default shoppingListService;