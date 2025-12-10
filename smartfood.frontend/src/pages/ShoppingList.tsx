import { useState } from "react";
// ⭐️ Import React Query hooks
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"; // ⭐️ Sửa lỗi: Import Card components riêng lẻ
import { Button } from "@/components/ui/button"; // ⭐️ Sửa lỗi: Import Button
import { Input } from "@/components/ui/input"; // ⭐️ Sửa lỗi: Import Input
import { Label } from "@/components/ui/label"; // ⭐️ Sửa lỗi: Import Label
import { Checkbox } from "@/components/ui/checkbox"; // ⭐️ Sửa lỗi: Import Checkbox
import { Badge } from "@/components/ui/badge"; // ⭐️ Sửa lỗi: Import Badge
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // ⭐️ Sửa lỗi: Import Select components
import {
  Plus,
  Trash2,
  Calendar,
  ShoppingCart,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

// Import API service
import shoppingListService from "@/services/shoppingListService";

// ⭐️ Giữ nguyên kiểu dữ liệu
interface ShoppingItem {
  _id?: string;
  name: string;
  quantity: number;
  unit?: string;
  category?: string;
  isPurchased: boolean;
}

interface ShoppingListType {
  _id: string;
  user: string;
  name: string;
  type: "daily" | "weekly";
  items: ShoppingItem[];
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

// ⭐️ Định nghĩa Query Key
const SHOPPING_LIST_QUERY_KEY = "primaryShoppingList";

// Hàm QueryFn: Lấy danh sách chính
const fetchPrimaryShoppingList = async (): Promise<ShoppingListType | null> => {
  const lists = await shoppingListService.getShoppingLists();
  if (lists && lists.length > 0) {
    return lists[0];
  }
  return null;
};

const ShoppingList = () => {
  const queryClient = useQueryClient();

  // State cho item mới (Giữ nguyên)
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "",
  });

  const categories = [
    "Rau củ",
    "Thịt cá",
    "Đồ khô",
    "Sữa & trứng",
    "Gia vị",
    "Đồ uống",
    "Khác",
  ];
  const units = [
    "cái",
    "kg",
    "g",
    "lít",
    "ml",
    "bó",
    "túi",
    "hộp",
    "chai",
    "thanh",
    "khác",
  ];

  // --- 1. QUERY (Lấy dữ liệu) ---
  const {
    data: currentShoppingList,
    isLoading: isLoadingList,
    error: queryError,
  } = useQuery<ShoppingListType | null, Error>({
    queryKey: [SHOPPING_LIST_QUERY_KEY],
    queryFn: fetchPrimaryShoppingList,
  });

  // Lấy dữ liệu an toàn
  const listData = currentShoppingList;
  const items = listData?.items || [];
  const completedCount = items.filter((item) => item.isPurchased).length;
  const totalCount = items.length;

  // --- 2. MUTATION (Cập nhật danh sách trên Backend) ---
  const updateListMutation = useMutation({
    mutationFn: (data: { listId: string; items: ShoppingItem[] }) =>
      shoppingListService.updateShoppingList(data.listId, {
        items: data.items,
      }),

    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: [SHOPPING_LIST_QUERY_KEY] });
      toast({
        title: "Cập nhật thành công!",
        description: "Danh sách mua sắm đã được lưu.",
        variant: "success",
      });
    },
    onError: (error: any) => {
      console.error("Failed to update shopping list:", error);
      toast({
        title: "Lỗi",
        description: error.message || "Không thể cập nhật danh sách mua sắm.",
        variant: "destructive",
      });
    },
  });

  // Hàm Tạo Danh Sách Mới
  const createNewDefaultList = async (newItem: ShoppingItem) => {
    try {
      // Giả định service có hàm createShoppingList
      const newDefaultList = await shoppingListService.createShoppingList({
        name: "Danh sách mua sắm của tôi",
        type: "daily",
        items: [newItem],
      });
      queryClient.invalidateQueries({ queryKey: [SHOPPING_LIST_QUERY_KEY] });
      toast({
        title: "Đã tạo danh sách mới!",
        description: "Danh sách mặc định đã được tạo và thêm sản phẩm.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Failed to create new default shopping list:", err);
      toast({
        title: "Lỗi",
        description: err.message || "Không thể tạo danh sách mới.",
        variant: "destructive",
      });
    }
  };

  const addItemToList = async () => {
    if (
      !newItem.name ||
      !newItem.quantity ||
      !newItem.unit ||
      !newItem.category
    ) {
      toast({
        title: "Thiếu thông tin",
        description:
          "Vui lòng điền đủ Tên sản phẩm, Số lượng, Đơn vị và Danh mục.",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseFloat(newItem.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "Vui lòng nhập số lượng hợp lệ (ví dụ: '1').",
        variant: "destructive",
      });
      return;
    }

    const itemToAdd: ShoppingItem = {
      name: newItem.name,
      quantity: quantityNum,
      unit: newItem.unit,
      category: newItem.category,
      isPurchased: false,
    };

    setNewItem({ name: "", quantity: "", unit: "", category: "" });

    if (!listData) {
      await createNewDefaultList(itemToAdd);
      return;
    }

    const updatedItems: ShoppingItem[] = [...items, itemToAdd];

    updateListMutation.mutate({
      listId: listData._id,
      items: updatedItems,
    });
  };

  const toggleItemPurchase = async (itemId: string) => {
    if (!listData) return;

    const updatedItems = items.map((item) =>
      item._id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
    );

    updateListMutation.mutate({
      listId: listData._id,
      items: updatedItems,
    });
  };

  const deleteItemFromList = async (itemId: string) => {
    if (!listData) return;

    const updatedItems = items.filter((item) => item._id !== itemId);

    updateListMutation.mutate({
      listId: listData._id,
      items: updatedItems,
    });
  };

  const isMutating = updateListMutation.isPending;

  if (isLoadingList) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-700">
          Đang tải danh sách mua sắm...
        </p>
      </div>
    );
  }

  if (queryError) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-xl">
          Đã xảy ra lỗi:{" "}
          {queryError.message || "Không thể tải danh sách mua sắm."}
        </p>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: [SHOPPING_LIST_QUERY_KEY],
            })
          }
          className="mt-4"
        >
          Thử lại
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <ShoppingCart className="h-8 w-8 text-primary" />
          Danh sách mua sắm
        </h1>
        <p className="text-lg text-gray-600">
          Quản lý danh sách mua sắm của gia đình bạn
        </p>
      </div>

      {/* Progress Summary */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Tiến độ mua sắm</h3>
              <p className="text-sm text-gray-600">
                {completedCount} / {totalCount} sản phẩm đã hoàn thành
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {totalCount > 0
                  ? Math.round((completedCount / totalCount) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500">Hoàn thành</div>
            </div>
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  totalCount > 0 ? (completedCount / totalCount) * 100 : 0
                }%`,
              }}
            ></div>
          </div>
        </CardContent>
      </Card>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm sản phẩm mới
          </CardTitle>
          <CardDescription>
            Thêm sản phẩm mới vào danh sách mua sắm của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Cà chua"
                value={newItem.name}
                onChange={(e) =>
                  setNewItem({ ...newItem, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="Ví dụ: 1"
                value={newItem.quantity}
                onChange={(e) =>
                  setNewItem({ ...newItem, quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select
                value={newItem.unit}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn đơn vị" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục</Label>
              <Select
                value={newItem.category}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={addItemToList}
            className="w-full"
            disabled={isMutating}
          >
            {isMutating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Thêm vào danh sách
          </Button>
        </CardContent>
      </Card>

      {/* Shopping List Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Danh sách hiện tại: {listData?.name || "Chưa có tên"}
            </span>
            <Badge variant="outline">{totalCount} sản phẩm</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {totalCount === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có sản phẩm nào trong danh sách</p>
                <p className="text-sm">Hãy thêm sản phẩm đầu tiên của bạn!</p>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item._id}
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    item.isPurchased
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-200 hover:shadow-md"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.isPurchased}
                        onCheckedChange={() => toggleItemPurchase(item._id!)}
                        disabled={isMutating}
                      />
                      <div className={item.isPurchased ? "opacity-60" : ""}>
                        <h4
                          className={`font-medium ${
                            item.isPurchased ? "line-through" : ""
                          }`}
                        >
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category || "Chưa phân loại"}
                          </Badge>
                          <span className="text-sm text-gray-600">
                            {item.quantity} {item.unit}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItemFromList(item._id!)}
                      className="text-red-500 hover:text-red-700"
                      disabled={isMutating}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShoppingList;
