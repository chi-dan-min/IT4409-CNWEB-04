// src/components/MealPlan.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Users, Plus, ChefHat, Trash2, Edit, ShoppingCart, Copy, Download, Loader2, Eye } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Đảm bảo import Avatar
// Remove Dialog, DialogContent, etc. as they are now in SelectRecipeDialog
// Remove Input, ScrollArea, Label, Textarea, Select as they are now in SelectRecipeDialog

// Import component SelectRecipeDialog mới
import SelectRecipeDialog from "./SelectRecipeDialog"; // Điều chỉnh đường dẫn nếu cần
import RecipeDetailDialog from "../components/RecipeDetailDialog"; // Import RecipeDetailDialog

// Import các hàm và interface từ mealPlanService.ts
import {
  getMealPlans,
  createMealPlan,
  deleteMealPlan,
  suggestMealPlan,
  updateMealPlanEntry,
  addMealPlanEntry,
  deleteMealPlanEntry,
  getRecipes,
  RecipeData,
  MealEntry,
  MealPlanData,
  NewMealPlanData,
  SuggestedMealData
} from "@/services/mealPlanService";

const MealPlan = () => {
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [mealPlans, setMealPlans] = useState<MealPlanData[]>([]);
  const [currentMealPlan, setCurrentMealPlan] = useState<MealPlanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // States cho việc chọn công thức (vẫn giữ ở đây vì MealPlan quản lý dữ liệu chính)
  const [showSelectRecipeDialog, setShowSelectRecipeDialog] = useState(false);
  const [allRecipes, setAllRecipes] = useState<RecipeData[]>([]);
  const [filteredRecipes, setFilteredRecipes] = useState<RecipeData[]>([]);
  const [recipeSearchTerm, setRecipeSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedRecipeForMeal, setSelectedRecipeForMeal] = useState<RecipeData | null>(null);
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [currentMealType, setCurrentMealType] = useState<'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' | null>(null);
  const [currentMealEntryToEdit, setCurrentMealEntryToEdit] = useState<MealEntry | null>(null);
  const [notesForMeal, setNotesForMeal] = useState("");

  // States cho chi tiết công thức
  const [showRecipeDetailDialog, setShowRecipeDetailDialog] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeData | null>(null);

  const weekDays = ["Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy", "Chủ Nhật"];
  const mealTypes = [
    { key: "Breakfast" as const, label: "Sáng", icon: "🌅" },
    { key: "Lunch" as const, label: "Trưa", icon: "☀️" },
    { key: "Dinner" as const, label: "Tối", icon: "🌙" }
  ];

  // Lấy danh sách danh mục duy nhất từ recipes
  const categories = Array.from(new Set(allRecipes.map(recipe => recipe.category))).sort();

  const fetchAllRecipes = async () => {
    try {
      const data = await getRecipes({});
      setAllRecipes(data);
      setFilteredRecipes(data); // Khởi tạo filteredRecipes
    } catch (err: any) {
      console.error("Lỗi khi tải công thức:", err);
      setError(prev => prev || "Không thể tải danh sách công thức.");
    }
  };

  const fetchMealPlans = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getMealPlans();
      setMealPlans(data);
      if (data.length > 0) {
        setCurrentMealPlan(data[0]);
      } else {
        setCurrentMealPlan(null);
      }
    } catch (err: any) {
      setError(err.message || "Không thể tải kế hoạch bữa ăn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecipeDetail = (recipe: RecipeData) => {
    setSelectedRecipeDetail(recipe);
    setShowRecipeDetailDialog(true);
  };

  const handleCreateMealPlan = async (mealPlanData: NewMealPlanData) => {
    setLoading(true);
    setError("");
    try {
      const newMealPlan = await createMealPlan(mealPlanData);
      setMealPlans(prev => [newMealPlan, ...prev]);
      setCurrentMealPlan(newMealPlan);
      setError("");
    } catch (err: any) {
      setError(err.message || "Không thể tạo kế hoạch bữa ăn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddOrUpdateMealEntry = async () => {
    if (!currentMealPlan || !selectedRecipeForMeal || currentDayIndex === null || currentMealType === null) {
      setError("Vui lòng chọn công thức và đảm bảo dữ liệu hợp lệ. Hoặc bạn chưa chọn kế hoạch bữa ăn nào.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const { startOfWeek } = getWeekDateRange();
      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + currentDayIndex);
      targetDate.setHours(0, 0, 0, 0);

      const mealData = {
        date: targetDate.toISOString(),
        mealType: currentMealType,
        recipe: selectedRecipeForMeal._id,
        notes: notesForMeal
      };

      let updatedPlan;
      if (currentMealEntryToEdit && currentMealEntryToEdit._id) {
        updatedPlan = await updateMealPlanEntry(currentMealPlan._id, currentMealEntryToEdit._id, mealData);
      } else {
        updatedPlan = await addMealPlanEntry(currentMealPlan._id, mealData);
      }

      setCurrentMealPlan(updatedPlan);
      setShowSelectRecipeDialog(false);
      resetMealSelectionStates();
    } catch (err: any) {
      setError(err.message || "Không thể lưu bữa ăn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMealEntry = async (mealEntryId: string) => {
    if (!currentMealPlan) return;
    setLoading(true);
    setError("");
    try {
      const updatedPlan = await deleteMealPlanEntry(currentMealPlan._id, mealEntryId);
      setCurrentMealPlan(updatedPlan);
      setMealPlans(prev => prev.map(plan => plan._id === updatedPlan._id ? updatedPlan : plan));
    } catch (err: any) {
      setError(err.message || "Không thể xóa bữa ăn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMealPlan = async (id: string) => {
    setLoading(true);
    setError("");
    try {
      await deleteMealPlan(id);
      setMealPlans(prev => prev.filter(plan => plan._id !== id));
      if (currentMealPlan?._id === id) {
        const remaining = mealPlans.filter(plan => plan._id !== id);
        setCurrentMealPlan(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (err: any) {
      setError(err.message || "Không thể xóa kế hoạch bữa ăn");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSuggestedMeals = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await suggestMealPlan();
      return data;
    } catch (err: any) {
      setError(err.message || "Không thể lấy gợi ý bữa ăn");
      console.error(err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createShoppingList = async () => {
    if (!currentMealPlan) return;

    setLoading(true);
    setError("");
    try {
      const response = await fetch('/api/shoppinglists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('userToken')}`
        },
        body: JSON.stringify({
          mealPlanId: currentMealPlan._id,
          autoCreateShoppingList: true
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create shopping list');
      }

      console.log("Create shopping list for meal plan:", currentMealPlan._id);
    } catch (err: any) {
      setError(err.message || "Không thể tạo danh sách mua sắm");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMealPlans();
    fetchAllRecipes();
  }, []);

  useEffect(() => {
    let filtered = allRecipes;

    // Lọc theo từ khóa tìm kiếm
    if (recipeSearchTerm) {
      filtered = filtered.filter(recipe =>
        recipe.name.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(recipeSearchTerm.toLowerCase()) ||
        recipe.category.toLowerCase().includes(recipeSearchTerm.toLowerCase())
      );
    }

    // Lọc theo danh mục
    if (selectedCategory !== "all") {
      filtered = filtered.filter(recipe => recipe.category === selectedCategory);
    }

    setFilteredRecipes(filtered);
  }, [recipeSearchTerm, selectedCategory, allRecipes]);

  const getWeekDateRange = () => {
    const startOfWeek = new Date(selectedWeek);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return { startOfWeek, endOfWeek };
  };

  const getMealForDay = (dayIndex: number, mealType: string) => {
    if (!currentMealPlan) return null;

    const { startOfWeek } = getWeekDateRange();
    const targetDate = new Date(startOfWeek);
    targetDate.setDate(startOfWeek.getDate() + dayIndex);
    targetDate.setHours(0, 0, 0, 0);

    return currentMealPlan.meals?.find(meal =>
      meal.mealType === mealType &&
      new Date(meal.date).toDateString() === targetDate.toDateString()
    );
  };

  const handlePreviousWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(newDate);
  };

  const handleNextWeek = () => {
    const newDate = new Date(selectedWeek);
    newDate.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(newDate);
  };

  const handleCreateAutoMealPlan = async () => {
    if (!currentMealPlan) {
      setLoading(true);
      setError("");
      try {
        const newPlan = await createMealPlan({
          name: `Kế hoạch tuần ${new Date().toLocaleDateString('vi-VN')}`,
          type: "weekly",
          meals: [],
        });
        setCurrentMealPlan(newPlan);

        const suggestions = await getSuggestedMeals();
        if (suggestions?.suggestedMeals?.length > 0) {
          const mealsToAdd = suggestions.suggestedMeals.map(meal => ({
            date: meal.date,
            mealType: meal.mealType,
            recipe: meal.recipe,
            notes: meal.notes
          }));
          let updatedPlan = newPlan;
          for (const meal of mealsToAdd) {
            updatedPlan = await addMealPlanEntry(updatedPlan._id, meal);
          }
          setCurrentMealPlan(updatedPlan);
          setMealPlans(prev => prev.map(plan => plan._id === updatedPlan._id ? updatedPlan : plan));
        }
      } catch (err: any) {
        setError(err.message || "Không thể tạo kế hoạch bữa ăn hoặc lấy gợi ý");
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      const suggestions = await getSuggestedMeals();
      if (suggestions?.suggestedMeals?.length > 0) {
        const mealsToAdd = suggestions.suggestedMeals.map(meal => ({
          date: meal.date,
          mealType: meal.mealType,
          recipe: meal.recipe,
          notes: meal.notes
        }));

        setLoading(true);
        setError("");
        try {
          let updatedPlan = currentMealPlan;
          for (const meal of mealsToAdd) {
            updatedPlan = await addMealPlanEntry(updatedPlan._id, meal);
          }
          setCurrentMealPlan(updatedPlan);
          setMealPlans(prev => prev.map(plan => plan._id === updatedPlan._id ? updatedPlan : plan));
        } catch (err: any) {
          setError(err.message || "Không thể thêm gợi ý vào kế hoạch");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    }
  };

  const handleCopyFromPreviousWeek = async () => {
    if (!currentMealPlan) {
      setError("Không có kế hoạch bữa ăn nào để sao chép.");
      return;
    }

    const copiedMeals = currentMealPlan.meals?.map(meal => {
      const newDate = new Date(meal.date);
      newDate.setDate(newDate.getDate() + 7);

      return {
        date: newDate.toISOString(),
        mealType: meal.mealType,
        recipe: typeof meal.recipe === 'string' ? meal.recipe : meal.recipe._id || '',
        notes: meal.notes
      };
    }) || [];

    setLoading(true);
    setError("");
    try {
      await handleCreateMealPlan({
        name: `Sao chép từ ${currentMealPlan.name} (Tuần sau)`,
        type: "weekly",
        meals: copiedMeals
      });
      handleNextWeek();
    } catch (err: any) {
      setError(err.message || "Không thể sao chép kế hoạch từ tuần trước");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSelectRecipeDialog = (dayIndex: number, mealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack', existingMeal?: MealEntry) => {
    if (!currentMealPlan) {
      setError("Bạn cần tạo hoặc chọn một kế hoạch bữa ăn trước khi thêm món.");
      return;
    }
    setCurrentDayIndex(dayIndex);
    setCurrentMealType(mealType);
    setCurrentMealEntryToEdit(existingMeal || null);
    if (existingMeal && typeof existingMeal.recipe === 'object') {
      setSelectedRecipeForMeal(existingMeal.recipe);
      setNotesForMeal(existingMeal.notes || "");
    } else {
      setSelectedRecipeForMeal(null);
      setNotesForMeal("");
    }
    setRecipeSearchTerm("");
    setSelectedCategory("all"); // Reset category on dialog open
    setFilteredRecipes(allRecipes); // Reset filtered recipes
    setShowSelectRecipeDialog(true);
  };

  const resetMealSelectionStates = () => {
    setSelectedRecipeForMeal(null);
    setCurrentDayIndex(null);
    setCurrentMealType(null);
    setCurrentMealEntryToEdit(null);
    setNotesForMeal("");
    setRecipeSearchTerm("");
    setSelectedCategory("all");
    setFilteredRecipes(allRecipes);
  };

  const { startOfWeek, endOfWeek } = getWeekDateRange();

  if (loading && !currentMealPlan && mealPlans.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Đang tải kế hoạch bữa ăn...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
    <h1 className="text-2xl font-bold">Kế hoạch bữa ăn</h1>
    <div className="flex gap-2">
      {/* Nút "Tạo kế hoạch mới" sẽ chỉ hiển thị khi KHÔNG CÓ currentMealPlan */}
      {!currentMealPlan && (
        <Button onClick={handleCreateAutoMealPlan} disabled={loading} size="sm" className="flex items-center gap-1">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Tạo kế hoạch mới
        </Button>
      )}

      {/* Nút "Xóa Kế hoạch" sẽ hiển thị khi CÓ currentMealPlan */}
      {currentMealPlan && (
        <Button variant="outline" onClick={() => currentMealPlan?._id && handleDeleteMealPlan(currentMealPlan._id)} disabled={loading} size="sm" className="flex items-center gap-1 text-red-500 hover:bg-red-50">
          <Trash2 className="h-4 w-4" /> Xóa Kế hoạch
        </Button>
      )}
    </div>
  </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Conditional rendering for Week Navigation and Meal Plan Grid */}
      {currentMealPlan ? (
        <>
          {/* Week Navigation */}
          <div className="flex items-center justify-between py-3 border-b">
            <Button variant="ghost" onClick={handlePreviousWeek} size="sm">
              ← Trước
            </Button>
            <span className="font-medium">
              <Calendar className="inline-block h-4 w-4 mr-1 text-gray-500" />
              {startOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {endOfWeek.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
            </span>
            <Button variant="ghost" onClick={handleNextWeek} size="sm">
              Sau →
            </Button>
          </div>

          {/* Weekly Meal Plan Grid */}
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDays.map((day, dayIndex) => {
              const dayDate = new Date(startOfWeek);
              dayDate.setDate(startOfWeek.getDate() + dayIndex);

              return (
                <Card key={day} className="min-h-[280px] flex flex-col">
    <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{day}</CardTitle>
        <CardDescription className="text-xs">
            {dayDate.getDate()}/{dayDate.getMonth() + 1}
        </CardDescription>
    </CardHeader>
    <CardContent className="space-y-2 flex-grow">
        {mealTypes.map((mealType) => {
            const meal = getMealForDay(dayIndex, mealType.key);

            return (
                <div key={mealType.key}>
                    <div className="flex items-center gap-1 mb-1">
                        <span className="text-xs font-medium">{mealType.label}</span>
                        <span className="text-xs">{mealType.icon}</span>
                    </div>
                    {meal ? (
                        <div className="p-2 bg-gray-50 rounded text-xs relative group">
                            <p className="font-medium truncate">
                                {typeof meal.recipe === 'object' ? meal.recipe.name : "Đang tải..."}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-gray-500">
                                <span><Clock className="inline-block h-3 w-3 mr-1" /> {typeof meal.recipe === 'object' ? meal.recipe.cookTime || 0 : 0}</span>
                                <span><Users className="inline-block h-3 w-3 mr-1" /> {typeof meal.recipe === 'object' ? meal.recipe.servings || 1 : 1} người</span>
                            </div>
                            {meal.notes && (
                                <p className="text-gray-600 text-xs mt-1 italic truncate">Ghi chú: {meal.notes}</p>
                            )}

                            {/* Nút xem chi tiết (Eye) luôn hiển thị ở góc trên bên phải */}
                            <Button
                                variant="ghost"
                                size="icon"
                                className="absolute top-1 right-1 h-6 w-6" // Điều chỉnh kích thước nút và vị trí
                                onClick={() => handleViewRecipeDetail(meal.recipe)}
                            >
                                <Eye className="h-3 w-3" /> {/* Icon xem chi tiết */}
                            </Button>

                            {/* Các nút chỉnh sửa (Edit) và xóa (Trash2) hiển thị khi hover, nằm bên trái nút Eye */}
                            <div className="absolute top-1 right-8 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6" // Điều chỉnh kích thước nút
                                    onClick={() => handleOpenSelectRecipeDialog(dayIndex, mealType.key, meal)}
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6" // Điều chỉnh kích thước nút
                                    onClick={() => meal._id && handleDeleteMealEntry(meal._id)}
                                >
                                    <Trash2 className="h-3 w-3 text-red-500" />
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-8 text-xs border border-dashed"
                            onClick={() => handleOpenSelectRecipeDialog(dayIndex, mealType.key)}
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Thêm
                        </Button>
                    )}
                </div>
            );
        })}
    </CardContent>
</Card>
              );
            })}
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center p-8">
          <Card className="w-full max-w-lg text-center shadow-lg">
            <CardHeader>
              <ChefHat className="h-10 w-10 mx-auto text-gray-400 mb-4" />
              <CardTitle className="text-xl font-semibold mb-2">Chưa có kế hoạch bữa ăn nào</CardTitle>
              <CardDescription className="text-gray-600">
                Hãy bắt đầu hành trình ẩm thực của bạn bằng cách tạo một kế hoạch bữa ăn mới.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleCreateAutoMealPlan} disabled={loading} size="lg">
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Plus className="h-5 w-5 mr-2" />}
                Tạo kế hoạch mới
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sử dụng component SelectRecipeDialog mới */}
      <SelectRecipeDialog
        isOpen={showSelectRecipeDialog}
        onClose={() => { setShowSelectRecipeDialog(false); resetMealSelectionStates(); }}
        allRecipes={allRecipes}
        filteredRecipes={filteredRecipes}
        recipeSearchTerm={recipeSearchTerm}
        onRecipeSearchTermChange={setRecipeSearchTerm}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        selectedRecipeForMeal={selectedRecipeForMeal}
        onSelectRecipe={setSelectedRecipeForMeal}
        notesForMeal={notesForMeal}
        onNotesChange={setNotesForMeal}
        loading={loading}
        currentMealEntryToEdit={currentMealEntryToEdit}
        onSave={handleAddOrUpdateMealEntry}
      />

      {selectedRecipeDetail && (
        <RecipeDetailDialog
          showRecipeDetailDialog={showRecipeDetailDialog}
          setShowRecipeDetailDialog={setShowRecipeDetailDialog}
          selectedRecipeDetail={selectedRecipeDetail}
        />
      )}

    </div>
  );
};

export default MealPlan;