import React, { useState, useEffect, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

import userService from "@/services/userService";
import EditUserModal from "@/components/EditUserModal";

// Định nghĩa kiểu dữ liệu cho User - CHỈ CÒN 'user' VÀ 'admin'
interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
}

const UserManagementPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentUserToEdit, setCurrentUserToEdit] = useState<User | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await userService.getUsers();
      // Đảm bảo dữ liệu role nhận về chỉ là 'user' hoặc 'admin'
      const processedUsers = data.map((user: any) => ({
        ...user,
        role: user.role === 'admin' ? 'admin' : 'user' // Ép kiểu về 2 role chính
      }));
      setUsers(processedUsers);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách người dùng.");
      toast({
        title: "Lỗi tải dữ liệu",
        description: err.response?.data?.message || "Đã xảy ra lỗi khi lấy danh sách người dùng.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === "all" || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleEditUser = (user: User) => {
    setCurrentUserToEdit(user);
    setIsEditModalOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng này?`)) {
      try {
        await userService.deleteUser(userId);
        toast({
          title: "Xóa người dùng",
          description: "Người dùng đã được xóa thành công.",
          variant: "success",
        });
        fetchUsers();
      } catch (err: any) {
        toast({
          title: "Lỗi xóa người dùng",
          description: err.response?.data?.message || "Không thể xóa người dùng.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-lg text-gray-600">Đang tải danh sách người dùng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <p className="text-lg text-red-600">Lỗi: {error}</p>
        <Button onClick={fetchUsers} className="mt-4">Thử lại</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-gray-800">Quản lý người dùng</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Tìm kiếm theo tên hoặc email..."
              className="pl-9 pr-4 py-2 w-full border rounded-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select onValueChange={setFilterRole} defaultValue="all">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Lọc theo vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả vai trò</SelectItem>
              <SelectItem value="admin">Quản trị viên</SelectItem>
              <SelectItem value="user">Người dùng</SelectItem>
              {/* ĐÃ BỎ SelectItem cho "editor" */}
            </SelectContent>
          </Select>
        </div>

        {/* User Table */}
        <Table className="min-w-full">
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-[50px] text-gray-600">ID</TableHead>
              <TableHead className="text-gray-600">Tên</TableHead>
              <TableHead className="text-gray-600">Email</TableHead>
              <TableHead className="text-gray-600">Vai trò</TableHead>
              <TableHead className="text-right text-gray-600">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium text-gray-700">{user.id}</TableCell>
                  <TableCell>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      // Cập nhật logic variant và className cho 2 vai trò
                      variant={user.role === "admin" ? "default" : "outline"}
                      className={`${
                        user.role === "admin" ? "bg-green-600 hover:bg-green-700 text-white" : ""
                      }`}
                    >
                      {user.role === "admin" ? "Quản trị viên" : "Người dùng"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Mở menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
                          <Edit className="mr-2 h-4 w-4" /> Chỉnh sửa
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" /> Xóa
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  Không tìm thấy người dùng nào.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isEditModalOpen && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          user={currentUserToEdit}
          onUserUpdated={fetchUsers}
        />
      )}
    </div>
  );
};

export default UserManagementPage;