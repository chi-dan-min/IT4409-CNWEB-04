
import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, ArrowLeft, ShoppingCart } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate reset password process
    setTimeout(() => {
      setIsLoading(false);
      setEmailSent(true);
      toast({
        title: "Email đã được gửi!",
        description: "Vui lòng kiểm tra hộp thư để đặt lại mật khẩu",
      });
    }, 1000);
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-light p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-fresh rounded-xl flex items-center justify-center mx-auto mb-4 animate-glow">
              <Mail className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              Kiểm tra email
            </h1>
            <p className="text-gray-600 mt-2">
              Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến email của bạn
            </p>
          </div>

          <Card className="shadow-lg border-0">
            <CardContent className="p-6 text-center">
              <div className="space-y-4">
                <p className="text-gray-600">
                  Vui lòng kiểm tra hộp thư <strong>{email}</strong> để nhận hướng dẫn đặt lại mật khẩu.
                </p>
                <p className="text-sm text-gray-500">
                  Không thấy email? Kiểm tra thư mục spam hoặc{" "}
                  <button 
                    onClick={() => setEmailSent(false)}
                    className="text-primary hover:underline"
                  >
                    gửi lại
                  </button>
                </p>
                <Link 
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Quay lại đăng nhập
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-light p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-fresh rounded-xl flex items-center justify-center mx-auto mb-4 animate-glow">
            <ShoppingCart className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            Quên mật khẩu
          </h1>
          <p className="text-gray-600 mt-2">Nhập email để đặt lại mật khẩu</p>
        </div>

        <Card className="shadow-lg border-0">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold text-center">Đặt lại mật khẩu</CardTitle>
            <CardDescription className="text-center">
              Chúng tôi sẽ gửi hướng dẫn đến email của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleResetPassword} className="space-y-4">
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

              <Button 
                type="submit" 
                className="w-full bg-gradient-fresh hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Đang gửi..." : "Gửi hướng dẫn"}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link 
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-primary"
              >
                <ArrowLeft className="h-4 w-4" />
                Quay lại đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
