const asyncHandler = require('express-async-handler');
const FamilyGroup = require('../models/FamilyGroup');
const User = require('../models/User');
// const sendEmail = require('../utils/sendEmail'); // Bỏ comment nếu muốn sử dụng chức năng gửi email
// const path = require('path'); // Bỏ comment nếu muốn sử dụng chức năng gửi email
// const fs = require('fs'); // Bỏ comment nếu muốn sử dụng chức năng gửi email

// @desc    Create a new family group
// @route   POST /api/family-groups
// @access  Private
const createFamilyGroup = asyncHandler(async (req, res) => {
  const { name } = req.body;

  if (!name) {
    res.status(400);
    throw new Error('Please provide a name for the family group.');
  }

  // Kiểm tra xem người dùng đã là thành viên của nhóm có tên này chưa
  const existingGroup = await FamilyGroup.findOne({ name, 'members.user': req.user._id });
  if (existingGroup) {
      res.status(400);
      throw new Error(`You are already a member of a group named "${name}".`);
  }

  const familyGroup = new FamilyGroup({
    name,
    owner: req.user._id, // Người tạo sẽ là chủ sở hữu ban đầu
  });

  // Middleware pre-save trong FamilyGroup model sẽ tự động thêm người tạo làm thành viên với vai trò admin đầu tiên
  const createdFamilyGroup = await familyGroup.save();

  res.status(201).json({
    message: 'Family group created successfully!',
    familyGroup: createdFamilyGroup,
  });
});

// @desc    Get all family groups the logged-in user belongs to
// @route   GET /api/family-groups
// @access  Private
const getFamilyGroups = asyncHandler(async (req, res) => {
  // Tìm tất cả các nhóm mà người dùng hiện tại là thành viên
  const familyGroups = await FamilyGroup.find({ 'members.user': req.user._id })
    .populate('members.user', 'name email') // Populate thông tin người dùng trong các thành viên (chỉ tên và email)
    .select('-__v'); // Bỏ qua trường __v

  // Định dạng lại dữ liệu để dễ dàng sử dụng ở frontend, bao gồm vai trò của người dùng hiện tại trong từng nhóm
  const formattedGroups = familyGroups.map(group => {
    const currentUserMember = group.members.find(m => m.user._id.toString() === req.user._id.toString());
    return {
      _id: group._id,
      name: group.name,
      owner: group.owner,
      members: group.members.map(member => ({
        user: {
            _id: member.user._id,
            name: member.user.name,
            email: member.user.email,
            // Tạo avatar fallback cho frontend (ví dụ: chữ cái đầu của tên)
            avatar: member.user.name ? member.user.name.split(' ').map(n => n[0]).join('').toUpperCase() : '',
        },
        role: member.role,
        joinedAt: member.joinedAt,
      })),
      currentUserRole: currentUserMember ? currentUserMember.role : 'none', // Vai trò của người dùng hiện tại trong nhóm này
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  });

  res.status(200).json(formattedGroups);
});

// @desc    Invite a new member to a family group (direct add, no email confirmation)
// @route   POST /api/family-groups/:id/invite
// @access  Private (Admin only)
const inviteMember = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const groupId = req.params.id;

  if (!email) {
    res.status(400);
    throw new Error('Please provide an email to invite.');
  }

  const familyGroup = await FamilyGroup.findById(groupId).populate('members.user', 'email');

  if (!familyGroup) {
    res.status(404);
    throw new Error('Family group not found.');
  }

  const currentUserMember = familyGroup.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    res.status(403);
    throw new Error('Only administrators can invite new members to this group.');
  }

  const invitedUser = await User.findOne({ email });

  if (!invitedUser) {
    res.status(404);
    throw new Error('User with this email does not exist. Please ask them to register first.');
  }

  const alreadyMember = familyGroup.members.some(
    (member) => member.user._id.toString() === invitedUser._id.toString()
  );
  if (alreadyMember) {
    res.status(400);
    throw new Error('This user is already a member of this family group.');
  }

  // Thêm người dùng vào nhóm ngay lập tức
  familyGroup.members.push({ user: invitedUser._id, role: 'member' });
  await familyGroup.save();

  // --- Bắt đầu phần có thể xóa hoặc bỏ comment nếu không muốn gửi email ---
  /*
  try {
    const emailTemplatePath = path.join(__dirname, '../utils/emailTemplates/memberAdded.html');
    let emailContent = fs.readFileSync(emailTemplatePath, 'utf8');
    emailContent = emailContent.replace('{{userName}}', invitedUser.name || 'bạn');
    emailContent = emailContent.replace('{{inviterName}}', req.user.name);
    emailContent = emailContent.replace('{{groupName}}', familyGroup.name);
    emailContent = emailContent.replace('{{appLink}}', process.env.FRONTEND_URL || 'http://localhost:3000');

    await sendEmail({
      to: email,
      subject: `Bạn đã được thêm vào nhóm gia đình "${familyGroup.name}"!`,
      html: emailContent,
    });
    res.status(200).json({ message: `User ${invitedUser.name} added to group and notification email sent.` });
  } catch (error) {
    console.error(`Error sending email to ${email}:`, error);
    res.status(200).json({ message: `User ${invitedUser.name} added to group, but email notification failed.` });
  }
  */
  // --- Kết thúc phần có thể xóa hoặc bỏ comment ---

  // Nếu bạn không gửi email, response sẽ đơn giản là xác nhận thêm thành công
  res.status(200).json({ message: `User ${invitedUser.name} added to group successfully.` });
});


