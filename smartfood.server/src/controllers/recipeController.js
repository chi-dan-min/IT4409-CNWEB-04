const asyncHandler = require('express-async-handler');
const Recipe = require('../models/Recipe');
const FoodItem = require('../models/FoodItem');

// @desc    Get all recipes with search and filter
// @route   GET /api/recipes?search=&difficulty=
// @access  Private
const getRecipes = asyncHandler(async (req, res) => {
    const { search, difficulty } = req.query;
    let query = {};

    // Search filter
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
        ];
    }

    // Difficulty filter
    if (difficulty && difficulty !== 'all') {
        query.difficulty = difficulty;
    }

    const recipes = await Recipe.find(query)
        .populate('user', 'username')
        .sort({ createdAt: -1 });
    
    res.status(200).json(recipes);
});

// @desc    Get a single recipe by ID
// @route   GET /api/recipes/:id
// @access  Private
const getRecipeById = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id)
        .populate('user', 'username');

    if (!recipe) {
        res.status(404);
        throw new Error('Recipe not found');
    }

    res.status(200).json(recipe);
});

// @desc    Create a new recipe
// @route   POST /api/recipes
// @access  Private
const createRecipe = asyncHandler(async (req, res) => {
    const { 
        name, 
        description, 
        ingredients, 
        instructions, 
        category, 
        cookTime, 
        servings, 
        difficulty, 
        image
    } = req.body;

    if (!name || !description || !ingredients || !instructions || !cookTime || !servings) {
        res.status(400);
        throw new Error('Vui lòng điền đầy đủ thông tin bắt buộc');
    }

    const recipe = new Recipe({
        user: req.user._id,
        name,
        description,
        ingredients,
        instructions,
        category: category || 'Món chính',
        cookTime,
        servings,
        difficulty: difficulty || 'Trung bình',
        image: image || '🍽️',
    });

    const createdRecipe = await recipe.save();
    const populatedRecipe = await Recipe.findById(createdRecipe._id)
        .populate('user', 'username');

    res.status(201).json(populatedRecipe);
});

// @desc    Update recipe
// @route   PUT /api/recipes/:id
// @access  Private
const updateRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
        res.status(404);
        throw new Error('Không tìm thấy công thức');
    }

    // Chỉ cho phép chủ sở hữu sửa
    if (recipe.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bạn không có quyền sửa công thức này');
    }

    const updatedRecipe = await Recipe.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true }
    ).populate('user', 'username');

    res.status(200).json(updatedRecipe);
});

// @desc    Delete recipe
// @route   DELETE /api/recipes/:id
// @access  Private
const deleteRecipe = asyncHandler(async (req, res) => {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
        res.status(404);
        throw new Error('Không tìm thấy công thức');
    }

    // Chỉ cho phép chủ sở hữu xóa
    if (recipe.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Bạn không có quyền xóa công thức này');
    }

    await recipe.deleteOne();
    res.status(200).json({ message: 'Đã xóa công thức thành công' });
});

// @desc    Get suggested recipes based on available ingredients
// @route   GET /api/recipes/suggest
// @access  Private
const suggestRecipes = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Lấy ingredients có sẵn của user
    const userFoodItems = await FoodItem.find({
        user: userId,
        quantity: { $gt: 0 }
    });

    // Lấy tất cả recipes
    const allRecipes = await Recipe.find({})
        .populate('user', 'username');

    const suggestedRecipes = [];

    for (const recipe of allRecipes) {
        const availableIngredients = [];
        const missingIngredients = [];

        for (const ingredient of recipe.ingredients) {
            const foundFoodItem = userFoodItems.find(
                (food) => food.name.toLowerCase() === ingredient.name.toLowerCase()
            );

            if (foundFoodItem) {
                availableIngredients.push(ingredient.name);
            } else {
                missingIngredients.push(ingredient.name);
            }
        }

        // Format theo yêu cầu của FE
        const recipeWithStatus = {
            ...recipe.toObject(),
            availableIngredients,
            missingIngredients
        };

        suggestedRecipes.push(recipeWithStatus);
    }

    // Sắp xếp theo số ingredients có sẵn
    suggestedRecipes.sort((a, b) => {
        return b.availableIngredients.length - a.availableIngredients.length;
    });

    res.status(200).json(suggestedRecipes);
});

module.exports = {
    getRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    suggestRecipes,
};