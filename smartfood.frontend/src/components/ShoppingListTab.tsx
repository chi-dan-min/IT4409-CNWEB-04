// src/components/ShoppingListTab.tsx
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input"; // Thêm Input
import { Label } from "@/components/ui/label"; // Thêm Label
import { Checkbox } from "@/components/ui/checkbox"; // Thêm Checkbox
import { Badge } from "@/components/ui/badge"; // Thêm Badge
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Thêm Select components
import {
  Share2, ShoppingCart, Loader2, Plus, Trash2, Users, Calendar, AlertTriangle // Thêm các icons cần thiết
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"; // Import useQuery và useQueryClient
import shoppingListService from "@/services/shoppingListService"; // Import service API

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
  type: 'daily' | 'weekly';
  items: ShoppingItem[];
  familyGroup: string | null; // Cập nhật để phù hợp với backend và service
  createdAt: string;
  updatedAt: string;
}

interface ShoppingListTabProps {
  activeGroupId: string | null;
  activeGroupName: string | undefined;
  currentUserRole: 'admin' | 'member' | 'none';
}

const ShoppingListTab: React.FC<ShoppingListTabProps> = ({ activeGroupId, activeGroupName, currentUserRole }) => {
  const queryClient = useQueryClient();

  // State cho item mới (đã di chuyển từ ShoppingList)
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "",
    unit: "",
    category: "",
  });

  const categories = ["Rau củ", "Thịt cá", "Đồ khô", "Sữa & trứng", "Gia vị", "Đồ uống", "Khác"];
  const units = ["cái", "kg", "g", "lít", "ml", "bó", "túi", "hộp", "chai", "thanh", "khác"];

  // --- TanStack Query for Shopping List Data ---

  // Lấy danh sách đi chợ cho nhóm hiện tại (hoặc danh sách cá nhân nếu không có nhóm)
  const {
    data: currentShoppingList,
    isLoading: isLoadingList,
    error: shoppingListError,
    refetch: refetchShoppingList, // Để refetch thủ công
  } = useQuery<ShoppingListType | null>({ // Cập nhật kiểu trả về
    queryKey: ['shoppingList', activeGroupId], // Key phụ thuộc vào activeGroupId
    queryFn: async () => {
      // Nếu không có activeGroupId, tìm danh sách cá nhân (familyGroup: null)
      // Nếu có activeGroupId, tìm danh sách của nhóm đó
      const lists = await shoppingListService.getShoppingLists(activeGroupId);
      // Giả định mỗi nhóm/người dùng chỉ có một danh sách đi chợ chính
      // Hoặc bạn sẽ cần một cách để người dùng chọn danh sách nào để tương tác
      if (lists && lists.length > 0) {
        return lists[0];
      }
      return null;
    },
    enabled: true, // Luôn bật, logic kiểm tra activeGroupId đã có trong queryFn
    staleTime: 1000 * 60 * 5, // Dữ liệu được coi là "tươi" trong 5 phút
    refetchOnWindowFocus: false, // Tắt tự động refetch khi tab được focus lại
    retry: 1, // Thử lại 1 lần nếu thất bại
  });

  // Mutation để cập nhật danh sách (thêm/xóa/toggle item)
  const updateListMutation = useMutation({
    mutationFn: (data: { listId: string, updatedData: { items: ShoppingItem[] } }) =>
      shoppingListService.updateShoppingList(data.listId, data.updatedData),
    onSuccess: (data) => {
      queryClient.setQueryData(['shoppingList', activeGroupId], data); // Cập nhật cache ngay lập tức
      toast({
        title: "Cập nhật thành công!",
        description: "Danh sách mua sắm đã được lưu.",
        variant: "success",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể cập nhật danh sách mua sắm.",
        variant: "destructive",
      });
    },
  });

  // Mutation để tạo danh sách mới
  const createListMutation = useMutation({
    mutationFn: (data: { name: string; type: string; items?: ShoppingItem[]; familyGroupId?: string | null }) =>
      shoppingListService.createShoppingList(data),
    onSuccess: (data) => {
      queryClient.setQueryData(['shoppingList', activeGroupId], data); // Đặt danh sách mới vào cache
      toast({
        title: "Đã tạo danh sách mới!",
        description: "Danh sách mặc định đã được tạo.",
        variant: "success",
      });
    },
    onError: (err: any) => {
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể tạo danh sách mới.",
        variant: "destructive",
      });
    },
  });


  // Mutation để chia sẻ danh sách (gán cho nhóm)
  const shareListToGroupMutation = useMutation({
    mutationFn: ({ shoppingListId, familyGroupId }: { shoppingListId: string; familyGroupId: string }) =>
      shoppingListService.shareShoppingListToGroup(shoppingListId, familyGroupId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['shoppingList', activeGroupId] }); // Refetch danh sách sau khi chia sẻ
      toast({
        title: "Chia sẻ danh sách thành công!",
        description: data.message || `Danh sách đã được gán cho nhóm "${activeGroupName}".`,
      });
    },
    onError: (err: any) => {
      toast({
        title: "Chia sẻ thất bại",
        description: err.response?.data?.message || "Đã có lỗi xảy ra khi chia sẻ danh sách.",
        variant: "destructive",
      });
    },
  });

  // --- Handler Functions (di chuyển từ ShoppingList) ---

  const addItemToList = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.category) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đủ Tên sản phẩm, Số lượng, Đơn vị và Danh mục.",
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

    if (!currentShoppingList) {
      // Nếu chưa có danh sách nào, tạo một danh sách mới
      // Nó sẽ là danh sách cá nhân nếu activeGroupId là null, hoặc của nhóm nếu activeGroupId có
      createListMutation.mutate({
        name: "Danh sách mua sắm của tôi",
        type: "daily",
        items: [itemToAdd], // Thêm item ngay khi tạo
        familyGroupId: activeGroupId, // Gán cho nhóm nếu có
      });
    } else {
      // Nếu đã có danh sách, cập nhật items
      const updatedItems: ShoppingItem[] = [...currentShoppingList.items, itemToAdd];
      updateListMutation.mutate({ listId: currentShoppingList._id, updatedData: { items: updatedItems } });
    }

    setNewItem({ name: "", quantity: "", unit: "", category: "" }); // Reset form
  };

  const toggleItemPurchase = (itemId: string) => {
    if (!currentShoppingList) return;

    const updatedItems = currentShoppingList.items.map(item =>
      item._id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
    );

    updateListMutation.mutate({ listId: currentShoppingList._id, updatedData: { items: updatedItems } });
  };

  const deleteItemFromList = (itemId: string) => {
    if (!currentShoppingList) return;

    const updatedItems = currentShoppingList.items.filter(item => item._id !== itemId);

    updateListMutation.mutate({ listId: currentShoppingList._id, updatedData: { items: updatedItems } });
  };

  const handleShareShoppingList = () => {
    if (!activeGroupId) {
      toast({
        title: "Chưa chọn nhóm",
        description: "Vui lòng chọn một nhóm gia đình để chia sẻ danh sách đi chợ.",
        variant: "destructive",
      });
      return;
    }

    // Kiểm tra xem có danh sách đi chợ hiện tại không
    if (!currentShoppingList || !currentShoppingList._id) {
      toast({
        title: "Không tìm thấy danh sách",
        description: "Không thể xác định danh sách đi chợ để chia sẻ. Vui lòng tạo một danh sách trước.",
        variant: "destructive",
      });
      return;
    }

    // Gọi mutation để chia sẻ danh sách
    shareListToGroupMutation.mutate({
      shoppingListId: currentShoppingList._id,
      familyGroupId: activeGroupId,
    });
  };

  const completedCount = currentShoppingList ? currentShoppingList.items.filter(item => item.isPurchased).length : 0;
  const totalCount = currentShoppingList ? currentShoppingList.items.length : 0;

  // Hiển thị loading/error từ useQuery
  if (isLoadingList) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-700">Đang tải danh sách mua sắm...</p>
      </div>
    );
  }

  if (shoppingListError) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-xl">Đã xảy ra lỗi: {shoppingListError.message || "Không thể tải danh sách mua sắm."}</p>
        <Button onClick={() => refetchShoppingList()} className="mt-4">Thử lại</Button>
      </div>
    );
  }

  return (
    <Card>
      <CardContent>
        {!activeGroupId ? (
          <p className="text-gray-500 text-center py-4">Vui lòng chọn một nhóm gia đình ở tab "Quản lý nhóm" để xem hoặc chia sẻ danh sách đi chợ.</p>
        ) : (
          <>
            {/* Progress Summary */}
            <Card className="mt-6 mb-6">
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
                      {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}%
                    </div>
                    <div className="text-sm text-gray-500">Hoàn thành</div>
                  </div>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalCount > 0 ? (completedCount / totalCount) * 100 : 0}%` }}
                  ></div>
                </div>
              </CardContent>
            </Card>

            {/* Add New Item */}
            <Card className="mb-6">
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
                    <Label htmlFor="itemName">Tên sản phẩm</Label>
                    <Input
                      id="itemName"
                      placeholder="Ví dụ: Cà chua"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemQuantity">Số lượng</Label>
                    <Input
                      id="itemQuantity"
                      type="number"
                      placeholder="Ví dụ: 1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="itemUnit">Đơn vị</Label>
                    <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
                      <SelectTrigger id="itemUnit">
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
                    <Label htmlFor="itemCategory">Danh mục</Label>
                    <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
                      <SelectTrigger id="itemCategory">
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
                  disabled={updateListMutation.isPending || createListMutation.isPending}
                >
                  {(updateListMutation.isPending || createListMutation.isPending) ? (
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
                    Danh sách hiện tại: {currentShoppingList?.name || "Chưa có tên"}
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
                    currentShoppingList?.items.map((item) => (
                      <div
                        key={item._id}
                        className={`p-4 border rounded-lg transition-all duration-200 ${
                          item.isPurchased
                            ? 'bg-green-50 border-green-200'
                            : 'bg-white border-gray-200 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Checkbox
                              checked={item.isPurchased}
                              onCheckedChange={() => toggleItemPurchase(item._id!)}
                            />
                            <div className={item.isPurchased ? 'opacity-60' : ''}>
                              <h4 className={`font-medium ${item.isPurchased ? 'line-through' : ''}`}>
                                {item.name}
                              </h4>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {item.category || "Chưa phân loại"}
                                </Badge>
                                <span className="text-sm text-gray-600">{item.quantity} {item.unit}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItemFromList(item._id!)}
                            className="text-red-500 hover:text-red-700"
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
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ShoppingListTab;