import React, { useState, useEffect } from "react"; // <--- Add React here
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, UserPlus, Crown, Settings, Mail, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import familyGroupService from "@/services/familyGroupService";

// Import Tabs components
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Import ShoppingListTab component
import ShoppingListTab from "@/components/ShoppingListTab";

// Định nghĩa kiểu dữ liệu cho thành viên gia đình từ backend
interface FamilyMember {
  user: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  role: 'admin' | 'member'; // Chỉ còn 2 role: admin và member
  joinedAt: string;
}

// Định nghĩa kiểu dữ liệu cho FamilyGroup từ backend
interface FamilyGroupData {
  _id: string;
  name: string;
  owner: string;
  members: FamilyMember[];
  currentUserRole: 'admin' | 'member' | 'none'; // Đã cập nhật currentUserRole
  createdAt: string;
  updatedAt: string;
}

const Family = () => {
  const queryClient = useQueryClient();
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [showCreateGroupForm, setShowCreateGroupForm] = useState(false);
  const [activeTab, setActiveTab] = useState("management");

  // Lấy dữ liệu các nhóm gia đình của người dùng
  const { data: familyGroups, isLoading, isError, error } = useQuery<FamilyGroupData[]>({
    queryKey: ['familyGroups'],
    queryFn: familyGroupService.getFamilyGroups,
    staleTime: 5 * 60 * 1000,
  });

  // Chọn nhóm đầu tiên nếu có, khi dữ liệu được load lần đầu
  // Sử dụng useEffect để đảm bảo logic này chạy sau khi component đã render
  // và familyGroups đã có dữ liệu.
  // Đồng thời, tránh lỗi "setState in render"
  // (Lưu ý: Bạn có thể cần điều chỉnh logic này nếu có nhiều nhóm và bạn muốn lưu lựa chọn nhóm của người dùng.)
  React.useEffect(() => {
    if (familyGroups && familyGroups.length > 0 && !activeGroupId) {
      setActiveGroupId(familyGroups[0]._id);
    }
  }, [familyGroups, activeGroupId]); // Thêm activeGroupId vào dependency array

  const activeGroup = familyGroups?.find(group => group._id === activeGroupId);
  const familyMembers = activeGroup ? activeGroup.members : [];
  // Lấy vai trò của người dùng hiện tại trong nhóm đang hoạt động
  const currentUserRole = activeGroup ? activeGroup.currentUserRole : 'none';

  // Mutation để tạo nhóm gia đình mới
  const createGroupMutation = useMutation({
    mutationFn: familyGroupService.createFamilyGroup,
    onSuccess: (data) => {
      toast({
        title: "Tạo nhóm thành công!",
        description: `Nhóm "${data.familyGroup.name}" đã được tạo.`,
      });
      setNewGroupName("");
      setShowCreateGroupForm(false);
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
      setActiveGroupId(data.familyGroup._id);
    },
    onError: (err: any) => {
      toast({
        title: "Tạo nhóm thất bại",
        description: err.response?.data?.message || "Đã có lỗi xảy ra khi tạo nhóm.",
        variant: "destructive",
      });
    },
  });

  // Mutation để mời thành viên
  const inviteMemberMutation = useMutation({
    mutationFn: ({ groupId, email }: { groupId: string, email: string }) => familyGroupService.inviteMember(groupId, email),
    onSuccess: () => {
      toast({
        title: "Đã gửi lời mời",
        description: `Lời mời đã được gửi đến ${inviteEmail} và thành viên đã được thêm vào nhóm.`,
      });
      setInviteEmail("");
      setShowInviteForm(false);
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
    },
    onError: (err: any) => {
      toast({
        title: "Mời thành viên thất bại",
        description: err.response?.data?.message || "Đã có lỗi xảy ra khi gửi lời mời.",
        variant: "destructive",
      });
    },
  });

  // Mutation để xóa thành viên
  const removeMemberMutation = useMutation({
    mutationFn: ({ groupId, memberId }: { groupId: string, memberId: string }) => familyGroupService.removeMember(groupId, memberId),
    onSuccess: () => {
      toast({
        title: "Đã xóa thành viên",
        description: "Thành viên đã được xóa khỏi nhóm gia đình.",
      });
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
    },
    onError: (err: any) => {
      toast({
        title: "Xóa thành viên thất bại",
        description: err.response?.data?.message || "Đã có lỗi xảy ra khi xóa thành viên.",
        variant: "destructive",
      });
    },
  });

  // Mutation để cập nhật vai trò thành viên
  const updateMemberRoleMutation = useMutation({
    mutationFn: ({ groupId, memberId, role }: { groupId: string, memberId: string, role: 'admin' | 'member' }) =>
      familyGroupService.updateMemberRole(groupId, memberId, role),
    onSuccess: () => {
      toast({
        title: "Cập nhật vai trò thành công",
        description: "Vai trò thành viên đã được cập nhật.",
      });
      queryClient.invalidateQueries({ queryKey: ['familyGroups'] });
    },
    onError: (err: any) => {
      toast({
        title: "Cập nhật vai trò thất bại",
        description: err.response?.data?.message || "Đã có lỗi xảy ra khi cập nhật vai trò.",
        variant: "destructive",
      });
    },
  });

  const handleCreateGroup = () => {
    if (newGroupName && createGroupMutation.status !== 'pending') {
      createGroupMutation.mutate(newGroupName);
    }
  };

  const handleSendInvite = () => {
    if (activeGroupId && inviteEmail && inviteMemberMutation.status !== 'pending') {
      inviteMemberMutation.mutate({ groupId: activeGroupId, email: inviteEmail });
    }
  };

  const handleRemoveMember = (memberId: string) => {
    if (activeGroupId && removeMemberMutation.status !== 'pending') {
      removeMemberMutation.mutate({ groupId: activeGroupId, memberId });
    }
  };

  const handleUpdateRole = (memberId: string, currentRole: 'admin' | 'member') => {
    if (activeGroupId && updateMemberRoleMutation.status !== 'pending') {
      const newRole = currentRole === 'admin' ? 'member' : 'admin';
      updateMemberRoleMutation.mutate({ groupId: activeGroupId, memberId, role: newRole });
    }
  };

  const roleColors = {
    admin: "destructive", // Hoặc màu sắc khác bạn muốn cho admin
    member: "secondary"
  };

  const roleLabels = {
    admin: "Quản trị viên",
    member: "Thành viên"
  };

  if (isLoading) {
    return <div className="text-center py-8">Đang tải dữ liệu nhóm gia đình...</div>;
  }

  if (isError) {
    return <div className="text-center py-8 text-red-500">Lỗi: {error?.message || "Không thể tải dữ liệu nhóm gia đình."}</div>;
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Quản lý gia đình
        </h1>
        <p className="text-lg text-gray-600">
          Quản lý thành viên gia đình và phân quyền sử dụng hệ thống
        </p>
      </div>

      {/* Tabs for Management and Shopping List */}
      <Tabs defaultValue="management" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="management">Quản lý nhóm</TabsTrigger>
          <TabsTrigger value="shopping-list">Danh sách mua sắm</TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="mt-4">
          {/* Group Selection / Creation */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Chọn hoặc tạo nhóm gia đình</CardTitle>
              <CardDescription>Chọn nhóm bạn muốn quản lý hoặc tạo một nhóm mới.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3 mb-4">
                {familyGroups?.map(group => (
                  <Button
                    key={group._id}
                    variant={activeGroupId === group._id ? "default" : "outline"}
                    onClick={() => setActiveGroupId(group._id)}
                  >
                    {group.name} {group.owner === "current_user_id" && "(Chủ sở hữu)"}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  onClick={() => setShowCreateGroupForm(!showCreateGroupForm)}
                >
                  {showCreateGroupForm ? "Hủy tạo nhóm" : "Tạo nhóm mới"}
                </Button>
              </div>

              {showCreateGroupForm && (
                <div className="space-y-4 mt-4">
                  <Label htmlFor="new-group-name">Tên nhóm mới</Label>
                  <div className="flex gap-2">
                    <Input
                      id="new-group-name"
                      placeholder="Tên nhóm gia đình của bạn"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                    />
                    <Button onClick={handleCreateGroup} disabled={createGroupMutation.status === 'pending'}>
                      {createGroupMutation.status === 'pending' ? 'Đang tạo...' : 'Tạo nhóm'}
                    </Button>
                  </div>
                  {createGroupMutation.isError && (
                    <p className="text-red-500 text-sm">
                      {createGroupMutation.error?.message || "Lỗi khi tạo nhóm."}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {activeGroup ? (
            <>
              {/* Family Members List - Hiển thị trước */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Thành viên của nhóm ({activeGroup.name})</CardTitle>
                  <CardDescription>
                    Quản lý thông tin và quyền của các thành viên.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {familyMembers.length > 0 ? (
                      familyMembers.map((member) => (
                        <div
                          key={member.user._id}
                          className="p-4 border rounded-lg bg-white flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10">
                              <AvatarFallback className="bg-primary text-white text-sm">
                                {member.user.avatar || member.user.name?.charAt(0).toUpperCase() || '??'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold text-base">{member.user.name}</h4>
                                <Badge variant={roleColors[member.role] as any} className="px-2 py-0.5 text-xs">
                                  {roleLabels[member.role]}
                                </Badge>
                                {member.role === 'admin' && (
                                  <Crown className="h-4 w-4 text-yellow-600" />
                                )}
                              </div>
                              <span className="flex items-center gap-1 text-xs text-gray-600">
                                <Mail className="h-3 w-3" />
                                {member.user.email}
                              </span>
                            </div>
                          </div>

                          {/* Actions for members - Chỉ hiển thị nếu currentUserRole là 'admin' */}
                          <div className="flex gap-2">
                            {currentUserRole === 'admin' && (
                              <>
                                {/* Nút thay đổi vai trò (admin <-> member) */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUpdateRole(member.user._id, member.role)}
                                  disabled={updateMemberRoleMutation.status === 'pending' || (member.role === 'admin' && activeGroup.members.filter(m => m.role === 'admin').length === 1)}
                                >
                                  <Settings className="h-4 w-4" />
                                </Button>
                                {/* Nút xóa thành viên (chỉ được xóa nếu không phải admin duy nhất) */}
                                {(member.role !== 'admin' || (member.role === 'admin' && activeGroup.members.filter(m => m.role === 'admin').length > 1)) && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveMember(member.user._id)}
                                    className="text-red-500 hover:text-red-700"
                                    disabled={removeMemberMutation.status === 'pending'}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Chưa có thành viên nào trong nhóm này.
                        {currentUserRole === 'admin' && " Hãy mời một người!"}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Invite New Member - CHỈ HIỂN THỊ NẾU currentUserRole LÀ 'admin' */}
              {currentUserRole === 'admin' && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Mời thành viên mới vào nhóm "{activeGroup.name}"
                      </span>
                      <Button
                        onClick={() => setShowInviteForm(!showInviteForm)}
                        size="sm"
                      >
                        {showInviteForm ? "Hủy" : "Mời thành viên"}
                      </Button>
                    </CardTitle>
                    {showInviteForm && (
                      <CardContent className="pt-4"> {/* Đã chuyển CardContent vào đây */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email người dùng</Label>
                            <Input
                              id="invite-email"
                              type="email"
                              placeholder="example@email.com"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                            />
                          </div>
                          <Button onClick={handleSendInvite} className="w-full" disabled={inviteMemberMutation.status === 'pending'}>
                            {inviteMemberMutation.status === 'pending' ? 'Đang gửi...' : 'Gửi lời mời'}
                          </Button>
                          {inviteMemberMutation.isError && (
                            <p className="text-red-500 text-sm">
                              {inviteMemberMutation.error?.message || "Lỗi khi gửi lời mời."}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    )}
                  </CardHeader>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Vui lòng chọn một nhóm gia đình để quản lý các thành viên.
            </div>
          )}
        </TabsContent>

        <TabsContent value="shopping-list" className="mt-4">
          <ShoppingListTab
            activeGroupId={activeGroupId}
            activeGroupName={activeGroup?.name}
            currentUserRole={currentUserRole}
          />
        </TabsContent>
      </Tabs>

      {!activeGroup && familyGroups && familyGroups.length === 0 && !showCreateGroupForm && (
        <div className="text-center py-8 text-gray-500">
          Bạn chưa thuộc bất kỳ nhóm gia đình nào. Hãy tạo một nhóm mới!
        </div>
      )}
    </div>
  );
};

export default Family;