import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, Clock, Users, CheckCircle } from "lucide-react"; // Thêm CheckCircle

// Import các interface cần thiết từ service
import { RecipeData, MealEntry } from "@/services/mealPlanService";

// Định nghĩa props cho SelectRecipeDialog
interface SelectRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  allRecipes: RecipeData[];
  filteredRecipes: RecipeData[];
  recipeSearchTerm: string;
  onRecipeSearchTermChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
  selectedRecipeForMeal: RecipeData | null;
  onSelectRecipe: (recipe: RecipeData) => void;
  notesForMeal: string;
  onNotesChange: (notes: string) => void;
  loading: boolean;
  currentMealEntryToEdit: MealEntry | null;
  onSave: () => void;
}

const SelectRecipeDialog: React.FC<SelectRecipeDialogProps> = ({
  isOpen,
  onClose,
  allRecipes,
  filteredRecipes,
  recipeSearchTerm,
  onRecipeSearchTermChange,
  selectedCategory,
  onCategoryChange,
  categories,
  selectedRecipeForMeal,
  onSelectRecipe,
  notesForMeal,
  onNotesChange,
  loading,
  currentMealEntryToEdit,
  onSave,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col p-6 bg-white shadow-lg rounded-xl">
        <DialogHeader className="pb-4 border-b border-gray-200">
          <DialogTitle className="text-2xl font-bold text-gray-900">
            {currentMealEntryToEdit ? "Chỉnh sửa bữa ăn" : "Chọn công thức cho bữa ăn"}
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {currentMealEntryToEdit ? "Cập nhật công thức hoặc ghi chú cho bữa ăn này." : "Tìm kiếm và chọn một công thức cho bữa ăn của bạn."}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4 overflow-hidden flex-grow  bg-gray-50">
          {/* Search and Category Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Tìm kiếm công thức..."
                value={recipeSearchTerm}
                onChange={(e) => onRecipeSearchTermChange(e.target.value)}
                className="pl-10 h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <Select value={selectedCategory} onValueChange={onCategoryChange}>
              <SelectTrigger className="h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400">
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent className="rounded-lg shadow-md border border-gray-200">
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Recipe List */}
          {/* Điều chỉnh max-h để phù hợp với việc loại bỏ phần hiển thị công thức đã chọn */}
          <ScrollArea className="flex-grow max-h-[calc(90vh-250px)] rounded-md border border-gray-200 p-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredRecipes.length > 0 ? (
                filteredRecipes.map((recipe) => (
                  <Card
                    key={recipe._id}
                    className={`cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:border-blue-400 
                      ${selectedRecipeForMeal?._id === recipe._id ? 'border-blue-600 bg-blue-50 shadow-md' : 'border-gray-200 bg-white'}`}
                    onClick={() => onSelectRecipe(recipe)}
                  >
                    <CardContent className="p-3 flex items-center gap-3 relative"> {/* Thêm relative cho icon check */}
                      {recipe.image ? (
                        <img
                          src={recipe.image}
                          alt={recipe.name}
                          className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallbackDiv = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallbackDiv) fallbackDiv.style.display = 'flex';
                          }}
                        />
                      ) : (
                        <div className="w-14 h-14 flex items-center justify-center bg-gray-100 rounded-md text-xl flex-shrink-0">
                          🍽️
                        </div>
                      )}
                      <div className="flex items-baseline gap-4">
                      <div className="flex-1 overflow-hidden">
                          <p className="font-semibold text-sm text-gray-800 line-clamp-2">{recipe.name}</p>
                          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{recipe.category}</p>
                        </div>
                        {/* Phần tử khác nằm cùng hàng nếu có thể chèn ở đây */}
                      </div>
                      {selectedRecipeForMeal?._id === recipe._id && (
                        <CheckCircle className="absolute top-1 right-1 h-6 w-6 text-blue-600 bg-white rounded-full p-0.5 shadow-sm" />
                      )}
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500 py-4">Không tìm thấy công thức nào.</p>
              )}
            </div>
          </ScrollArea>

          {/* Notes for Meal */}
          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="notes" className="text-gray-700">Ghi chú cho bữa ăn này (tùy chọn):</Label>
            <Textarea
              id="notes"
              value={notesForMeal}
              onChange={(e) => onNotesChange(e.target.value)}
              placeholder="Ví dụ: Thêm ớt, làm ít cay hơn..."
              className="min-h-[80px] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 resize-y"
            />
          </div>
        </div>

        <DialogFooter className="flex justify-between pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose} className="px-5 py-2 rounded-lg text-gray-700 border-gray-300 hover:bg-gray-100">
            Hủy
          </Button>
          <Button onClick={onSave} disabled={!selectedRecipeForMeal || loading} className="px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {currentMealEntryToEdit ? "Cập nhật bữa ăn" : "Thêm bữa ăn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SelectRecipeDialog;