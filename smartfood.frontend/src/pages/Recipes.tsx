import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChefHat, Clock, Users, Search, Refrigerator, Star, Plus, X } from "lucide-react";

import {
  getRecipes,
  getSuggestedRecipes,
  createRecipe,
  NewRecipeData,
  IngredientItem,
  RecipeData,
  SuggestedRecipe
} from "@/services/recipeService";
import { getUserInfo } from '../utils/auth'; // Đảm bảo đường dẫn đúng

// --- Component con: OverviewCards ---
// Truyền thêm prop isUserAdmin vào đây
const OverviewCards = ({ recipes, canMakeRecipesCount, smartSuggestedRecipesLength, isUserAdmin }) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <Card className="border border-blue-200 shadow-sm bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-700">Tổng công thức</p>
            <p className="text-3xl font-bold text-blue-900 mt-1">{recipes.length}</p>
          </div>
          <ChefHat className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>

    {/* ẨN "Có thể nấu ngay" nếu là admin */}
    {!isUserAdmin && (
      <Card className="border border-green-200 shadow-sm bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700">Có thể nấu ngay</p>
              <p className="text-3xl font-bold text-green-900 mt-1">{canMakeRecipesCount}</p>
            </div>
            <Refrigerator className="h-8 w-8 text-green-600" />
          </div>
        </CardContent>
      </Card>
    )}

    {/* ẨN "Gợi ý thông minh" nếu là admin */}
    {!isUserAdmin && (
      <Card className="border border-purple-200 shadow-sm bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700">Gợi ý thông minh</p>
              <p className="text-3xl font-bold text-purple-900 mt-1">{smartSuggestedRecipesLength}</p>
            </div>
            <Star className="h-8 w-8 text-purple-600" />
          </div>
        </CardContent>
      </Card>
    )}
  </div>
);

// --- Component con: RecipeList ---
// Giữ nguyên RecipeList vì việc ẩn thông tin suggestion sẽ được xử lý ở component cha Recipes
const RecipeList = ({ title, description, recipesToDisplay, suggestedRecipes, handleViewRecipeDetail }) => {
  const [showAll, setShowAll] = useState(false);
  const initialDisplayLimit = 3;

  const recipesToShow = showAll ? recipesToDisplay : recipesToDisplay.slice(0, initialDisplayLimit);
  const hasMoreRecipes = recipesToDisplay.length > initialDisplayLimit;

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-white p-3 border-b border-gray-100">
        <CardTitle className="flex items-center gap-1 text-lg font-semibold text-gray-800">
          {title.includes("Gợi ý thông minh") ? <Star className="h-4 w-4 text-purple-600" /> : <ChefHat className="h-4 w-4 text-gray-700" />}
          {title}
        </CardTitle>
        <CardDescription className="text-gray-600 text-xs">{description}</CardDescription>
      </CardHeader>
      <CardContent className="p-4">
        {recipesToDisplay.length === 0 ? (
          <p className="text-gray-500 text-center py-3 text-sm">Không tìm thấy công thức nào.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recipesToShow.map((recipe) => {
                // Lấy thông tin gợi ý chỉ khi cần
                const suggestion = suggestedRecipes?.find(s => s._id === recipe._id);
                const availableIngredients = suggestion?.availableIngredients || [];
                const missingIngredients = suggestion?.missingIngredients || [];

                const shortDescription = recipe.description && recipe.description.length > 70
                  ? recipe.description.substring(0, 70) + "..."
                  : recipe.description;

                const difficultyClasses = {
                  "Dễ": "bg-green-100 text-green-700 border-green-200",
                  "Trung bình": "bg-yellow-100 text-yellow-700 border-yellow-200",
                  "Khó": "bg-red-100 text-red-700 border-red-200"
                };

                return (
                  <Card key={recipe._id} className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border border-gray-100">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="text-3xl">{recipe.image}</div>
                          <Badge variant="outline" className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 border-blue-200">{recipe.category}</Badge>
                        </div>

                        <div>
                          <h4 className="font-bold text-base text-gray-900">{recipe.name}</h4>
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{shortDescription || "Không có mô tả."}</p>
                        </div>

                        <div className="flex flex-wrap gap-1 text-xs">
                          <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200 px-2 py-0.5">
                            <Clock className="h-3 w-3" />
                            {recipe.cookTime}
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200 px-2 py-0.5">
                            <Users className="h-3 w-3" />
                            {recipe.servings} người
                          </Badge>
                          <Badge variant="secondary" className="flex items-center gap-1 bg-gray-100 text-gray-700 border-gray-200 px-2 py-0.5">
                            <Star className="h-3 w-3 text-yellow-500" />
                            {recipe.rating}
                          </Badge>
                          <Badge
                            className={`text-xs px-2 py-0.5 ${difficultyClasses[recipe.difficulty]}`}
                          >
                            {recipe.difficulty}
                          </Badge>
                        </div>

                        {/* HIỂN THỊ THÔNG TIN NGUYÊN LIỆU CÓ SẴN/THIẾU CHỈ KHI KHÔNG PHẢI ADMIN */}
                        {(availableIngredients.length > 0 || missingIngredients.length > 0) && (
                          <div className="space-y-1 text-xs p-2 bg-gray-50 rounded-md border border-gray-100">
                            {availableIngredients.length > 0 && (
                              <div>
                                <p className="font-medium text-green-700 flex items-center gap-1"><Refrigerator className="h-3 w-3" /> Có sẵn ({availableIngredients.length}):</p>
                                <p className="text-green-600 mt-0.5">
                                  {availableIngredients.slice(0, 2).join(", ")}
                                  {availableIngredients.length > 2 && "..."}
                                </p>
                              </div>
                            )}
                            {missingIngredients.length > 0 && (
                              <div>
                                <p className="font-medium text-red-700 flex items-center gap-1"><Plus className="h-3 w-3" /> Cần mua ({missingIngredients.length}):</p>
                                <p className="text-red-600 mt-0.5">
                                  {missingIngredients.slice(0, 2).join(", ")}
                                  {missingIngredients.length > 2 && "..."}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => handleViewRecipeDetail(recipe)}>
                          Xem chi tiết
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            {hasMoreRecipes && (
              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => setShowAll(!showAll)} className="px-4 py-1.5 border-gray-300 hover:bg-gray-100 text-sm">
                  {showAll ? "Thu gọn" : `Xem thêm ${recipesToDisplay.length - initialDisplayLimit} công thức`}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

// --- Component con: AddRecipeDialog ---
// Giữ nguyên AddRecipeDialog
const AddRecipeDialog = ({
  showAddRecipeDialog,
  setShowAddRecipeDialog,
  newRecipeData,
  handleNewRecipeChange,
  handleSelectChange,
  newIngredient,
  setNewIngredient,
  handleAddIngredient,
  handleRemoveIngredient,
  handleCreateRecipe,
  loading
}) => (
  <Dialog open={showAddRecipeDialog} onOpenChange={setShowAddRecipeDialog}>
    <DialogContent className="sm:max-w-[600px] md:max-w-[700px] max-h-[85vh] overflow-y-auto p-5 bg-white shadow-xl rounded-lg">
      <DialogHeader className="border-b pb-3 mb-3">
        <DialogTitle className="text-2xl font-bold text-gray-900">Thêm công thức mới</DialogTitle>
        <DialogDescription className="text-gray-600 text-sm">
          Điền thông tin chi tiết cho công thức nấu ăn của bạn.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-3 md:grid-cols-2 text-sm">
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="name" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Tên công thức
            </Label>
            <Input
              id="name"
              name="name"
              value={newRecipeData.name}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="description" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Mô tả
            </Label>
            <Textarea
              id="description"
              name="description"
              value={newRecipeData.description}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 min-h-[60px] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="instructions" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Hướng dẫn
            </Label>
            <Textarea
              id="instructions"
              name="instructions"
              value={newRecipeData.instructions}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 min-h-[100px] text-sm"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="image" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Hình ảnh (emoji)
            </Label>
            <Input
              id="image"
              name="image"
              value={newRecipeData.image}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
              placeholder="Ex: 🍔, 🍕, 🍜"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="category" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Danh mục
            </Label>
            <Input
              id="category"
              name="category"
              value={newRecipeData.category}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
              placeholder="Ex: Món chính, Tráng miệng"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="cookTime" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Thời gian nấu
            </Label>
            <Input
              id="cookTime"
              name="cookTime"
              value={newRecipeData.cookTime}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
              placeholder="Ex: 30 phút, 1 giờ"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="servings" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Số người ăn
            </Label>
            <Input
              id="servings"
              name="servings"
              type="number"
              value={newRecipeData.servings}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
              min="1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="rating" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Đánh giá (0-5)
            </Label>
            <Input
              id="rating"
              name="rating"
              type="number"
              value={newRecipeData.rating}
              onChange={handleNewRecipeChange}
              className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm"
              min="0"
              max="5"
              step="0.1"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 items-center gap-1.5">
            <Label htmlFor="difficulty" className="md:col-span-1 text-left md:text-right font-medium text-gray-700 text-xs">
              Độ khó
            </Label>
            <Select
              name="difficulty"
              value={newRecipeData.difficulty}
              onValueChange={(value) => handleSelectChange("difficulty", value)}
            >
              <SelectTrigger className="md:col-span-3 border-gray-300 focus:ring-blue-400 text-sm">
                <SelectValue placeholder="Chọn độ khó" />
              </SelectTrigger>
              <SelectContent className="text-sm">
                <SelectItem value="Dễ">Dễ</SelectItem>
                <SelectItem value="Trung bình">Trung bình</SelectItem>
                <SelectItem value="Khó">Khó</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-left font-semibold text-gray-700 block text-xs">Nguyên liệu</Label>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
              <Input
                placeholder="Tên"
                value={newIngredient.name}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
                className="sm:col-span-2 border-gray-300 focus:ring-blue-400 text-sm"
              />
              <Input
                type="number"
                placeholder="Số lượng"
                value={newIngredient.quantity === 0 ? "" : newIngredient.quantity}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                className="sm:col-span-1 border-gray-300 focus:ring-blue-400 text-sm"
                min="0"
              />
              <Input
                placeholder="Đơn vị"
                value={newIngredient.unit}
                onChange={(e) => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
                className="sm:col-span-1 border-gray-300 focus:ring-blue-400 text-sm"
              />
              <Button onClick={handleAddIngredient} size="sm" className="sm:col-span-1 bg-blue-500 hover:bg-blue-600 text-white text-xs py-1.5">Thêm</Button>
            </div>
            <div className="space-y-1 mt-1 flex flex-wrap gap-1 p-1.5 bg-gray-50 rounded-md border border-gray-100">
              {newRecipeData.ingredients.length === 0 && <p className="text-gray-500 text-xs">Chưa có nguyên liệu nào.</p>}
              {newRecipeData.ingredients.map((ing, index) => (
                <Badge key={index} variant="secondary" className="flex items-center bg-blue-100 text-blue-800 border-blue-200 text-xs">
                  {ing.name} ({ing.quantity} {ing.unit})
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 ml-1 p-0 text-blue-600 hover:bg-blue-200"
                    onClick={() => handleRemoveIngredient(index)}
                  >
                    <X className="h-3 w-3"/>
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
      <DialogFooter className="pt-3 border-t mt-3">
        <Button variant="outline" onClick={() => setShowAddRecipeDialog(false)} className="px-4 py-1.5 rounded-md text-gray-700 border-gray-300 hover:bg-gray-100 text-sm">Hủy</Button>
        <Button onClick={handleCreateRecipe} className="px-4 py-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm" disabled={loading}>
          {loading ? 'Đang tạo...' : 'Tạo công thức'}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);

// --- Component con: RecipeDetailDialog ---
// Giữ nguyên RecipeDetailDialog
const RecipeDetailDialog = ({
  showRecipeDetailDialog,
  setShowRecipeDetailDialog,
  selectedRecipeDetail
}) => (
  <Dialog open={showRecipeDetailDialog} onOpenChange={setShowRecipeDetailDialog}>
    <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto p-5 bg-white shadow-xl rounded-lg">
      <DialogHeader className="border-b pb-3 mb-3">
        <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <span className="text-3xl">{selectedRecipeDetail.image}</span> {selectedRecipeDetail.name}
        </DialogTitle>
        <DialogDescription className="text-gray-600 text-sm mt-1">{selectedRecipeDetail.description || "Không có mô tả chi tiết."}</DialogDescription>
      </DialogHeader>
      <div className="py-3 space-y-4">
        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="secondary" className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 border-gray-200 rounded-md">
            <Clock className="h-3.5 w-3.5" /> <span className="font-medium">Thời gian nấu:</span> {selectedRecipeDetail.cookTime}
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 border-gray-200 rounded-md">
            <Users className="h-3.5 w-3.5" /> <span className="font-medium">Phục vụ:</span> {selectedRecipeDetail.servings} người
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-1 px-2.5 py-1 bg-gray-100 text-gray-700 border-gray-200 rounded-md">
            <Star className="h-3.5 w-3.5 text-yellow-500" /> <span className="font-medium">Đánh giá:</span> {selectedRecipeDetail.rating} / 5
          </Badge>
          <Badge
            className={`text-xs px-2.5 py-1 rounded-md ${
              selectedRecipeDetail.difficulty === "Dễ" ? "bg-green-100 text-green-700 border-green-200" :
              selectedRecipeDetail.difficulty === "Trung bình" ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
              "bg-red-100 text-red-700 border-red-200"
            }`}
          >
            <span className="font-medium">Độ khó:</span> {selectedRecipeDetail.difficulty}
          </Badge>
          <Badge variant="outline" className="px-2.5 py-1 bg-blue-50 text-blue-700 border-blue-200 rounded-md">
            <span className="font-medium">Danh mục:</span> {selectedRecipeDetail.category}
          </Badge>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-2 text-gray-800">Nguyên liệu:</h4>
          <ul className="list-disc list-inside text-gray-700 text-sm space-y-0.5">
            {selectedRecipeDetail.ingredients.length === 0 && <p className="text-gray-500 italic text-sm">Không có thông tin nguyên liệu.</p>}
            {selectedRecipeDetail.ingredients.map((ing, index) => (
              <li key={index} className="flex items-start">
                <span className="mr-1.5">•</span>
                <span>
                  <span className="font-semibold">{ing.name}:</span> {ing.quantity} {ing.unit}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-bold text-lg mb-2 text-gray-800">Hướng dẫn:</h4>
          <p className="text-gray-700 whitespace-pre-wrap leading-normal text-sm">{selectedRecipeDetail.instructions || "Không có hướng dẫn chi tiết."}</p>
        </div>
      </div>
      <DialogFooter className="pt-3 border-t mt-3">
        <Button onClick={() => setShowRecipeDetailDialog(false)} className="px-5 py-2 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-sm">Đóng</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
);


const Recipes = () => {
  const [recipes, setRecipes] = useState<RecipeData[]>([]);
  const [suggestedRecipes, setSuggestedRecipes] = useState<SuggestedRecipe[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showAddRecipeDialog, setShowAddRecipeDialog] = useState(false);
  const [newRecipeData, setNewRecipeData] = useState<NewRecipeData>({
    name: "",
    description: "",
    image: "🍳",
    cookTime: "",
    servings: 1,
    rating: 0,
    difficulty: "Dễ",
    ingredients: [],
    instructions: "",
    category: "",
  });
  const [newIngredient, setNewIngredient] = useState<IngredientItem>({ name: "", quantity: 0, unit: "" });

  const [showRecipeDetailDialog, setShowRecipeDetailDialog] = useState(false);
  const [selectedRecipeDetail, setSelectedRecipeDetail] = useState<RecipeData | null>(null);

  // --- STATE ĐỂ LƯU VAI TRÒ NGƯỜI DÙNG ---
  const [userRole, setUserRole] = useState<string | null>(null);

  // Memoize fetch functions using useCallback
  const fetchAllRecipes = useCallback(async () => {
    try {
      const params: { search?: string; difficulty?: string } = {};
      if (searchTerm) params.search = searchTerm;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;

      const data: RecipeData[] = await getRecipes(params);
      setRecipes(data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
    }
  }, [searchTerm, selectedDifficulty]);

  const fetchSuggestedRecipesData = useCallback(async () => {
    try {
      const data: SuggestedRecipe[] = await getSuggestedRecipes();
      setSuggestedRecipes(data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllRecipes();
  }, [fetchAllRecipes]); // Dependency on memoized function

  // Fetch suggested recipes only if not admin
  useEffect(() => {
    if (userRole === null) return; // Wait until userRole is determined
    if (userRole !== 'admin') {
      fetchSuggestedRecipesData();
    } else {
      setLoading(false); // If admin, no need to fetch suggestions, just set loading to false
    }
  }, [userRole, fetchSuggestedRecipesData]); // Re-run when userRole changes

  // --- useEffect ĐỂ LẤY VAI TRÒ NGƯỜI DÙNG TỪ LOCAL STORAGE ---
  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.role) {
      setUserRole(userInfo.role);
    } else {
      setUserRole(null);
    }
  }, []);

  // Filter suggested recipes only if not admin
  const smartSuggestedRecipes = userRole !== 'admin'
    ? suggestedRecipes.filter(item =>
        item.missingIngredients.length > 0 && item.missingIngredients.length <= 2
      )
    : [];

  const canMakeRecipesCount = userRole !== 'admin'
    ? suggestedRecipes.filter(item => item.missingIngredients.length === 0).length
    : 0;

  const handleNewRecipeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewRecipeData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setNewRecipeData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddIngredient = () => {
    if (newIngredient.name && newIngredient.quantity > 0 && newIngredient.unit) {
      setNewRecipeData(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, newIngredient],
      }));
      setNewIngredient({ name: "", quantity: 0, unit: "" });
    }
  };

  const handleRemoveIngredient = (indexToRemove: number) => {
    setNewRecipeData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, index) => index !== indexToRemove),
    }));
  };

  const handleCreateRecipe = async () => {
    try {
      setLoading(true);
      const recipeToCreate: NewRecipeData = {
        ...newRecipeData,
        servings: Number(newRecipeData.servings),
        rating: Number(newRecipeData.rating),
      };

      await createRecipe(recipeToCreate);

      // Re-fetch all data to ensure UI is up-to-date
      await Promise.all([fetchAllRecipes(), userRole !== 'admin' ? fetchSuggestedRecipesData() : Promise.resolve()]);

      setNewRecipeData({
        name: "",
        description: "",
        image: "🍳",
        cookTime: "",
        favourite: false, // Thêm trường favourite
        servings: 1,
        rating: 0,
        difficulty: "Dễ",
        ingredients: [],
        instructions: "",
        category: "",
      });
      setShowAddRecipeDialog(false);
    } catch (error: any) {
      console.error("Lỗi khi tạo công thức:", error);
      alert(`Lỗi khi tạo công thức: ${error.message || 'Có lỗi xảy ra'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleViewRecipeDetail = (recipe: RecipeData) => {
    setSelectedRecipeDetail(recipe);
    setShowRecipeDetailDialog(true);
  };

  // Hiển thị loading trong khi chờ vai trò người dùng được xác định hoặc dữ liệu được tải
  if (userRole === null || loading) {
    return <div className="p-6 text-center text-gray-600 text-sm">Đang tải dữ liệu...</div>;
  }

  return (
    <div className="space-y-6 p-4 bg-white min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
          <ChefHat className="h-8 w-8 text-primary" />
          Kho Công thức
        </h1>
        {/* --- NÚT THÊM CÔNG THỨC MỚI (CHỈ HIỂN THỊ CHO ADMIN) --- */}
        {userRole === 'admin' && (
          <Button onClick={() => setShowAddRecipeDialog(true)} className="flex items-center gap-1 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-md shadow-sm">
            <Plus className="h-4 w-4" />
            Thêm công thức mới
          </Button>
        )}
      </div>
      <p className="text-base text-gray-700 border-b pb-3 border-gray-200">
        Khám phá và quản lý bộ sưu tập công thức nấu ăn phong phú của bạn.
      </p>

      {/* Overview Cards (Ẩn các card cụ thể nếu là admin) */}
      <OverviewCards
        recipes={recipes}
        canMakeRecipesCount={canMakeRecipesCount}
        smartSuggestedRecipesLength={smartSuggestedRecipes.length}
        isUserAdmin={userRole === 'admin'} // Truyền prop isUserAdmin
      />

      {/* Smart Suggested Recipes Section (Ẩn toàn bộ phần này nếu là admin) */}
      {userRole !== 'admin' && (
        <RecipeList
          title="Gợi ý thông minh (Cần mua ít nguyên liệu)"
          description="Các món ăn bạn có thể nấu với việc mua thêm một vài nguyên liệu (thiếu tối đa 2 nguyên liệu)."
          recipesToDisplay={smartSuggestedRecipes}
          suggestedRecipes={suggestedRecipes}
          handleViewRecipeDetail={handleViewRecipeDetail}
        />
      )}

      {/* Search and Filter Section */}
      <Card className="border border-yellow-200 shadow-sm bg-yellow-50">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3 items-center">
            <div className="flex-1 w-full relative">
              <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-yellow-600" />
              <Input
                placeholder="Tìm kiếm công thức theo tên hoặc mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-10 border border-yellow-300 focus:ring-yellow-400 bg-white"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto justify-center">
              {["all", "Dễ", "Trung bình", "Khó"].map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={selectedDifficulty === difficulty ? "default" : "outline"}
                  size="sm"
                  className={`px-3 py-1.5 rounded-md ${
                    selectedDifficulty === difficulty
                      ? "bg-yellow-600 hover:bg-yellow-700 text-white"
                      : "border-yellow-300 text-yellow-700 hover:bg-yellow-100"
                  }`}
                  onClick={() => setSelectedDifficulty(difficulty)}
                >
                  {difficulty === "all" ? "Tất cả" : difficulty}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* All Recipes Section */}
      <RecipeList
        title="Tất cả công thức"
        description={`${recipes.length} công thức được tìm thấy.`}
        recipesToDisplay={recipes}
        suggestedRecipes={suggestedRecipes}
        handleViewRecipeDetail={handleViewRecipeDetail}
      />

      {/* Dialog Thêm công thức mới */}
      <AddRecipeDialog
        showAddRecipeDialog={showAddRecipeDialog}
        setShowAddRecipeDialog={setShowAddRecipeDialog}
        newRecipeData={newRecipeData}
        handleNewRecipeChange={handleNewRecipeChange}
        handleSelectChange={handleSelectChange}
        newIngredient={newIngredient}
        setNewIngredient={setNewIngredient}
        handleAddIngredient={handleAddIngredient}
        handleRemoveIngredient={handleRemoveIngredient}
        handleCreateRecipe={handleCreateRecipe}
        loading={loading}
      />

      {/* Dialog hiển thị chi tiết công thức */}
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

export default Recipes;