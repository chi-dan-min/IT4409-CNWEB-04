const asyncHandler = require('express-async-handler');
const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const FoodItem = require('../models/FoodItem');
const ShoppingList = require('../models/ShoppingList');
const FamilyGroup = require('../models/FamilyGroup'); // Đảm bảo đã import FamilyGroup model

// Hàm trợ giúp để kiểm tra xem người dùng có phải là thành viên của một nhóm gia đình cụ thể không
// Hàm này giả định req.user có trường memberOfFamilyGroups là một mảng các đối tượng nhóm gia đình
// Hoặc ít nhất là một mảng các ID nhóm mà người dùng thuộc về (tùy thuộc vào cách bạn populate trường này trong authMiddleware)
const checkFamilyGroupMembership = (user, familyGroupId) => {
    if (!user || !user.memberOfFamilyGroups || !Array.isArray(user.memberOfFamilyGroups)) {
        return false;
    }
    // Kiểm tra xem familyGroupId có nằm trong danh sách các nhóm mà người dùng là thành viên không
    // Cần đảm bảo familyGroupId là một String để so sánh với _id.toString()
    return user.memberOfFamilyGroups.some(group => group.toString() === familyGroupId.toString());
};

// Hàm trợ giúp để lấy query object cho FoodItem hoặc ShoppingList dựa trên familyGroup context
const getSharedQuery = (userId, familyGroupId) => {
    let query = {};
    if (familyGroupId) {
        query.familyGroup = familyGroupId;
    } else {
        query.user = userId;
        query.familyGroup = { $exists: false }; // Đảm bảo chỉ lấy item cá nhân, không thuộc nhóm nào
    }
    return query;
};

// @desc    Get all meal plans for the logged-in user or their family groups
// @route   GET /api/mealplans?familyGroupId=<ID>
// @access  Private
const getMealPlans = asyncHandler(async (req, res) => {
    const { familyGroupId } = req.query; // Nhận familyGroupId từ query parameter

    let query = {};

    if (familyGroupId) {
        // Nếu có familyGroupId, kiểm tra xem người dùng có phải là thành viên của nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to view meal plans for this family group.');
        }
        // Lấy tất cả kế hoạch bữa ăn thuộc về nhóm gia đình này
        query = { familyGroup: familyGroupId };
    } else {
        // Nếu không có familyGroupId, chỉ lấy các kế hoạch bữa ăn cá nhân của người dùng
        query = { user: req.user._id, familyGroup: { $exists: false } }; // Đảm bảo chỉ lấy kế hoạch cá nhân
    }

    // Populate trường 'recipe' trong mảng 'meals' để frontend có thể truy cập thông tin công thức
    // Sắp xếp theo ngày tạo mới nhất trước
    const mealPlans = await MealPlan.find(query)
        .populate('meals.recipe')
        .sort({ createdAt: -1 });

    res.status(200).json(mealPlans);
});

// @desc    Create a new meal plan (either personal or for a family group)
// @route   POST /api/mealplans
// @access  Private
const createMealPlan = asyncHandler(async (req, res) => {
    const { name, type, meals, autoCreateShoppingList, familyGroupId } = req.body;

    // meals có thể là rỗng khi tạo kế hoạch ban đầu (frontend có thể thêm sau)
    if (!name || !type) {
        res.status(400);
        throw new Error('Please provide all required meal plan details: name and type.');
    }

    let targetFamilyGroup = null;
    if (familyGroupId) {
        // Kiểm tra xem người dùng có quyền tạo trong nhóm đó không
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to create meal plans for this family group.');
        }
        targetFamilyGroup = familyGroupId;
    }

    const mealPlan = new MealPlan({
        user: req.user._id, // Người tạo kế hoạch
        name,
        type,
        // Đảm bảo meals là một mảng, ngay cả khi nó rỗng
        meals: meals || [], 
        familyGroup: targetFamilyGroup, // Gán cho nhóm gia đình nếu có
    });

    const createdMealPlan = await mealPlan.save();

    // Tự động tạo danh sách mua sắm nếu autoCreateShoppingList được bật và có nguyên liệu thiếu hụt
    if (autoCreateShoppingList) {
        // Truyền familyGroupId vào hàm getMissingIngredientsForMealPlan
        const missingIngredients = await getMissingIngredientsForMealPlan(req.user._id, createdMealPlan.meals, targetFamilyGroup);
        if (missingIngredients.length > 0) {
            const shoppingList = new ShoppingList({
                user: req.user._id, // Người tạo danh sách mua sắm
                name: `Shopping list for ${createdMealPlan.name}`,
                type: 'mealPlan', // Loại mới: liên quan đến kế hoạch bữa ăn
                items: missingIngredients.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    unit: item.unit,
                    category: item.category || 'General',
                    isPurchased: false,
                })),
                familyGroup: targetFamilyGroup, // Gán cho cùng nhóm gia đình với meal plan
            });
            await shoppingList.save();
            // Populate createdMealPlan để gửi về client với dữ liệu recipe đầy đủ
            const populatedMealPlan = await MealPlan.findById(createdMealPlan._id).populate('meals.recipe');
            res.status(201).json({ mealPlan: populatedMealPlan, message: 'Meal plan created and shopping list generated for missing ingredients.' });
        } else {
            const populatedMealPlan = await MealPlan.findById(createdMealPlan._id).populate('meals.recipe');
            res.status(201).json({ mealPlan: populatedMealPlan, message: 'Meal plan created. No missing ingredients.' });
        }
    } else {
        const populatedMealPlan = await MealPlan.findById(createdMealPlan._id).populate('meals.recipe');
        res.status(201).json(populatedMealPlan);
    }
});

