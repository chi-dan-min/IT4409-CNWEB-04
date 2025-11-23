const mongoose = require('mongoose');

const shoppingListItemSchema = mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  unit: { type: String, default: '' },
  category: { type: String },
  isPurchased: { type: Boolean, default: false },
});

const shoppingListSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['general', 'weekly', 'event', 'daily'], // <-- THÊM 'daily' VÀO ĐÂY
      default: 'general',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    items: [shoppingListItemSchema],
    familyGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FamilyGroup',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const ShoppingList = mongoose.model('ShoppingList', shoppingListSchema);

module.exports = ShoppingList;