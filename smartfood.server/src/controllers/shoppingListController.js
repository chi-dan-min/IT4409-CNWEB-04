const asyncHandler = require('express-async-handler');
const ShoppingList = require('../models/ShoppingList');
const FoodItem = require('../models/FoodItem'); // Để tự động cập nhật vào tủ lạnh
const FamilyGroup = require('../models/FamilyGroup'); // Import FamilyGroup model

// Hàm trợ giúp để kiểm tra xem người dùng có phải là thành viên của một nhóm gia đình cụ thể không
const checkFamilyGroupMembership = (user, familyGroupId) => {
    if (!user.memberOfFamilyGroups || !Array.isArray(user.memberOfFamilyGroups)) {
        return false;
    }
    return user.memberOfFamilyGroups.some(group => group._id.toString() === familyGroupId.toString());
};


// @desc    Get all shopping lists for the logged-in user or their family groups
// @route   GET /api/shoppinglists?familyGroupId=<ID>
// @access  Private
const getShoppingLists = asyncHandler(async (req, res) => {
    const { familyGroupId } = req.query; // Nhận familyGroupId từ query parameter

    let query = {};

    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có phải là thành viên của nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to view lists for this family group.');
        }
        // Lấy tất cả danh sách thuộc về nhóm gia đình này
        query = { familyGroup: familyGroupId };
    } else {
        // Nếu không có familyGroupId, chỉ lấy các danh sách cá nhân của người dùng
        query = { user: req.user._id, familyGroup: null };
    }

    const shoppingLists = await ShoppingList.find(query).sort({ createdAt: -1 });
    res.status(200).json(shoppingLists);
});

// @desc    Create a new shopping list (either personal or for a family group)
// @route   POST /api/shoppinglists
// @access  Private
const createShoppingList = asyncHandler(async (req, res) => {
    const { name, type, items, familyGroupId } = req.body; // sharedWith đã được thay thế bằng familyGroup

    if (!name || !items) {
        res.status(400);
        throw new Error('Please enter all required fields: name, items.');
    }

    let targetFamilyGroup = null;
    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có quyền tạo trong nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to create lists for this family group.');
        }
        targetFamilyGroup = familyGroupId;
    }

    const shoppingList = new ShoppingList({
        user: req.user._id, // Người tạo danh sách
        name,
        type,
        items,
        familyGroup: targetFamilyGroup, // Gán cho nhóm gia đình nếu có
    });

    const createdList = await shoppingList.save();
    res.status(201).json(createdList);
});

