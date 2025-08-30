const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    category: { type: String, required: true },
    merchant: { type: String, required: true },
    paymentMethod: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    notes: { type: String, default: '' },
  },
  { timestamps: true }
);

// IMPORTANT: reuse if already compiled (prevents OverwriteModelError)
module.exports =
  mongoose.models.Expense || mongoose.model('Expense', expenseSchema);
