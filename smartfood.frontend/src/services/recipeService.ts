// src/services/recipeService.ts
import axios from 'axios';

const API_URL = '/api/recipes'; // Đây là địa chỉ API cho các công thức nấu ăn

const getToken = () => {
    return localStorage.getItem('userToken');
};

const getConfig = () => {
    const token = getToken();
    if (!token) {
        console.error("No authentication token found.");
        // Thay vì throw error, bạn có thể chuyển hướng người dùng đến trang đăng nhập
        // hoặc xử lý lỗi một cách thân thiện hơn với người dùng.
        // For simplicity, we throw here.
        throw new Error("No authentication token found.");
    }
    return {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
};

// Định nghĩa kiểu dữ liệu cho một mục nguyên liệu
export interface IngredientItem {
    name: string;
    quantity: number;
    unit: string;
}

export interface RecipeData {
    _id: string; // Đổi id thành _id để khớp với MongoDB ObjectId
    name: string;
    description: string; // Thêm trường description
    image: string; // Thêm trường image (ví dụ: emoji)
    cookTime: string; // Thêm trường cookTime
    servings: number; // Thêm trường servings
    rating: number; // Thêm trường rating
    difficulty: "Dễ" | "Trung bình" | "Khó"; // Thêm trường difficulty
    ingredients: IngredientItem[]; // Cập nhật để phù hợp với schema mới
    instructions: string; // Thêm trường instructions
    category?: string;
    isFavorite?: boolean;
    isPopular?: boolean;
    user?: string; // ID của người dùng tạo công thức
    createdAt?: string;
    updatedAt?: string;
    availableIngredients?: string[]; // Các trường này được tính toán bởi backend trong gợi ý
    missingIngredients?: string[];
}

// Định nghĩa kiểu dữ liệu cho Recipe khi tạo mới (không cần _id, createdAt, updatedAt, user, availableIngredients, missingIngredients)
export type NewRecipeData = Omit<RecipeData, '_id' | 'isFavorite' | 'isPopular' | 'user' | 'createdAt' | 'updatedAt' | 'availableIngredients' | 'missingIngredients'>;

// Định nghĩa kiểu dữ liệu cho SuggestedRecipe (tương tự RecipeData nhưng có thêm các trường gợi ý)
export interface SuggestedRecipe extends RecipeData {
    missingIngredients: string[];
    availableIngredients: string[];
}

/**
 * @desc Lấy tất cả công thức nấu ăn, có thể có các query params cho tìm kiếm/lọc
 * @param params Các tham số truy vấn (ví dụ: search, category, difficulty, ...)
 * @returns Promise<RecipeData[]>
 */
const getRecipes = async (params?: { search?: string; category?: string; difficulty?: string }): Promise<RecipeData[]> => {
    const response = await axios.get(API_URL, { ...getConfig(), params });
    return response.data;
};

/**
 * @desc Lấy chi tiết một công thức theo ID
 * @param id ID của công thức
 * @returns Promise<RecipeData>
 */
const getRecipeById = async (id: string): Promise<RecipeData> => {
    const response = await axios.get(`${API_URL}/${id}`, getConfig());
    return response.data;
};

/**
 * @desc Lấy danh sách các công thức gợi ý dựa trên nguyên liệu người dùng có
 * @returns Promise<SuggestedRecipe[]>
 */
const getSuggestedRecipes = async (): Promise<SuggestedRecipe[]> => {
    const response = await axios.get(`${API_URL}/suggest`, getConfig());
    return response.data;
};

/**
 * @desc Cập nhật trạng thái yêu thích của một công thức
 * @param id ID của công thức
 * @param isFavorite Trạng thái yêu thích mới
 * @returns Promise<RecipeData>
 * (Backend cần có endpoint PUT hoặc POST để xử lý yêu thích)
 */
const toggleFavoriteRecipe = async (id: string, isFavorite: boolean): Promise<RecipeData> => {
    const response = await axios.put(`${API_URL}/${id}/favorite`, { isFavorite }, getConfig());
    return response.data;
};

/**
 * @desc Tạo một công thức nấu ăn mới
 * @param recipeData Dữ liệu công thức cần tạo
 * @returns Promise<RecipeData>
 */
const createRecipe = async (recipeData: NewRecipeData): Promise<RecipeData> => {
    const response = await axios.post(API_URL, recipeData, getConfig());
    return response.data;
};

export { getRecipes, getRecipeById, getSuggestedRecipes, toggleFavoriteRecipe, createRecipe };