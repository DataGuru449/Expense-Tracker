// backend/models/Budget.js
const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema(
  {
    month: { type: String, required: true }, // 'YYYY-MM'
    amount: { type: Number, required: true, min: 0 }
  },
  { timestamps: true }
);

budgetSchema.index({ month: 1 }, { unique: true });

module.exports =
  mongoose.models.Budget || mongoose.model('Budget', budgetSchema);
