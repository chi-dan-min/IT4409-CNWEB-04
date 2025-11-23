import { useState, useEffect } from "react";
import { Home, ShoppingCart, Refrigerator, Calendar, ChefHat, Users, Settings } from "lucide-react"; // Import Users icon
import { NavLink, useLocation } from "react-router-dom";
import { getUserInfo } from '../utils/auth'; // Đảm bảo đường dẫn đúng tới hàm getUserInfo

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

// Định nghĩa các mục menu dành cho User thông thường
const userMenuItems = [
  { title: "Tổng quan", url: "/", icon: Home },
  { title: "Danh sách mua sắm", url: "/shopping-list", icon: ShoppingCart },
  { title: "Quản lý tủ lạnh", url: "/fridge", icon: Refrigerator },
  { title: "Kế hoạch bữa ăn", url: "/meal-plan", icon: Calendar },
  { title: "Gợi ý món ăn", url: "/recipes", icon: ChefHat },
];

// Định nghĩa các mục menu dành riêng cho Admin
const adminMenuItems = [
  { title: "Quản lý công thức", url: "/recipes", icon: ChefHat }, // Đã đổi tên
  { title: "Quản lý người dùng", url: "/users", icon: Users }, // Thêm mục Quản lý người dùng
];

const familyItems = [
  { title: "Quản lý gia đình", url: "/family", icon: Users },
];

const settingsItems = [
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const userInfo = getUserInfo();
    if (userInfo && userInfo.role) {
      setUserRole(userInfo.role);
    } else {
      setUserRole(null);
    }
  }, []);

  const isActive = (path: string) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  const getNavClassName = (path: string) => {
    const active = isActive(path);
    return active
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary"
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";
  };

  // Chọn danh sách menu dựa trên vai trò người dùng
  const displayedMenuItems = userRole === 'admin' ? adminMenuItems : userMenuItems;

  return (
    <Sidebar className="w-64">
      <SidebarContent className="bg-gradient-light">
        <div className="p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-fresh rounded-xl flex items-center justify-center animate-glow">
              <span className="text-white font-bold">🛒</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-800">Smart Shopping</h2>
              <p className="text-sm text-green-600">Quản lý thông minh</p>
            </div>
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Chức năng chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {displayedMenuItems.map((item) => ( // Sử dụng displayedMenuItems
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={getNavClassName(item.url)}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Ẩn các nhóm menu khác nếu là admin */}
        {userRole !== 'admin' && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel>Gia đình</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {familyItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel>Tùy chỉnh</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {settingsItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink to={item.url} className={getNavClassName(item.url)}>
                          <item.icon className="h-5 w-5" />
                          <span>{item.title}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>
    </Sidebar>
  );
}