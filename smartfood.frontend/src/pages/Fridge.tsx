import { useState } from "react"; // Giữ useState cho form/filter
// ⭐️ IMPORT REACT QUERY HOOKS
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Plus,
  Refrigerator,
  AlertTriangle,
  Calendar as CalendarIcon,
  Search,
  Trash2,
  Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

// Import API service và interface
import {
  getFoodItems,
  createFoodItem,
  deleteFoodItem,
  // updateFoodItem, // Không dùng updateFoodItem trong scope này
  FoodItemData,
} from "@/services/foodItemService";

// Định nghĩa kiểu dữ liệu cho Food Item trong frontend
interface FridgeItem extends FoodItemData {
  _id: string;
  expiryDate: Date; // Đã parse thành Date object
  createdAt: Date; // Đã parse thành Date object
  updatedAt: Date; // Đã parse thành Date object
}

// ⭐️ Định nghĩa Query Key
const FRIDGE_ITEMS_QUERY_KEY = "fridgeItems";

const Fridge = () => {
  // ⭐️ Khởi tạo Query Client để thao tác với cache
  const queryClient = useQueryClient();

  // ❌ Loại bỏ: const [items, setItems] = useState<FridgeItem[]>([]);
  // ❌ Loại bỏ: const [isLoading, setIsLoading] = useState(true);
  // ❌ Loại bỏ: const [error, setError] = useState<string | null>(null);

  // Giữ nguyên State cho Form và Filter
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [newItem, setNewItem] = useState({
    name: "",
    quantity: "", // Vẫn là string
    unit: "",
    category: "",
    storageLocation: "",
    expiryDate: undefined as Date | undefined,
  });

  // Data/Config cố định (Giữ nguyên)
  const categories = [
    "Rau củ",

    "Thịt cá",

    "Sữa & trứng",

    "Đồ khô",

    "Gia vị",

    "Đồ uống",

    "Đồ đông lạnh",

    "Khác",
  ];

  // Điều chỉnh lại `locations` để khớp với `storageLocation` bạn đã định nghĩa trong backend

  const locations = [
    "Tủ lạnh",

    "Tủ đông",

    "Kệ bếp",

    "Ngăn rau củ",

    "Cửa tủ lạnh",

    "Khác",
  ];

  const units = [
    "g",

    "kg",

    "ml",

    "lít",

    "cái",

    "bó",

    "hộp",

    "chai",

    "thanh",

    "túi",
  ]; // Thêm các đơn vị phổ biến

  // --- ⭐️ 1. Lấy dữ liệu (READ) bằng useQuery ---
  const {
    data: items, // Đổi tên data thành items
    isLoading, // Trạng thái tải từ useQuery
    error, // Lỗi từ useQuery
  } = useQuery({
    queryKey: [FRIDGE_ITEMS_QUERY_KEY],
    queryFn: async () => {
      const data = await getFoodItems();
      // Chuyển đổi string thành Date object (Parsing)
      return data.map((item) => ({
        ...item,
        _id: item._id!,
        expiryDate: new Date(item.expiryDate),
        createdAt: new Date(item.createdAt!),
        updatedAt: new Date(item.updatedAt!),
      })) as FridgeItem[];
    },
  });

  // Sử dụng items hoặc mảng rỗng nếu chưa có data/error
  const fridgeItems: FridgeItem[] = items || [];
  const totalItems = fridgeItems.length;

  // --- ⭐️ 2. Thao tác Thêm (CREATE) bằng useMutation ---
  const addItemMutation = useMutation({
    mutationFn: createFoodItem,
    onSuccess: () => {
      // Thành công: Yêu cầu React Query fetch lại data (Invalidation)
      queryClient.invalidateQueries({ queryKey: [FRIDGE_ITEMS_QUERY_KEY] });

      // Reset form
      setNewItem({
        name: "",
        quantity: "",
        unit: "",
        category: "",
        storageLocation: "",
        expiryDate: undefined,
      });
      toast({
        title: "Đã thêm thực phẩm",
        description: "Thực phẩm đã được thêm vào tủ lạnh.",
      });
    },
    onError: (err: any) => {
      console.error("Lỗi khi thêm thực phẩm:", err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể thêm thực phẩm.",
        variant: "destructive",
      });
    },
  });

  const addItem = () => {
    // Kiểm tra các trường bắt buộc (Giữ nguyên logic kiểm tra)
    if (
      !newItem.name ||
      !newItem.quantity ||
      !newItem.unit ||
      !newItem.storageLocation ||
      !newItem.expiryDate
    ) {
      toast({
        title: "Thiếu thông tin",
        description:
          "Vui lòng điền đủ Tên, Số lượng, Đơn vị, Vị trí và Ngày hết hạn.",
        variant: "destructive",
      });
      return;
    }

    const quantityNum = parseFloat(newItem.quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      toast({
        title: "Số lượng không hợp lệ",
        description: "Vui lòng nhập số lượng là một số dương.",
        variant: "destructive",
      });
      return;
    }

    // Chuẩn bị dữ liệu gửi đi
    const foodItemToSend: Omit<
      FoodItemData,
      "_id" | "createdAt" | "updatedAt" | "isExpired"
    > = {
      name: newItem.name,
      quantity: quantityNum,
      unit: newItem.unit,
      category: newItem.category || undefined,
      storageLocation: newItem.storageLocation,
      expiryDate: newItem.expiryDate.toISOString(), // Chuyển Date object thành ISO string
    };

    addItemMutation.mutate(foodItemToSend); // Kích hoạt mutation
  };

  // --- ⭐️ 3. Thao tác Xóa (DELETE) bằng useMutation ---
  const deleteItemMutation = useMutation({
    mutationFn: deleteFoodItem,
    onSuccess: () => {
      // Thành công: Yêu cầu React Query fetch lại data
      queryClient.invalidateQueries({ queryKey: [FRIDGE_ITEMS_QUERY_KEY] });
      toast({
        title: "Đã xóa thực phẩm",
        description: "Thực phẩm đã được xóa khỏi tủ lạnh.",
      });
    },
    onError: (err: any) => {
      console.error("Lỗi khi xóa thực phẩm:", err);
      toast({
        title: "Lỗi",
        description: err.response?.data?.message || "Không thể xóa thực phẩm.",
        variant: "destructive",
      });
    },
  });

  const deleteItem = (id: string) => {
    deleteItemMutation.mutate(id); // Kích hoạt mutation
  };

  // ❌ Loại bỏ: Logic fetchItems và useEffect tải dữ liệu ban đầu
  // ❌ Loại bỏ: useEffect(() => { fetchItems(); }, []);

  // --- Logic tính toán ngày hết hạn và trạng thái (Giữ nguyên) ---
  const getDaysUntilExpiry = (expiryDate: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);

    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpiryStatus = (expiryDate: Date) => {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0)
      return { status: "expired", label: "Đã hết hạn", color: "destructive" };
    if (days === 0)
      return {
        status: "today",
        label: "Hết hạn hôm nay",
        color: "destructive",
      };
    if (days <= 3)
      return {
        status: "warning",
        label: `Còn ${days} ngày`,
        color: "destructive",
      };
    if (days <= 7)
      return { status: "soon", label: `Còn ${days} ngày`, color: "default" };
    return { status: "good", label: `Còn ${days} ngày`, color: "secondary" };
  };

  // --- Lọc và tìm kiếm ---
  // Sử dụng fridgeItems thay cho items
  const filteredItems = fridgeItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Items sắp hết hạn (sử dụng fridgeItems)
  const expiringItems = fridgeItems.filter(
    (item) =>
      getDaysUntilExpiry(item.expiryDate) <= 3 &&
      getDaysUntilExpiry(item.expiryDate) >= 0
  );

  // --- Hiển thị Trạng thái Loading/Error ---
  // ⭐️ Sử dụng isLoading và error từ useQuery
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-700">
          Đang tải thực phẩm từ tủ lạnh...
        </p>
      </div>
    );
  }

  // ⭐️ Sử dụng error từ useQuery
  if (error) {
    return (
      <div className="text-center py-12 text-red-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
        <p className="text-xl">
          Đã xảy ra lỗi: {error.message || "Không thể tải dữ liệu."}
        </p>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: [FRIDGE_ITEMS_QUERY_KEY],
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
          <Refrigerator className="h-8 w-8 text-primary" />
          Quản lý tủ lạnh
        </h1>
        <p className="text-lg text-gray-600">
          Theo dõi thực phẩm trong tủ lạnh và hạn sử dụng
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Tổng thực phẩm
                </p>
                <p className="text-3xl font-bold text-gray-900">{totalItems}</p>
              </div>
              <Refrigerator className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Sắp hết hạn</p>
                <p className="text-3xl font-bold text-orange-600">
                  {expiringItems.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Danh mục</p>
                {/* Sử dụng Set để đếm số danh mục duy nhất */}
                <p className="text-3xl font-bold text-green-600">
                  {new Set(fridgeItems.map((item) => item.category)).size}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 font-bold">🥬</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Add New Item */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Thêm thực phẩm mới
          </CardTitle>
          <CardDescription>
            Thêm thực phẩm mới vào tủ lạnh của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Tên thực phẩm</Label>
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
                type="number" // Đảm bảo input là số
                placeholder="Ví dụ: 500"
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
              <Label htmlFor="storageLocation">Vị trí lưu trữ</Label>
              <Select
                value={newItem.storageLocation}
                onValueChange={(value) =>
                  setNewItem({ ...newItem, storageLocation: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn vị trí" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Danh mục (Tùy chọn)</Label>
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
            <div className="space-y-2">
              <Label>Ngày hết hạn</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newItem.expiryDate
                      ? format(newItem.expiryDate, "dd/MM/yyyy", { locale: vi })
                      : "Chọn ngày"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={newItem.expiryDate}
                    onSelect={(date) =>
                      setNewItem({ ...newItem, expiryDate: date })
                    }
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          {/* ⭐️ Sử dụng addItemMutation.isPending cho loading state */}
          <Button
            onClick={addItem}
            className="w-full"
            disabled={addItemMutation.isPending}
          >
            {addItemMutation.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            Thêm vào tủ lạnh
          </Button>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm thực phẩm..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Lọc theo danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Fridge Items */}
      <Card>
        <CardHeader>
          <CardTitle>Thực phẩm trong tủ lạnh</CardTitle>
          <CardDescription>
            {filteredItems.length} thực phẩm được tìm thấy
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Refrigerator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Không tìm thấy thực phẩm nào</p>
                <p className="text-sm">
                  Thử thay đổi bộ lọc hoặc thêm thực phẩm mới
                </p>
              </div>
            ) : (
              filteredItems.map((item) => {
                const expiryStatus = getExpiryStatus(item.expiryDate);
                return (
                  <div
                    key={item._id} // Sử dụng _id từ MongoDB
                    className="p-4 border rounded-lg bg-white hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{item.name}</h4>
                          <Badge variant={expiryStatus.color as any}>
                            {expiryStatus.status === "expired"
                              ? "Hết hạn"
                              : expiryStatus.label}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Danh mục:</span>{" "}
                            {item.category || "Chưa phân loại"}
                          </div>
                          <div>
                            <span className="font-medium">Số lượng:</span>{" "}
                            {item.quantity} {item.unit}
                          </div>
                          <div>
                            <span className="font-medium">Vị trí:</span>{" "}
                            {item.storageLocation}
                          </div>
                          <div>
                            <span className="font-medium">Hết hạn:</span>{" "}
                            {format(item.expiryDate, "dd/MM/yyyy", {
                              locale: vi,
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        // ⭐️ Sử dụng deleteItem với id
                        onClick={() => deleteItem(item._id!)}
                        className="text-red-500 hover:text-red-700"
                        // ⭐️ Disabled khi đang gửi API
                        disabled={deleteItemMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Fridge;
