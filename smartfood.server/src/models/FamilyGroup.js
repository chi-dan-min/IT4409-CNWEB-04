const mongoose = require('mongoose');

const familyGroupSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true, // Đảm bảo tên nhóm là duy nhất
    },
    // Danh sách các thành viên trong nhóm
    members: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        role: {
          type: String,
          enum: ['admin', 'member'], // 'admin' có quyền quản lý nhóm, 'member' chỉ là thành viên
          default: 'member',
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Người tạo/chủ sở hữu ban đầu của nhóm (thường là admin đầu tiên)
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    }
  },
  {
    timestamps: true,
  }
);

// Middleware pre-save để đảm bảo người tạo là thành viên admin đầu tiên
familyGroupSchema.pre('save', function (next) {
    if (this.isNew && this.members.length === 0) {
        this.members.push({ user: this.owner, role: 'admin' });
    }
    next();
});


const FamilyGroup = mongoose.model('FamilyGroup', familyGroupSchema);

module.exports = FamilyGroup;