// @desc    Update a shopping list (add/remove items, update status, etc.)
// @route   PUT /api/shoppinglists/:id
// @access  Private
const updateShoppingList = asyncHandler(async (req, res) => {
    const { name, type, items, familyGroupId } = req.body; // sharedWith đã được thay thế bằng familyGroup

    const shoppingList = await ShoppingList.findById(req.params.id);

    if (!shoppingList) {
        res.status(404);
        throw new Error('Shopping list not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của danh sách cá nhân,
    // hoặc là thành viên của nhóm sở hữu danh sách được chia sẻ.
    const isOwner = shoppingList.user.toString() === req.user._id.toString();
    const isFamilyMember = shoppingList.familyGroup && checkFamilyGroupMembership(req.user, shoppingList.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to update this list.');
    }

    // Xử lý việc chuyển danh sách giữa các nhóm hoặc từ cá nhân sang nhóm
    let updatedFamilyGroup = shoppingList.familyGroup;
    if (familyGroupId !== undefined && familyGroupId !== (shoppingList.familyGroup ? shoppingList.familyGroup.toString() : null)) {
        if (familyGroupId === null) { // Chuyển từ nhóm thành cá nhân
            const group = req.user.memberOfFamilyGroups.find(g => g._id.toString() === shoppingList.familyGroup?.toString());
            if (!group || group.members.find(m => m.user.toString() === req.user._id.toString())?.role !== 'admin') {
                res.status(403);
                throw new Error('Only a group administrator can move shared lists to personal lists.');
            }
            updatedFamilyGroup = null;
        } else { // Chuyển từ cá nhân sang nhóm khác, hoặc giữa 2 nhóm
            if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
                res.status(403);
                throw new Error('Not authorized to move this list to the specified family group.');
            }
            updatedFamilyGroup = familyGroupId;
        }
    }


    const oldItems = shoppingList.items; // Lưu lại các mặt hàng cũ để so sánh
    shoppingList.name = name ?? shoppingList.name;
    shoppingList.type = type ?? shoppingList.type;
    shoppingList.items = items ?? shoppingList.items;
    shoppingList.familyGroup = updatedFamilyGroup; // Cập nhật trường familyGroup

    const updatedList = await shoppingList.save();

    // Tự động thêm các mặt hàng đã mua vào tủ lạnh (FoodItem)
    // Chỉ xử lý các mặt hàng mới được đánh dấu là purchased
    for (const newItem of updatedList.items) {
        const oldItem = oldItems.find(item => item._id.toString() === newItem._id.toString());
        // Nếu mặt hàng mới được đánh dấu là đã mua và trước đó chưa được mua
        if (newItem.isPurchased && (!oldItem || !oldItem.isPurchased)) {
            // Kiểm tra xem mặt hàng đã tồn tại trong tủ lạnh của người dùng/nhóm chưa
            // Nếu shopping list thuộc về một nhóm, food item cũng sẽ thuộc về nhóm đó
            const foodItemQuery = {
                name: newItem.name,
                unit: newItem.unit,
            };
            if (updatedList.familyGroup) {
                foodItemQuery.familyGroup = updatedList.familyGroup;
            } else {
                foodItemQuery.user = req.user._id;
                foodItemQuery.familyGroup = null; // Đảm bảo chỉ tìm item cá nhân
            }

            const existingFoodItem = await FoodItem.findOne(foodItemQuery);

            if (existingFoodItem) {
                // Nếu có, cập nhật số lượng
                existingFoodItem.quantity += newItem.quantity;
                await existingFoodItem.save();
            } else {
                // Nếu chưa, tạo mới (cần có expiryDate và storageLocation)
                // Đây là một giả định đơn giản, trong thực tế cần input từ người dùng
                await FoodItem.create({
                    user: req.user._id, // Người đã mua item này
                    name: newItem.name,
                    quantity: newItem.quantity,
                    unit: newItem.unit,
                    expiryDate: new Date(new Date().setDate(new Date().getDate() + 7)), // Giả định 7 ngày hết hạn
                    storageLocation: 'Fridge', // Giả định
                    category: newItem.category,
                    familyGroup: updatedList.familyGroup, // Gán cho nhóm gia đình nếu có
                });
            }
        }
    }

    res.status(200).json(updatedList);
});

// @desc    Delete a shopping list
// @route   DELETE /api/shoppinglists/:id
// @access  Private
const deleteShoppingList = asyncHandler(async (req, res) => {
    const shoppingList = await ShoppingList.findById(req.params.id);

    if (!shoppingList) {
        res.status(404);
        throw new Error('Shopping list not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của danh sách cá nhân,
    // hoặc là thành viên của nhóm sở hữu danh sách được chia sẻ.
    const isOwner = shoppingList.user.toString() === req.user._id.toString();
    const isFamilyMember = shoppingList.familyGroup && checkFamilyGroupMembership(req.user, shoppingList.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to delete this list.');
    }

    await shoppingList.deleteOne();
    res.status(200).json({ message: 'Shopping list removed.' });
});



const submitShare = asyncHandler(async (req, res) => {
    const { shoppingListId, familyGroupId } = req.body;

    if (!shoppingListId || !familyGroupId) {
        res.status(400);
        throw new Error('Please provide shoppingListId and familyGroupId.');
    }

    const shoppingList = await ShoppingList.findById(shoppingListId);

    if (!shoppingList) {
        res.status(404);
        throw new Error('Shopping list not found.');
    }

    // Kiểm tra quyền:
    // 1. Nếu danh sách là cá nhân (familyGroup: null), người dùng phải là chủ sở hữu của danh sách đó.
    // 2. Nếu danh sách đã thuộc về một nhóm, người dùng phải là admin của nhóm đó.
    // 3. Người dùng phải là thành viên của nhóm đích (familyGroupId).

    const isOwner = shoppingList.user.toString() === req.user._id.toString();
    const currentGroupMemberInfo = shoppingList.familyGroup
        ? req.user.memberOfFamilyGroups.find(g => g._id.toString() === shoppingList.familyGroup.toString())
        : null;

    if (!isOwner && (!currentGroupMemberInfo || currentGroupMemberInfo.role !== 'admin')) {
        res.status(403);
        throw new Error('Not authorized to share this list. Only the list owner or current group admin can share/move it.');
    }

    // Kiểm tra xem người dùng có phải là thành viên của nhóm đích không
    const targetGroupMemberInfo = req.user.memberOfFamilyGroups.find(g => g._id.toString() === familyGroupId.toString());
    if (!targetGroupMemberInfo) {
        res.status(403);
        throw new Error('You are not a member of the target family group.');
    }

    // Kiểm tra xem nhóm đích có tồn tại không
    const targetFamilyGroup = await FamilyGroup.findById(familyGroupId);
    if (!targetFamilyGroup) {
        res.status(404);
        throw new Error('Target family group not found.');
    }

    // Cập nhật trường familyGroup
    shoppingList.familyGroup = familyGroupId;
    const updatedList = await shoppingList.save();

    res.status(200).json({
        message: 'Shopping list successfully assigned to the family group.',
        updatedList,
    });
});


module.exports = {
    getShoppingLists,
    createShoppingList,
    updateShoppingList,
    deleteShoppingList,
    submitShare
};