// @desc    Add a meal entry to an existing meal plan
// @route   POST /api/mealplans/:mealPlanId/meals
// @access  Private
const addMealPlanEntry = asyncHandler(async (req, res) => {
    const { mealPlanId } = req.params;
    const { date, mealType, recipe, notes } = req.body;

    if (!date || !mealType || !recipe) {
        res.status(400);
        throw new Error('Please provide date, meal type, and recipe ID for the meal entry.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId);

    if (!mealPlan) {
        res.status(404);
        throw new Error('Meal plan not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu hoặc thành viên của nhóm
    const isOwner = mealPlan.user.toString() === req.user._id.toString();
    const isFamilyMember = mealPlan.familyGroup && checkFamilyGroupMembership(req.user, mealPlan.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to add meal entries to this meal plan.');
    }

    // Tạo một meal entry mới
    const newMealEntry = {
        date,
        mealType,
        recipe, // recipe sẽ là ID, Mongoose sẽ populate sau
        notes: notes || '',
    };

    mealPlan.meals.push(newMealEntry);
    const updatedMealPlan = await mealPlan.save();

    // Populate lại để gửi về client với thông tin recipe đầy đủ
    const populatedMealPlan = await MealPlan.findById(updatedMealPlan._id).populate('meals.recipe');
    res.status(200).json(populatedMealPlan);
});

// @desc    Update a meal entry in an existing meal plan
// @route   PUT /api/mealplans/:mealPlanId/meals/:mealEntryId
// @access  Private
const updateMealPlanEntry = asyncHandler(async (req, res) => {
    const { mealPlanId, mealEntryId } = req.params;
    const { date, mealType, recipe, notes } = req.body;

    if (!date || !mealType || !recipe) {
        res.status(400);
        throw new Error('Please provide date, meal type, and recipe ID for the meal entry.');
    }

    const mealPlan = await MealPlan.findById(mealPlanId);

    if (!mealPlan) {
        res.status(404);
        throw new Error('Meal plan not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu hoặc thành viên của nhóm
    const isOwner = mealPlan.user.toString() === req.user._id.toString();
    const isFamilyMember = mealPlan.familyGroup && checkFamilyGroupMembership(req.user, mealPlan.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to update meal entries in this meal plan.');
    }

    // Tìm và cập nhật meal entry
    const mealEntry = mealPlan.meals.id(mealEntryId); // Sử dụng .id() cho subdocument
    if (!mealEntry) {
        res.status(404);
        throw new Error('Meal entry not found within this meal plan.');
    }

    mealEntry.date = date;
    mealEntry.mealType = mealType;
    mealEntry.recipe = recipe;
    mealEntry.notes = notes || '';

    const updatedMealPlan = await mealPlan.save();

    // Populate lại để gửi về client với thông tin recipe đầy đủ
    const populatedMealPlan = await MealPlan.findById(updatedMealPlan._id).populate('meals.recipe');
    res.status(200).json(populatedMealPlan);
});

// @desc    Delete a meal entry from an existing meal plan
// @route   DELETE /api/mealplans/:mealPlanId/meals/:mealEntryId
// @access  Private
const deleteMealPlanEntry = asyncHandler(async (req, res) => {
    const { mealPlanId, mealEntryId } = req.params;

    const mealPlan = await MealPlan.findById(mealPlanId);

    if (!mealPlan) {
        res.status(404);
        throw new Error('Meal plan not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu hoặc thành viên của nhóm
    const isOwner = mealPlan.user.toString() === req.user._id.toString();
    const isFamilyMember = mealPlan.familyGroup && checkFamilyGroupMembership(req.user, mealPlan.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to delete meal entries from this meal plan.');
    }

    // Xóa meal entry khỏi mảng
    mealPlan.meals = mealPlan.meals.filter(
        (meal) => meal._id.toString() !== mealEntryId
    );

    const updatedMealPlan = await mealPlan.save();

    // Populate lại để gửi về client với thông tin recipe đầy đủ
    const populatedMealPlan = await MealPlan.findById(updatedMealPlan._id).populate('meals.recipe');
    res.status(200).json(populatedMealPlan);
});


// @desc    Update a meal plan (chỉ cập nhật thông tin chung, không phải thêm/sửa/xóa từng bữa ăn)
// @route   PUT /api/mealplans/:id
// @access  Private
const updateMealPlan = asyncHandler(async (req, res) => {
    const { name, type, familyGroupId } = req.body; // Không nhận meals trực tiếp ở đây nữa

    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
        res.status(404);
        throw new Error('Meal plan not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của kế hoạch cá nhân,
    // hoặc là thành viên của nhóm sở hữu kế hoạch được chia sẻ.
    const isOwner = mealPlan.user.toString() === req.user._id.toString();
    const isFamilyMember = mealPlan.familyGroup && checkFamilyGroupMembership(req.user, mealPlan.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to update this meal plan.');
    }

    // Xử lý việc chuyển kế hoạch giữa các nhóm hoặc từ cá nhân sang nhóm
    let updatedFamilyGroup = mealPlan.familyGroup;
    if (familyGroupId !== undefined) {
        // Kiểm tra nếu giá trị familyGroupId thay đổi
        const currentFamilyGroupId = mealPlan.familyGroup ? mealPlan.familyGroup.toString() : null;
        if (familyGroupId !== currentFamilyGroupId) {
            if (familyGroupId === null) { // Chuyển từ nhóm thành cá nhân
                // Người dùng phải là admin của nhóm cũ để chuyển kế hoạch nhóm thành cá nhân
                const familyGroupDoc = await FamilyGroup.findById(mealPlan.familyGroup);
                if (!familyGroupDoc || !familyGroupDoc.members.some(m => m.user.toString() === req.user._id.toString() && m.role === 'admin')) {
                    res.status(403);
                    throw new Error('Only a group administrator can move shared meal plans to personal plans.');
                }
                updatedFamilyGroup = null;
            } else { // Chuyển từ cá nhân sang nhóm khác, hoặc giữa 2 nhóm
                if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
                    res.status(403);
                    throw new Error('Not authorized to move this meal plan to the specified family group.');
                }
                updatedFamilyGroup = familyGroupId;
            }
        }
    }

    mealPlan.name = name ?? mealPlan.name;
    mealPlan.type = type ?? mealPlan.type;
    mealPlan.familyGroup = updatedFamilyGroup; // Cập nhật trường familyGroup

    const updatedMealPlan = await mealPlan.save();
    // Populate lại để gửi về client với thông tin recipe đầy đủ
    const populatedMealPlan = await MealPlan.findById(updatedMealPlan._id).populate('meals.recipe');
    res.status(200).json(populatedMealPlan);
});

// @desc    Delete a meal plan
// @route   DELETE /api/mealplans/:id
// @access  Private
const deleteMealPlan = asyncHandler(async (req, res) => {
    const mealPlan = await MealPlan.findById(req.params.id);

    if (!mealPlan) {
        res.status(404);
        throw new Error('Meal plan not found.');
    }

    // Kiểm tra quyền: Người dùng phải là chủ sở hữu của kế hoạch cá nhân,
    // hoặc là thành viên của nhóm sở hữu kế hoạch được chia sẻ.
    const isOwner = mealPlan.user.toString() === req.user._id.toString();
    const isFamilyMember = mealPlan.familyGroup && checkFamilyGroupMembership(req.user, mealPlan.familyGroup.toString());

    if (!isOwner && !isFamilyMember) {
        res.status(403);
        throw new Error('Not authorized to delete this meal plan.');
    }

    await mealPlan.deleteOne();
    res.status(200).json({ message: 'Meal plan removed.' });
});


// Helper function to get missing ingredients for a meal plan (now supports family groups)
const getMissingIngredientsForMealPlan = asyncHandler(async (userId, meals, familyGroupId = null) => {
    // Lấy FoodItems từ tủ lạnh cá nhân hoặc tủ lạnh của nhóm gia đình
    const foodItemQuery = getSharedQuery(userId, familyGroupId);

    const userFoodItems = await FoodItem.find({ ...foodItemQuery, quantity: { $gt: 0 } });
    const missingIngredients = {};

    for (const meal of meals) {
        const recipe = await Recipe.findById(meal.recipe); // recipe ở đây là ID
        if (recipe) {
            for (const ingredient of recipe.ingredients) {
                const foundFoodItem = userFoodItems.find(
                    (food) =>
                        food.name.toLowerCase() === ingredient.name.toLowerCase() &&
                        food.unit.toLowerCase() === ingredient.unit.toLowerCase() // So sánh unit không phân biệt chữ hoa, chữ thường
                );

                let neededQuantity = ingredient.quantity;
                if (foundFoodItem) {
                    neededQuantity = Math.max(0, ingredient.quantity - foundFoodItem.quantity);
                }

                if (neededQuantity > 0) {
                    const key = `${ingredient.name.toLowerCase()}-${ingredient.unit.toLowerCase()}`;
                    if (missingIngredients[key]) {
                        missingIngredients[key].quantity += neededQuantity;
                    } else {
                        missingIngredients[key] = {
                            name: ingredient.name,
                            quantity: neededQuantity,
                            unit: ingredient.unit,
                            category: ingredient.category || 'General',
                        };
                    }
                }
            }
        }
    }
    return Object.values(missingIngredients);
});

// @desc    Suggest meal plan based on fridge content (now supports family groups)
// @route   GET /api/mealplans/suggest?familyGroupId=<ID>
// @access  Private
const suggestMealPlan = asyncHandler(async (req, res) => {
    const { familyGroupId } = req.query;

    let foodItemQuery = {};
    let recipeQuery = {}; // Query cho Recipe

    if (familyGroupId) {
        if (!checkFamilyGroupMembership(req.user, familyGroupId)) {
            res.status(403);
            throw new Error('Not authorized to get meal plan suggestions for this family group.');
        }
        foodItemQuery = getSharedQuery(req.user._id, familyGroupId);
        // Lấy recipes cá nhân, của nhóm, hoặc public
        recipeQuery = { $or: [{ user: req.user._id }, { familyGroup: familyGroupId }, { familyGroup: { $exists: false }, user: { $exists: false } }] };
    } else {
        foodItemQuery = getSharedQuery(req.user._id, null);
        // Chỉ lấy Recipes cá nhân hoặc public khi không có familyGroupId
        recipeQuery = { $or: [{ user: req.user._id }, { familyGroup: { $exists: false }, user: { $exists: false } }] };
    }

    const userFoodItems = await FoodItem.find({ ...foodItemQuery, quantity: { $gt: 0 } });
    const allRecipes = await Recipe.find(recipeQuery); // Lọc recipes theo query

    const availableRecipes = [];
    for (const recipe of allRecipes) {
        let canMake = true;
        for (const ingredient of recipe.ingredients) {
            const found = userFoodItems.some(
                (food) =>
                    food.name.toLowerCase() === ingredient.name.toLowerCase() &&
                    food.quantity >= ingredient.quantity &&
                    food.unit.toLowerCase() === ingredient.unit.toLowerCase() // So sánh unit không phân biệt chữ hoa, chữ thường
            );
            if (!found) {
                canMake = false;
                break;
            }
        }
        if (canMake) {
            availableRecipes.push(recipe);
        }
    }

    // Simple suggestion: Pick some random recipes from available ones for a week
    const suggestedMeals = [];
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner']; // Đảm bảo khớp với enum trong MealPlan model (chữ hoa đầu)
    const today = new Date();

    for (let i = 0; i < 7; i++) { // For a week
        const currentDate = new Date(today);
        currentDate.setDate(today.getDate() + i);

        for (const mealType of mealTypes) {
            if (availableRecipes.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableRecipes.length);
                suggestedMeals.push({
                    date: currentDate.toISOString(), // Gửi dưới dạng ISO string
                    mealType: mealType,
                    recipe: availableRecipes[randomIndex]._id, // Chỉ gửi ID
                    notes: `Gợi ý cho ${mealType}`,
                });
            }
        }
    }

    res.status(200).json({ suggestedMeals, availableRecipes });
});

module.exports = {
    getMealPlans,
    createMealPlan,
    updateMealPlan,
    deleteMealPlan,
    addMealPlanEntry,       // Xuất các hàm mới
    updateMealPlanEntry,    // Xuất các hàm mới
    deleteMealPlanEntry,    // Xuất các hàm mới
    suggestMealPlan,
};