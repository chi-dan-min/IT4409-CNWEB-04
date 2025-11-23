// src/models/FoodItem.js
const mongoose = require('mongoose');

const foodItemSchema = mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    storageLocation: {
      type: String, // vd: tủ lạnh, tủ đông, kệ bếp
      required: true,
    },
    category: {
      type: String, // vd: rau củ, thịt cá
    },
    isExpired: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const FoodItem = mongoose.model('FoodItem', foodItemSchema);
module.exports = FoodItem;