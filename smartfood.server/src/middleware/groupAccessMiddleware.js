// src/middleware/groupAccessMiddleware.js
const asyncHandler = require('express-async-handler');
const FamilyGroup = require('../models/FamilyGroup');

const authorizeGroupAccess = (Model) => asyncHandler(async (req, res, next) => {
  // Lấy ID của tài nguyên từ các params khác nhau (tùy thuộc vào cách bạn đặt tên trong route)
  const resourceId = req.params.id || req.params.shoppingListId || req.params.recipeId || req.params.mealPlanId;
  
  if (!resourceId) {
    res.status(400);
    throw new Error('Resource ID is missing in request parameters.');
  }

  const resource = await Model.findById(resourceId);

  if (!resource) {
    res.status(404);
    throw new Error(`${Model.modelName} not found.`);
  }

  // Nếu tài nguyên không thuộc nhóm gia đình nào (familyGroup là null)
  if (!resource.familyGroup) {
    // Chỉ người tạo tài nguyên mới có thể truy cập
    if (!resource.user || resource.user.toString() !== req.user._id.toString()) {
      res.status(403); // Forbidden
      throw new Error(`Not authorized to access this personal ${Model.modelName}.`);
    }
    req.resource = resource; // Đính kèm tài nguyên vào request
    return next();
  }

  // Nếu tài nguyên thuộc một nhóm gia đình, kiểm tra xem người dùng có phải là thành viên của nhóm đó không
  const familyGroup = await FamilyGroup.findById(resource.familyGroup);

  if (!familyGroup) {
    res.status(404);
    throw new Error('Associated family group not found or has been deleted.');
  }

  const isMember = familyGroup.members.some(
    member => member.user.toString() === req.user._id.toString()
  );

  if (!isMember) {
    res.status(403); // Forbidden
    throw new Error(`Not authorized. You are not a member of the family group associated with this ${Model.modelName}.`);
  }

  // Nếu người dùng là thành viên của nhóm, cho phép truy cập
  req.resource = resource; // Đính kèm tài nguyên vào request để sử dụng ở controller
  req.familyGroup = familyGroup; // Đính kèm nhóm gia đình vào request
  next();
});

const authorizeGroupAdmin = asyncHandler(async (req, res, next) => {
    // Middleware này nên được gọi SAU authorizeGroupAccess
    // vì nó dựa vào req.familyGroup đã được thiết lập.
    if (!req.familyGroup) {
        res.status(400);
        throw new Error('Family group not found on request. Ensure authorizeGroupAccess runs first.');
    }

    const member = req.familyGroup.members.find(
        m => m.user.toString() === req.user._id.toString()
    );

    if (!member || member.role !== 'admin') {
        res.status(403);
        throw new Error('Not authorized. Only group admins can perform this action.');
    }
    next();
});

module.exports = { authorizeGroupAccess, authorizeGroupAdmin };