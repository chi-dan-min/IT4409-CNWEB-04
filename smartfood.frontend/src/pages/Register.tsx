import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Mail, Lock, User, ShoppingCart } from "lucide-react"; // Bỏ Phone icon
import { toast } from "@/hooks/use-toast";
import axios from "axios";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "", // Đã đổi từ fullName thành username
    email: "",
    // phone: "", // Loại bỏ trường phone vì không có trong User model hiện tại
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const API_URL = "http://localhost:5000/api/auth/register";

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Lỗi",
        description: "Mật khẩu xác nhận không khớp.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(API_URL, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        // Không gửi trường 'phone' nếu nó không có trong model
      });

      if (response.data && response.data.token) {
        localStorage.setItem("userToken", response.data.token);
        localStorage.setItem("userInfo", JSON.stringify(response.data));

        toast({
          title: "Đăng ký thành công!",
          description: "Tài khoản của bạn đã được tạo và tự động đăng nhập. Chào mừng bạn đến với Smart Shopping.",
          variant: "success",
        });

        navigate("/");
      } else {
        toast({
          title: "Đăng ký thành công!",
          description: "Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để tiếp tục.",
          variant: "success",
        });
        navigate("/login");
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Đã xảy ra lỗi không xác định khi đăng ký.";
      toast({
        title: "Đăng ký thất bại",
        description: errorMessage,
        variant: "destructive",
      });
      console.error("Register error:", error);
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
          <p className="text-gray-600 mt-2">Tạo tài khoản mới</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đăng ký</CardTitle>
            <CardDescription className="text-center">
              Tạo tài khoản để bắt đầu sử dụng Smart Shopping
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Tên người dùng</Label> {/* Thay đổi Label */}
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="username" // Thay đổi ID
                    type="text"
                    placeholder="Nhập tên người dùng" // Thay đổi placeholder
                    className="pl-10"
                    value={formData.username}
                    onChange={handleChange("username")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-10"
                    value={formData.email}
                    onChange={handleChange("email")}
                    required
                  />
                </div>
              </div>

              {/* Loại bỏ phần nhập số điện thoại */}
              {/* <div className="space-y-2">
                <Label htmlFor="phone">Số điện thoại</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="0123456789"
                    className="pl-10"
                    value={formData.phone}
                    onChange={handleChange("phone")}
                    required
                  />
                </div>
              </div> */}
              
              <div className="space-y-2">
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Nhập mật khẩu"
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={handleChange("password")}
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    className="pl-10 pr-10"
                    value={formData.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input type="checkbox" id="terms" className="rounded" required />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Tôi đồng ý với{" "}
                  <Link to="/terms" className="text-primary hover:underline">
                    Điều khoản sử dụng
                  </Link>{" "}
                  và{" "}
                  <Link to="/privacy" className="text-primary hover:underline">
                    Chính sách bảo mật
                  </Link>
                </label>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-fresh hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Đang tạo tài khoản..." : "Đăng ký"}
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
                  Đã có tài khoản?{" "}
                  <Link to="/login" className="text-primary font-medium hover:underline">
                    Đăng nhập ngay
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

export default Register;