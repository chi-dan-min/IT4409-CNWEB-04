import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Import useNavigate
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import axios from "axios"; // Import axios

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate(); // Khởi tạo useNavigate

  // Base URL của API backend của bạn
  const API_URL = "http://localhost:5000/api/auth/login"; 

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        email,
        password,
      });

      // Kiểm tra xem phản hồi có chứa token không
      if (response.data && response.data.token) {
        // Lưu token vào localStorage (hoặc sessionStorage)
        // Đây là cách thông thường để lưu JWT client-side
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem("userInfo", JSON.stringify(response.data)); // Lưu thêm thông tin người dùng

        toast({
          title: "Đăng nhập thành công!",
          description: "Chào mừng bạn trở lại Smart Shopping",
          variant: "success", // Nếu bạn có variant success
        });

        // --- Bắt đầu phần thay đổi: Kiểm tra vai trò của người dùng ---
        if (response.data.role === "admin") {
          navigate("/recipes"); // Chuyển hướng đến /recipes nếu là admin
        } else {
          navigate("/"); // Chuyển hướng đến trang chính cho các vai trò khác
        }
        // --- Kết thúc phần thay đổi ---

      } else {
        // Xử lý trường hợp không có token trong phản hồi (có thể xảy ra nếu API có lỗi logic)
        toast({
          title: "Lỗi đăng nhập",
          description: "Không nhận được token từ server. Vui lòng thử lại.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      // Xử lý lỗi từ API
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi không xác định.";
      toast({
        title: "Đăng nhập thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-light p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-fresh rounded-xl flex items-center justify-center mx-auto mb-4 animate-glow">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Smart Shopping
          </h1>
          <p className="text-gray-600 mt-2">Hệ thống đi chợ thông minh</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
            <CardDescription className="text-center">
              Nhập thông tin để truy cập tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="pl-10 pr-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm">
                  <input type="checkbox" className="rounded" />
                  <span>Ghi nhớ đăng nhập</span>
                </label>
                <Link to="/forgot-password" className="text-primary hover:underline text-sm">
                  Quên mật khẩu?
                </Link>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-fresh hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Hoặc</span>
                </div>
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Chưa có tài khoản?{" "}
                  <Link to="/register" className="text-primary font-medium hover:underline">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;