// @desc    Remove a member from a family group
// @route   DELETE /api/family-groups/:groupId/members/:memberId
// @access  Private (Admin only)
const removeMember = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;

  const familyGroup = await FamilyGroup.findById(groupId);

  if (!familyGroup) {
    res.status(404);
    throw new Error('Family group not found.');
  }

  // Kiểm tra quyền: Chỉ admin mới được xóa thành viên
  const currentUserMember = familyGroup.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    res.status(403);
    throw new Error('Only administrators can remove members from this group.');
  }

  // Không cho phép admin tự xóa chính mình nếu đó là admin duy nhất của nhóm
  const memberToRemove = familyGroup.members.find(
    (member) => member.user._id.toString() === memberId
  );

  if (!memberToRemove) {
    res.status(404);
    throw new Error('Member not found in this group.');
  }

  if (memberToRemove.role === 'admin') {
    const adminCount = familyGroup.members.filter(m => m.role === 'admin').length;
    if (adminCount === 1 && memberToRemove.user._id.toString() === req.user._id.toString()) {
      res.status(400);
      throw new Error('Cannot remove yourself if you are the last administrator of the group. Please assign another admin first or delete the group.');
    }
  }

  // Xóa thành viên khỏi mảng members
  familyGroup.members = familyGroup.members.filter(
    (member) => member.user._id.toString() !== memberId
  );

  await familyGroup.save();

  res.status(200).json({ message: 'Member removed successfully.' });
});

// @desc    Update a member's role in a family group
// @route   PUT /api/family-groups/:groupId/members/:memberId
// @access  Private (Admin only)
const updateMemberRole = asyncHandler(async (req, res) => {
  const { groupId, memberId } = req.params;
  const { role } = req.body;

  if (!role || !['admin', 'member'].includes(role)) {
    res.status(400);
    throw new Error('Invalid role specified. Role must be "admin" or "member".');
  }

  const familyGroup = await FamilyGroup.findById(groupId);

  if (!familyGroup) {
    res.status(404);
    throw new Error('Family group not found.');
  }

  // Kiểm tra quyền: Chỉ admin mới được thay đổi vai trò
  const currentUserMember = familyGroup.members.find(
    (member) => member.user._id.toString() === req.user._id.toString()
  );

  if (!currentUserMember || currentUserMember.role !== 'admin') {
    res.status(403);
    throw new Error('Only administrators can change member roles.');
  }

  // Tìm thành viên để cập nhật
  const memberToUpdate = familyGroup.members.find(
    (member) => member.user._id.toString() === memberId
  );

  if (!memberToUpdate) {
    res.status(404);
    throw new Error('Member not found in this group.');
  }

  // Không cho phép admin hạ cấp chính mình nếu đó là admin duy nhất
  if (memberToUpdate.user._id.toString() === req.user._id.toString() && role === 'member') {
      const adminCount = familyGroup.members.filter(m => m.role === 'admin').length;
      if (adminCount === 1) {
          res.status(400);
          throw new Error('Cannot demote yourself if you are the last administrator of the group.');
      }
  }

  memberToUpdate.role = role; // Cập nhật vai trò
  await familyGroup.save();

  res.status(200).json({ message: 'Member role updated successfully!', member: memberToUpdate });
});


module.exports = {
  createFamilyGroup,
  getFamilyGroups,
  inviteMember,
  removeMember,
  updateMemberRole,
};