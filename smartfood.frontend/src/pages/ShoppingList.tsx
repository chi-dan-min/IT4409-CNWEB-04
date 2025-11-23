import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Users, Calendar, ShoppingCart, Loader2, AlertTriangle } from "lucide-react"; // Thêm Loader2
import { toast } from "@/hooks/use-toast";
import shoppingListService from "@/services/shoppingListService"; // Đây là cách import đúng cho default export

// Định nghĩa kiểu dữ liệu cho Shopping Item
interface ShoppingItem {
  _id?: string; // ID từ MongoDB
  name: string;
  quantity: number; // Số lượng nên là number
  unit?: string; // Đơn vị
  category?: string;
  isPurchased: boolean; // Đã đổi từ 'completed' sang 'isPurchased'
  // addedBy: string; // Trường này không có trong model của bạn, có thể bỏ
}

// Định nghĩa kiểu dữ liệu cho Shopping List (danh sách chứa items)
interface ShoppingListType {
  _id: string;
  user: string;
  name: string;
  type: 'daily' | 'weekly';
  items: ShoppingItem[];
  sharedWith: string[];
  createdAt: string;
  updatedAt: string;
}

const ShoppingList = () => {
  // State để lưu trữ danh sách mua sắm hiện tại từ API
  const [currentShoppingList, setCurrentShoppingList] = useState<ShoppingListType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State cho item mới
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "", // Vẫn để string để người dùng nhập "1 kg", sau đó phân tích
    unit: "", // Tách unit ra
    category: "",
  });

  const categories = ["Rau củ", "Thịt cá", "Đồ khô", "Sữa & trứng", "Gia vị", "Đồ uống", "Khác"];
  const units = ["cái", "kg", "g", "lít", "ml", "bó", "túi", "hộp", "chai", "thanh", "khác"]; // Thêm các đơn vị phổ biến

  // --- Functions for API Interaction ---

  // Lấy danh sách mua sắm từ API
  const fetchShoppingList = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const lists = await shoppingListService.getShoppingLists();
      // Giả định chúng ta sẽ làm việc với danh sách đầu tiên tìm được
      // Trong thực tế, bạn sẽ cần UI để người dùng chọn danh sách hoặc tạo mới
      if (lists && lists.length > 0) {
        setCurrentShoppingList(lists[0]);
      } else {
        // Nếu không có danh sách nào, bạn có thể tạo một danh sách mặc định
        // hoặc hướng dẫn người dùng tạo mới
        toast({
            title: "Chưa có danh sách mua sắm nào.",
            description: "Hãy tạo một danh sách mới để bắt đầu!",
            variant: "default"
        });
        setCurrentShoppingList(null); // Không có danh sách để hiển thị
      }
    } catch (err: any) {
      console.error("Failed to fetch shopping lists:", err);
      setError(err.response?.data?.message || "Không thể tải danh sách mua sắm.");
      toast({
        title: "Lỗi",
        description: error || "Không thể tải danh sách mua sắm.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchShoppingList();
  }, []);

  // Cập nhật danh sách trên Backend sau mỗi thay đổi
  const updateListOnBackend = async (listToUpdate: ShoppingListType) => {
    if (!listToUpdate || !listToUpdate._id) return; // Đảm bảo có ID danh sách

    setIsLoading(true);
    try {
      const updatedList = await shoppingListService.updateShoppingList(listToUpdate._id, {
        items: listToUpdate.items,
      });
      setCurrentShoppingList(updatedList); // Cập nhật state với dữ liệu mới từ backend
      toast({
        title: "Cập nhật thành công!",
        description: "Danh sách mua sắm đã được lưu.",
        variant: "success",
      });
    } catch (err: any) {
      console.error("Failed to update shopping list:", err);
      setError(err.response?.data?.message || "Không thể cập nhật danh sách mua sắm.");
      toast({
        title: "Lỗi",
        description: error || "Không thể cập nhật danh sách mua sắm.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };


  const addItemToList = async () => {
    if (!newItem.name || !newItem.quantity || !newItem.unit || !newItem.category) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đủ Tên sản phẩm, Số lượng, Đơn vị và Danh mục.",
        variant: "destructive",
      });
      return;
    }

    if (!currentShoppingList) {
        // Nếu chưa có danh sách nào, tạo một danh sách mới mặc định
        try {
            const newDefaultList = await createShoppingList({
                name: "Danh sách mua sắm của tôi",
                type: "daily",
                items: []
            });
            setCurrentShoppingList(newDefaultList);
            toast({
                title: "Đã tạo danh sách mới!",
                description: "Danh sách mặc định đã được tạo.",
                variant: "success"
            });
            // Sau khi tạo xong danh sách, thêm item vào nó
            const quantityNum = parseFloat(newItem.quantity.split(' ')[0]); // Phân tích số lượng từ chuỗi
            const unitString = newItem.unit; // Đơn vị được chọn trực tiếp
            const updatedItems = [...newDefaultList.items, {
                name: newItem.name,
                quantity: quantityNum,
                unit: unitString,
                category: newItem.category,
                isPurchased: false,
            }];
            await updateListOnBackend({ ...newDefaultList, items: updatedItems });

        } catch (err: any) {
            console.error("Failed to create new default shopping list:", err);
            toast({
                title: "Lỗi",
                description: err.response?.data?.message || "Không thể tạo danh sách mới.",
                variant: "destructive",
            });
            return;
        } finally {
            setNewItem({ name: "", quantity: "", unit: "", category: "" }); // Reset form
        }
        return; // Đã xử lý xong việc thêm item vào danh sách mới tạo
    }

    // Nếu đã có danh sách
    const quantityNum = parseFloat(newItem.quantity.split(' ')[0]); // Giả định số lượng dạng "X đơn vị"
    const unitString = newItem.unit; // Đơn vị được chọn trực tiếp

    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "Vui lòng nhập số lượng hợp lệ (ví dụ: '1').",
        variant: "destructive",
      });
      return;
    }

    const updatedItems: ShoppingItem[] = [
      ...currentShoppingList.items,
      {
        name: newItem.name,
        quantity: quantityNum,
        unit: unitString,
        category: newItem.category,
        isPurchased: false,
      },
    ];

    setNewItem({ name: "", quantity: "", unit: "", category: "" }); // Reset form

    // Cập nhật danh sách trên backend
    await updateListOnBackend({ ...currentShoppingList, items: updatedItems });
  };

  const toggleItemPurchase = async (itemId: string) => {
    if (!currentShoppingList) return;

    const updatedItems = currentShoppingList.items.map(item =>
      item._id === itemId ? { ...item, isPurchased: !item.isPurchased } : item
    );

    await updateListOnBackend({ ...currentShoppingList, items: updatedItems });
  };

  const deleteItemFromList = async (itemId: string) => {
    if (!currentShoppingList) return;

    const updatedItems = currentShoppingList.items.filter(item => item._id !== itemId);

    await updateListOnBackend({ ...currentShoppingList, items: updatedItems });
  };

  const completedCount = currentShoppingList ? currentShoppingList.items.filter(item => item.isPurchased).length : 0;
  const totalCount = currentShoppingList ? currentShoppingList.items.length : 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-700">Đang tải danh sách mua sắm...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-xl">Đã xảy ra lỗi: {error}</p>
        <Button onClick={fetchShoppingList} className="mt-4">Thử lại</Button>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"> {/* Sửa grid */}
            <div className="space-y-2">
              <Label htmlFor="name">Tên sản phẩm</Label>
              <Input
                id="name"
                placeholder="Ví dụ: Cà chua"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity">Số lượng</Label> {/* Đã tách quantity và unit */}
              <Input
                id="quantity"
                type="number" // Sử dụng type="number" cho số lượng
                placeholder="Ví dụ: 1"
                value={newItem.quantity}
                onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select value={newItem.unit} onValueChange={(value) => setNewItem({ ...newItem, unit: value })}>
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
              <Select value={newItem.category} onValueChange={(value) => setNewItem({ ...newItem, category: value })}>
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
          <Button onClick={addItemToList} className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Thêm vào danh sách
          </Button>
        </CardContent>
      </Card>

      {/* Shopping List Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Calendar className="h-5 w-5" /> {/* Có thể thay Calendar bằng icon ShoppingBag */}
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
                  key={item._id} // Sử dụng _id từ MongoDB
                  className={`p-4 border rounded-lg transition-all duration-200 ${
                    item.isPurchased 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Checkbox
                        checked={item.isPurchased} // Đã đổi sang isPurchased
                        onCheckedChange={() => toggleItemPurchase(item._id!)} // Truyền _id
                      />
                      <div className={item.isPurchased ? 'opacity-60' : ''}>
                        <h4 className={`font-medium ${item.isPurchased ? 'line-through' : ''}`}>
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {item.category || "Chưa phân loại"} {/* Hiển thị "Chưa phân loại" nếu category null */}
                          </Badge>
                          <span className="text-sm text-gray-600">{item.quantity} {item.unit}</span> {/* Hiển thị cả quantity và unit */}
                          {/* <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {item.addedBy} // Trường addedBy không có trong model của bạn
                          </span> */}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteItemFromList(item._id!)} // Truyền _id
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
    </div>
  );
};

export default ShoppingList;