import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Refrigerator,
  Calendar,
  ChefHat,
  AlertTriangle,
  TrendingUp,
  LogIn,
  UserPlus,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Import API services
import { getFoodItems, FoodItemData } from "@/services/foodItemService";
import shoppingListService, {
  ShoppingListData,
} from "@/services/shoppingListService";
import { getMealPlans, MealPlanData } from "@/services/mealPlanService";
import { format, isBefore, addDays } from "date-fns";

// ⭐️ Giữ nguyên các Interface Data (FoodItemData, ShoppingListData, MealPlanData, DashboardData)
interface FoodItemData {
  _id: string;
  name: string;
  quantity: number;
  unit: string;
  expiryDate?: string;
  category?: string;
  notes?: string;
  user: string;
  createdAt: string;
  updatedAt: string;
}

interface ShoppingListData {
  _id: string;
  name: string;
  type: string;
  user: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    category?: string;
    isPurchased: boolean;
  }[];
  createdAt: string;
  updatedAt: string;
}

interface MealPlanData {
  _id: string;
  name: string;
  type: "daily" | "weekly";
  user: string;
  meals: {
    date: string;
    mealType: string;
    recipe: string; // or RecipeData if populated
    notes?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

const DASHBOARD_STATS_QUERY_KEY = "dashboardStats";

interface DashboardData {
  expiredFoodItemsCount: number;
  shoppingListItemsCount: number;
  fridgeItemsCount: number;
  plannedMealsCount: number;
  recentActivities: string[];
}

const fetchAllDashboardData = async (): Promise<DashboardData> => {
  // 1. Fetch dữ liệu đồng thời
  const [foodItems, shoppingLists, mealPlans] = await Promise.all([
    getFoodItems(),
    shoppingListService.getShoppingLists(),
    getMealPlans(),
  ]);

  // 2. Xử lý logic tính toán
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);
  let expiringCount = 0;
  foodItems.forEach((item: FoodItemData) => {
    if (item.expiryDate) {
      const expiryDate = new Date(item.expiryDate);
      if (
        isBefore(expiryDate, threeDaysFromNow) &&
        !isBefore(expiryDate, now)
      ) {
        expiringCount++;
      }
    }
  });

  let totalShoppingItems = 0;
  shoppingLists.forEach((list: ShoppingListData) => {
    totalShoppingItems += list.items.filter((item) => !item.isPurchased).length;
  });

  let totalPlannedMeals = 0;
  mealPlans.forEach((plan: MealPlanData) => {
    totalPlannedMeals += plan.meals.length;
  });

  const activities: string[] = [];
  if (totalShoppingItems > 0)
    activities.push(
      `Có ${totalShoppingItems} sản phẩm trong danh sách mua sắm.`
    );
  if (expiringCount > 0)
    activities.push(`Có ${expiringCount} sản phẩm sắp hết hạn.`);
  if (totalPlannedMeals > 0)
    activities.push(`Có ${totalPlannedMeals} bữa ăn đã được lên kế hoạch.`);
  if (foodItems.length > 0)
    activities.push(
      `Bạn đang có ${foodItems.length} loại thực phẩm trong tủ lạnh.`
    );

  // 3. Trả về đối tượng DashboardData đã tính toán
  return {
    expiredFoodItemsCount: expiringCount,
    shoppingListItemsCount: totalShoppingItems,
    fridgeItemsCount: foodItems.length,
    plannedMealsCount: totalPlannedMeals,
    recentActivities: activities.slice(0, 3),
  };
};

const Index = () => {
  const queryClient = useQueryClient();
  const [userLoggedIn, setUserLoggedIn] = useState(false);

  // ⭐️ Logic kiểm tra đăng nhập
  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem("userToken");
      setUserLoggedIn(!!token);
    };
    checkLoginStatus();
    window.addEventListener("storage", checkLoginStatus);
    return () => {
      window.removeEventListener("storage", checkLoginStatus);
    };
  }, []);

  // SỬ DỤNG useQuery CHO CÁC SỐ LIỆU THỐNG KÊ
  const {
    data: stats,
    isLoading: loadingStats,
    error: queryError,
  } = useQuery({
    queryKey: [DASHBOARD_STATS_QUERY_KEY],
    queryFn: fetchAllDashboardData,
    enabled: userLoggedIn,
    staleTime: 1000 * 60,
  });

  const emptyStats: DashboardData = {
    expiredFoodItemsCount: 0,
    shoppingListItemsCount: 0,
    fridgeItemsCount: 0,
    plannedMealsCount: 0,
    recentActivities: [],
  };
  const currentStats = stats || emptyStats;
  const recentActivities = currentStats.recentActivities;

  // ⭐️ ĐỊNH NGHĨA LẠI quickStats VÀ quickActions (SỬ DỤNG currentStats)
  const quickStats = [
    {
      title: "Sản phẩm sắp hết hạn",
      value: loadingStats ? (
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-1" />
      ) : (
        currentStats.expiredFoodItemsCount.toString()
      ),
      description: "Trong 3 ngày tới",
      icon: AlertTriangle,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/food-items?filter=expiring",
    },
    {
      title: "Danh sách mua sắm",
      value: loadingStats ? (
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-1" />
      ) : (
        currentStats.shoppingListItemsCount.toString()
      ),
      description: "Sản phẩm cần mua",
      icon: ShoppingCart,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/shopping-list",
    },
    {
      title: "Thực phẩm trong tủ lạnh",
      value: loadingStats ? (
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-1" />
      ) : (
        currentStats.fridgeItemsCount.toString()
      ),
      description: "Loại thực phẩm",
      icon: Refrigerator,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/food-items",
    },
    {
      title: "Bữa ăn đã lên kế hoạch",
      value: loadingStats ? (
        <Loader2 className="h-5 w-5 animate-spin inline-block mr-1" />
      ) : (
        currentStats.plannedMealsCount.toString()
      ),
      description: "Món ăn đã lên kế hoạch",
      icon: Calendar,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/meal-plan",
    },
  ];

  const quickActions = [
    {
      title: "Danh sách mua sắm",
      description: "Thêm mới vào danh sách mua sắm",
      icon: ShoppingCart,
      href: "/shopping-list",
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Quản lý tủ lạnh",
      description: "Cập nhật thực phẩm trong tủ lạnh",
      icon: Refrigerator,
      href: "/fridge",
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Kế hoạch bữa ăn",
      description: "Lên kế hoạch cho bữa ăn",
      icon: Calendar,
      href: "/meal-plan",
      gradient: "from-purple-500 to-purple-600",
    },
    {
      title: "Gợi ý món ăn",
      description: "Khám phá món ăn mới",
      icon: ChefHat,
      href: "/recipes",
      gradient: "from-orange-500 to-orange-600",
    },
  ];
  // ⭐️ Kết thúc ĐỊNH NGHĨA LẠI

  // Xử lý Loading/Error
  if (loadingStats && userLoggedIn) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-3 text-lg text-gray-700">
          Đang tải số liệu bảng điều khiển...
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
          {queryError.message || "Không thể tải dữ liệu bảng điều khiển."}
        </p>
        <Button
          onClick={() =>
            queryClient.invalidateQueries({
              queryKey: [DASHBOARD_STATS_QUERY_KEY],
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
      <div className="space-y-4">
        <h1 className="text-3xl font-bold text-gray-900">
          Chào mừng đến với Smart Shopping! 👋
        </h1>
        <p className="text-lg text-gray-600">
          Hệ thống quản lý mua sắm và bữa ăn thông minh cho gia đình bạn
        </p>

        {/* Phần Login/Register */}
        {!userLoggedIn && (
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Bắt đầu ngay hôm nay!
                  </h3>
                  <p className="text-gray-600">
                    Đăng ký tài khoản để lưu trữ và đồng bộ dữ liệu của bạn
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button asChild variant="outline">
                    <Link to="/login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      Đăng nhập
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-gradient-fresh hover:opacity-90"
                  >
                    <Link to="/register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      Đăng ký miễn phí
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {userLoggedIn && (
        <>
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStats.map((stat, index) => (
              <Card
                key={index}
                className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                {stat.href ? (
                  <Link to={stat.href}>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-600">
                            {stat.title}
                          </p>
                          <p className="text-3xl font-bold text-gray-900">
                            {stat.value}
                          </p>
                          <p className="text-xs text-gray-500">
                            {stat.description}
                          </p>
                        </div>
                        <div className={`p-3 rounded-full ${stat.bgColor}`}>
                          <stat.icon className={`h-6 w-6 ${stat.color}`} />
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                ) : (
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                          {stat.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {stat.value}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stat.description}
                        </p>
                      </div>
                      <div className={`p-3 rounded-full ${stat.bgColor}`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Thao tác nhanh</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {quickActions.map((action, index) => (
                <Card
                  key={index}
                  className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden"
                >
                  <CardContent className="p-0">
                    <Link to={action.href} className="block">
                      <div
                        className={`h-32 bg-gradient-to-br ${action.gradient} flex items-center justify-center relative overflow-hidden`}
                      >
                        <action.icon className="h-12 w-12 text-white group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-white/10 group-hover:bg-white/20 transition-colors duration-300"></div>
                      </div>
                      <div className="p-4">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary transition-colors duration-300">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                      </div>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Hoạt động gần đây
              </CardTitle>
              <CardDescription>
                Những thay đổi mới nhất trong hệ thống của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStats ? (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                  <p className="ml-2 text-gray-600">Đang tải hoạt động...</p>
                </div>
              ) : recentActivities.length > 0 ? (
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {activity}
                        </p>
                        <p className="text-xs text-gray-500">Vừa cập nhật</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-4">
                  Chưa có hoạt động gần đây nào.
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default Index;
