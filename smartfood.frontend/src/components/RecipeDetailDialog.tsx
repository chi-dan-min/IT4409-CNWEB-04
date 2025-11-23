// src/components/RecipeDetailDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, Star } from "lucide-react";

// Định nghĩa lại interface RecipeData nếu nó chưa được import từ service nào đó
// Đảm bảo interface này trùng khớp với interface bạn đang sử dụng ở nơi khác
interface IngredientItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface RecipeData {
  _id: string;
  name: string;
  description: string;
  image: string;
  cookTime: string;
  servings: number;
  rating: number;
  difficulty: "Dễ" | "Trung bình" | "Khó";
  ingredients: IngredientItem[];
  instructions: string;
  category: string;
  createdAt: string;
  updatedAt: string;
}

interface RecipeDetailDialogProps {
  showRecipeDetailDialog: boolean;
  setShowRecipeDetailDialog: (open: boolean) => void;
  selectedRecipeDetail: RecipeData | null;
}

const RecipeDetailDialog = ({
  showRecipeDetailDialog,
  setShowRecipeDetailDialog,
  selectedRecipeDetail,
}: RecipeDetailDialogProps) => {
  if (!selectedRecipeDetail) {
    return null; // Không render nếu không có công thức nào được chọn
  }

  const difficultyClasses = {
    "Dễ": "bg-green-100 text-green-700 border-green-200",
    "Trung bình": "bg-yellow-100 text-yellow-700 border-yellow-200",
    "Khó": "bg-red-100 text-red-700 border-red-200"
  };

  return (
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
              className={`text-xs px-2.5 py-1 rounded-md ${difficultyClasses[selectedRecipeDetail.difficulty]}`}
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
};

export default RecipeDetailDialog;