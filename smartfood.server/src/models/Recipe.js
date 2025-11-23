// src/models/Recipe.js
const mongoose = require('mongoose');

const recipeSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    ingredients: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true },
        unit: { type: String, required: true },
      },
    ],
    instructions: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      default: 'Món chính'
    },
    cookTime: {
      type: String,
      required: true,
    },
    servings: {
      type: Number,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Dễ', 'Trung bình', 'Khó'],
      default: 'Trung bình'
    },
    image: {
      type: String,
      default: '🍽️'
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  {
    timestamps: true,
  }
);

const Recipe = mongoose.model('Recipe', recipeSchema);
module.exports = Recipe;