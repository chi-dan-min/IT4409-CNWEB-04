// src/services/mealPlanService.ts

// --- Types for Data (copied from MealPlan component for service's internal use) ---
export interface RecipeData {
    _id: string;
    name: string;
    cookTime: number;
    servings: number;
    description: string;
    category: string;
    image?: string;
    difficulty?: string;
    rating?: number;
    // Thêm các trường khác của Recipe nếu có
}

// Khi frontend gửi dữ liệu lên, recipe là ID (string)
export interface MealEntryRequestBody {
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    recipe: string; // Chỉ là ID khi gửi đi
    notes?: string;
}

// Khi frontend nhận dữ liệu về, recipe đã được populate (RecipeData)
export interface MealEntry {
    _id?: string;
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    recipe: RecipeData; // Đã được populate khi nhận về
    notes?: string;
}

export interface MealPlanData {
    _id: string;
    user: string;
    name: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom'; // Cập nhật các loại nếu có
    meals: MealEntry[]; // Mảng các MealEntry đã được populate
    familyGroup?: string; // ID của FamilyGroup nếu có
    createdAt: string;
    updatedAt: string;
}

export interface NewMealPlanData {
    name: string;
    type: 'daily' | 'weekly' | 'monthly' | 'custom'; // Cập nhật các loại nếu có
    meals?: MealEntryRequestBody[]; // Mảng các bữa ăn, có thể rỗng khi tạo ban đầu
    autoCreateShoppingList?: boolean;
    familyGroupId?: string | null; // ID của nhóm gia đình hoặc null cho cá nhân
}

export interface UpdateMealPlanData {
    name?: string;
    type?: 'daily' | 'weekly' | 'monthly' | 'custom';
    familyGroupId?: string | null; // Cho phép chuyển kế hoạch giữa các nhóm hoặc về cá nhân
}

export interface SuggestedMealData {
    date: string;
    mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    recipe: string; // Ở đây vẫn là ID vì service trả về ID
    notes?: string;
}

// --- API Configurations ---
const API_URL = '/api/mealplans';
const RECIPE_API_URL = '/api/recipes'; // Endpoint cho công thức

const getToken = (): string => {
    const token = localStorage.getItem('userToken');
    if (!token) {
        // Có thể ném lỗi hoặc chuyển hướng đến trang đăng nhập ở đây
        // throw new Error("No authentication token found. Please log in.");
        console.error("No authentication token found. Please log in.");
        return ''; // Trả về rỗng và để các hàm gọi xử lý
    }
    return token;
};

const getConfig = () => {
    const token = getToken();
    if (!token) {
        // Tùy chọn: ném lỗi nếu không có token, hoặc để các hàm gọi kiểm tra
        throw new Error("Authentication required.");
    }
    return {
        headers: {
            'Content-Type': 'application/json', // Mặc định là JSON cho các request có body
            Authorization: `Bearer ${token}`,
        },
    };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `API call failed with status ${response.status}`);
    }
    return response.json();
};

// --- Meal Plan API Functions ---

export const getMealPlans = async (familyGroupId?: string | null): Promise<MealPlanData[]> => {
    const url = familyGroupId ? `${API_URL}?familyGroupId=${familyGroupId}` : API_URL;
    const response = await fetch(url, {
        headers: getConfig().headers
    });
    return handleResponse(response);
};

export const createMealPlan = async (mealPlanData: NewMealPlanData): Promise<MealPlanData> => {
    const config = getConfig();
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: config.headers, // headers đã bao gồm 'Content-Type': 'application/json'
        body: JSON.stringify(mealPlanData)
    });
    return handleResponse(response);
};

export const updateMealPlan = async (
    id: string,
    updateData: UpdateMealPlanData
): Promise<MealPlanData> => {
    const config = getConfig();
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify(updateData)
    });
    return handleResponse(response);
};


export const deleteMealPlan = async (id: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: getConfig().headers
    });
    return handleResponse(response);
};

export const suggestMealPlan = async (familyGroupId?: string | null): Promise<{ suggestedMeals: SuggestedMealData[], availableRecipes: RecipeData[] }> => {
    const url = familyGroupId ? `${API_URL}/suggest?familyGroupId=${familyGroupId}` : `${API_URL}/suggest`;
    const response = await fetch(url, {
        headers: getConfig().headers
    });
    return handleResponse(response);
};

// --- Meal Entry API Functions ---

export const updateMealPlanEntry = async (
    mealPlanId: string,
    mealEntryId: string,
    updatedEntry: MealEntryRequestBody // Đảm bảo chỉ gửi ID công thức
): Promise<MealPlanData> => {
    const config = getConfig();
    const response = await fetch(`${API_URL}/${mealPlanId}/meals/${mealEntryId}`, {
        method: 'PUT',
        headers: config.headers,
        body: JSON.stringify(updatedEntry)
    });
    return handleResponse(response);
};

export const addMealPlanEntry = async (
    mealPlanId: string,
    newEntry: MealEntryRequestBody // Đảm bảo chỉ gửi ID công thức
): Promise<MealPlanData> => {
    const config = getConfig();
    const response = await fetch(`${API_URL}/${mealPlanId}/meals`, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(newEntry)
    });
    return handleResponse(response);
};

export const deleteMealPlanEntry = async (mealPlanId: string, mealEntryId: string): Promise<MealPlanData> => {
    const response = await fetch(`${API_URL}/${mealPlanId}/meals/${mealEntryId}`, {
        method: 'DELETE',
        headers: getConfig().headers
    });
    return handleResponse(response);
};

// --- Recipe API Functions ---

export const getRecipes = async (): Promise<RecipeData[]> => {
    try {
        const response = await fetch(RECIPE_API_URL, {
            headers: getConfig().headers
        });
        return handleResponse(response);
    } catch (error) {
        console.error("Error fetching recipes:", error);
        throw error;
    }
};