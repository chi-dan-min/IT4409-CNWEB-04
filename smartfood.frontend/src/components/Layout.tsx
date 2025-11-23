import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { ReactNode, useState, useEffect } from "react"; // Import useState, useEffect
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { LogIn, UserPlus, User, LogOut } from "lucide-react"; // Import User, LogOut icons
import { toast } from "@/hooks/use-toast"; // Thêm toast nếu bạn muốn dùng cho logout

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [userLoggedIn, setUserLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const navigate = useNavigate(); // Khởi tạo useNavigate

  useEffect(() => {
    // Hàm này sẽ kiểm tra trạng thái đăng nhập khi component được mount
    // và mỗi khi userToken trong localStorage thay đổi
    const checkLoginStatus = () => {
      const token = localStorage.getItem("userToken");
      const userInfoString = localStorage.getItem("userInfo");

      if (token && userInfoString) {
        try {
          const userInfo = JSON.parse(userInfoString);
          setUserLoggedIn(true);
          setUsername(userInfo.username || userInfo.email); // Ưu tiên username, nếu không có thì dùng email
        } catch (e) {
          console.error("Failed to parse userInfo from localStorage", e);
          // Xóa các item nếu dữ liệu bị lỗi
          localStorage.removeItem("userToken");
          localStorage.removeItem("userInfo");
          setUserLoggedIn(false);
          setUsername("");
        }
      } else {
        setUserLoggedIn(false);
        setUsername("");
      }
    };

    // Chạy lần đầu khi component mount
    checkLoginStatus();

    // Thêm event listener để lắng nghe thay đổi của localStorage
    // Điều này giúp cập nhật UI khi người dùng đăng nhập/đăng xuất ở tab khác
    window.addEventListener('storage', checkLoginStatus);

    // Dọn dẹp event listener khi component unmount
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []); // [] đảm bảo useEffect chỉ chạy một lần khi mount và dọn dẹp khi unmount

  const handleLogout = () => {
    localStorage.removeItem("userToken"); // Xóa token
    localStorage.removeItem("userInfo"); // Xóa thông tin người dùng
    setUserLoggedIn(false); // Cập nhật trạng thái
    setUsername(""); // Xóa tên người dùng
    
    toast({
      title: "Đăng xuất thành công!",
      description: "Hẹn gặp lại bạn.",
      variant: "success", // Nếu bạn có variant success
    });

    navigate("/login"); // Chuyển hướng về trang đăng nhập
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 overflow-hidden">
          <header className="h-16 border-b bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 sticky top-0 z-40">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="lg:hidden" />
              <div className="flex items-center gap-2 ml-4 lg:ml-0">
                <div className="w-8 h-8 bg-gradient-fresh rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">🛒</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
                  Smart Shopping
                </h1>
              </div>
            </div>

            {/* Auth buttons or User Info */}
            <div className="flex items-center gap-2">
              {userLoggedIn ? (
                // Nếu người dùng đã đăng nhập
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/profile" className="flex items-center gap-2"> {/* Link đến trang hồ sơ người dùng */}
                      <User className="h-4 w-4" />
                      <span className="hidden sm:inline">{username}</span>
                    </Link>
                  </Button>
                  <Button onClick={handleLogout} size="sm" className="bg-red-500 hover:bg-red-600"> {/* Nút đăng xuất */}
                    <LogOut className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Đăng xuất</span>
                  </Button>
                </>
              ) : (
                // Nếu người dùng chưa đăng nhập
                <>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/login" className="flex items-center gap-2">
                      <LogIn className="h-4 w-4" />
                      <span className="hidden sm:inline">Đăng nhập</span>
                    </Link>
                  </Button>
                  <Button asChild size="sm" className="bg-gradient-fresh hover:opacity-90">
                    <Link to="/register" className="flex items-center gap-2">
                      <UserPlus className="h-4 w-4" />
                      <span className="hidden sm:inline">Đăng ký</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </header>
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}