
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Bell, User, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const Settings = () => {
  const [settings, setSettings] = useState({
    // Basic user info
    name: "Nguyễn Văn A",
    email: "vana@email.com",
    
    // Simple notifications
    expireNotifications: true,
    shoppingReminders: true,
    
    // Basic preferences
    language: "vi",
    theme: "light",
  });

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    toast({
      title: "Đã lưu cài đặt",
      description: "Các thay đổi của bạn đã được lưu thành công",
    });
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <SettingsIcon className="h-8 w-8 text-primary" />
          Cài đặt
        </h1>
        <p className="text-lg text-gray-600">
          Tùy chỉnh các thiết lập cho ứng dụng của bạn
        </p>
      </div>

      {/* Account Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Thông tin tài khoản
          </CardTitle>
          <CardDescription>
            Quản lý thông tin cá nhân của bạn
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên</Label>
              <Input
                id="name"
                value={settings.name}
                onChange={(e) => updateSetting('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={settings.email}
                onChange={(e) => updateSetting('email', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Thông báo
          </CardTitle>
          <CardDescription>
            Chọn loại thông báo bạn muốn nhận
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="expire-notifications">Thông báo hết hạn</Label>
                <p className="text-sm text-gray-600">
                  Nhận thông báo khi thực phẩm sắp hết hạn
                </p>
              </div>
              <Switch
                id="expire-notifications"
                checked={settings.expireNotifications}
                onCheckedChange={(checked) => updateSetting('expireNotifications', checked)}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="shopping-reminders">Nhắc nhở mua sắm</Label>
                <p className="text-sm text-gray-600">
                  Nhận nhắc nhở về danh sách mua sắm
                </p>
              </div>
              <Switch
                id="shopping-reminders"
                checked={settings.shoppingReminders}
                onCheckedChange={(checked) => updateSetting('shoppingReminders', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Display Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Giao diện</CardTitle>
          <CardDescription>
            Tùy chỉnh giao diện và ngôn ngữ hiển thị
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Ngôn ngữ</Label>
              <Select value={settings.language} onValueChange={(value) => updateSetting('language', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vi">Tiếng Việt</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="theme">Giao diện</Label>
              <Select value={settings.theme} onValueChange={(value) => updateSetting('theme', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Sáng</SelectItem>
                  <SelectItem value="dark">Tối</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSettings} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          Lưu tất cả thay đổi
        </Button>
      </div>
    </div>
  );
};

export default Settings;
