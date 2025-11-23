// src/models/MealPlan.js
const mongoose = require('mongoose');

const mealEntrySchema = mongoose.Schema({
  date: {
    type: Date,
    required: true,
  },
  mealType: {
    type: String, // e.g., 'Breakfast', 'Lunch', 'Dinner', 'Snack'
    required: true,
  },
  recipe: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Recipe',
    required: true,
  },
  notes: {
    type: String,
  },
});

const mealPlanSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['daily', 'weekly'],
      required: true,
    },
    meals: [mealEntrySchema],
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const MealPlan = mongoose.model('MealPlan', mealPlanSchema);
module.exports = MealPlan;