// src/components/EditUserModal.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import userService from "@/services/userService";

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Đảm bảo role chỉ có 'user' hoặc 'admin' ở đây
  user: { id: string; name: string; email: string; role: 'user' | 'admin' } | null;
  onUserUpdated: () => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, user, onUserUpdated }) => {
  const [username, setUsername] = useState(user?.name || '');
  const [role, setRole] = useState(user?.role || 'user'); // Mặc định là 'user'
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.name);
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      await userService.updateUser(user.id, { username, role });
      toast({
        title: "Cập nhật thành công",
        description: `Thông tin người dùng "${username}" đã được cập nhật.`,
      });
      onUserUpdated();
      onClose();
    } catch (err: any) {
      toast({
        title: "Lỗi cập nhật",
        description: err.response?.data?.message || "Không thể cập nhật người dùng.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa người dùng</DialogTitle>
          <DialogDescription>
            Thay đổi tên và vai trò của người dùng. Nhấn lưu khi hoàn tất.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Tên người dùng
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="role" className="text-right">
              Vai trò
            </Label>
            <Select onValueChange={setRole} value={role} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Chọn vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">Người dùng</SelectItem>
                <SelectItem value="admin">Quản trị viên</SelectItem>
                {/* ĐÃ BỎ SelectItem cho "editor" */}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditUserModal;