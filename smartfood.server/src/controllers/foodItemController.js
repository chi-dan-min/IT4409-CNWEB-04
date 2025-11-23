const asyncHandler = require('express-async-handler'); // Sử dụng asyncHandler để xử lý lỗi bất đồng bộ
const FoodItem = require('../models/FoodItem');
const FamilyGroup = require('../models/FamilyGroup'); // Import FamilyGroup model

// Hàm trợ giúp để kiểm tra xem người dùng có phải là thành viên của một nhóm gia đình cụ thể không
const checkFamilyGroupMembership = (user, familyGroupId) => {
    // Kiểm tra xem user.memberOfFamilyGroups có tồn tại và là mảng không
    if (!user.memberOfFamilyGroups || !Array.isArray(user.memberOfFamilyGroups)) {
        return false;
    }
    // Tìm trong danh sách các nhóm mà người dùng là thành viên
    return user.memberOfFamilyGroups.some(group => group._id.toString() === familyGroupId.toString());
};


// @desc    Get all food items for the logged-in user or their family groups
// @route   GET /api/fooditems?familyGroupId=<ID>
// @access  Private
const getFoodItems = asyncHandler(async (req, res) => {
    const { familyGroupId } = req.query; // Nhận familyGroupId từ query parameter

    let query = {};

    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có phải là thành viên của nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to view items for this family group.');
        }
        // Lấy tất cả item thuộc về nhóm gia đình này
        query = { familyGroup: familyGroupId };
    } else {
        // Nếu không có familyGroupId, chỉ lấy các item cá nhân của người dùng (những item không thuộc nhóm nào)
        query = { user: req.user._id, familyGroup: null };
    }

    const foodItems = await FoodItem.find(query).sort({ expiryDate: 1 });
    res.status(200).json(foodItems);
});

// @desc    Add a new food item to the fridge (either personal or for a family group)
// @route   POST /api/fooditems
// @access  Private
const createFoodItem = asyncHandler(async (req, res) => {
    const { name, quantity, unit, expiryDate, storageLocation, category, familyGroupId } = req.body;

    // `expiryDate` giờ đây là tùy chọn trong FoodItem Model, nên bỏ `required` ở đây.
    if (!name || !quantity || !unit || !storageLocation) {
        res.status(400);
        throw new Error('Please enter all required fields: name, quantity, unit, storageLocation.');
    }

    let targetFamilyGroup = null;
    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có quyền thêm vào nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to add items to this family group.');
        }
        targetFamilyGroup = familyGroupId;
    }

    const foodItem = new FoodItem({
        user: req.user._id, // Người tạo item
        name,
        quantity,
        unit,
        expiryDate, // Trường này giờ là optional
        storageLocation,
        category,
        familyGroup: targetFamilyGroup, // Gán cho nhóm gia đình nếu có
    });

    const createdFoodItem = await foodItem.save();
    res.status(201).json(createdFoodItem);
});

// @desc    Update a food item
// @route   PUT /api/fooditems/:id
// @access  Private
const updateFoodItem = asyncHandler(async (req, res) => {
    const { name, quantity, unit, expiryDate, storageLocation, category, isExpired, familyGroupId } = req.body;

    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
        res.status(404);
        throw new Error('Food item not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của item cá nhân,
    // hoặc là thành viên của nhóm sở hữu item được chia sẻ.
    const isOwner = foodItem.user.toString() === req.user._id.toString();
    const isFamilyMember = foodItem.familyGroup && checkFamilyGroupMembership(req.user, foodItem.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to update this food item.');
    }

    // Xử lý việc chuyển item giữa các nhóm hoặc từ cá nhân sang nhóm
    let updatedFamilyGroup = foodItem.familyGroup;
    if (familyGroupId !== undefined && familyGroupId !== (foodItem.familyGroup ? foodItem.familyGroup.toString() : null)) {
        if (familyGroupId === null) { // Chuyển từ nhóm thành cá nhân
            // Chỉ owner hoặc admin của nhóm mới có thể làm điều này
            const group = req.user.memberOfFamilyGroups.find(g => g._id.toString() === foodItem.familyGroup?.toString());
            if (!group || group.members.find(m => m.user.toString() === req.user._id.toString())?.role !== 'admin') {
                res.status(403);
                throw new Error('Only a group administrator can move shared items to personal items.');
            }
            updatedFamilyGroup = null;
        } else { // Chuyển từ cá nhân sang nhóm khác, hoặc giữa 2 nhóm
            if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
                res.status(403);
                throw new Error('Not authorized to move this item to the specified family group.');
            }
            updatedFamilyGroup = familyGroupId;
        }
    }

    foodItem.name = name !== undefined ? name : foodItem.name;
    foodItem.quantity = quantity !== undefined ? quantity : foodItem.quantity;
    foodItem.unit = unit !== undefined ? unit : foodItem.unit;
    foodItem.expiryDate = expiryDate !== undefined ? expiryDate : foodItem.expiryDate;
    foodItem.storageLocation = storageLocation !== undefined ? storageLocation : foodItem.storageLocation;
    foodItem.category = category !== undefined ? category : foodItem.category;
    foodItem.isExpired = isExpired !== undefined ? isExpired : foodItem.isExpired;
    foodItem.familyGroup = updatedFamilyGroup; // Cập nhật trường familyGroup

    const updatedFoodItem = await foodItem.save();
    res.status(200).json(updatedFoodItem);
});

// @desc    Delete a food item
// @route   DELETE /api/fooditems/:id
// @access  Private
const deleteFoodItem = asyncHandler(async (req, res) => {
    const foodItem = await FoodItem.findById(req.params.id);

    if (!foodItem) {
        res.status(404);
        throw new Error('Food item not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của item cá nhân,
    // hoặc là thành viên của nhóm sở hữu item được chia sẻ.
    const isOwner = foodItem.user.toString() === req.user._id.toString();
    const isFamilyMember = foodItem.familyGroup && checkFamilyGroupMembership(req.user, foodItem.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to delete this food item.');
    }

    await foodItem.deleteOne();
    res.status(200).json({ message: 'Food item removed.' });
});

// @desc    Get food items about to expire (within 3 days) for the logged-in user or their family groups
// @route   GET /api/fooditems/expiring?familyGroupId=<ID>
// @access  Private
const getExpiringFoodItems = asyncHandler(async (req, res) => {
    const { familyGroupId } = req.query; // Nhận familyGroupId từ query parameter

    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

    let query = {
        expiryDate: { $lte: threeDaysFromNow, $gte: new Date() }, // Hết hạn trong 3 ngày tới hoặc đã hết hạn
        isExpired: false, // Chỉ những món chưa được đánh dấu là hết hạn
    };

    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có phải là thành viên của nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to view expiring items for this family group.');
        }
        query.familyGroup = familyGroupId;
    } else {
        // Nếu không có familyGroupId, chỉ lấy các item cá nhân của người dùng
        query.user = req.user._id;
        query.familyGroup = null; // Đảm bảo chỉ lấy item cá nhân
    }

    const expiringItems = await FoodItem.find(query).sort({ expiryDate: 1 });
    res.status(200).json(expiringItems);
});

module.exports = {
    getFoodItems,
    createFoodItem,
    updateFoodItem,
    deleteFoodItem,
    getExpiringFoodItems,
};