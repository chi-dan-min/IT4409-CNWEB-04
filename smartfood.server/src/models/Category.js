// src/models/Category.js
const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  type: {
    type: String, // 'food_type', 'unit', 'recipe_category'
    required: true,
  },
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;