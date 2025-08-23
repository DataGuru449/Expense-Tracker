require('dotenv').config();
const mongoose = require('mongoose');
const Expense = require('./models/Expense'); // ⬅️ same model

(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    await Expense.deleteMany({});
    await Expense.insertMany([
      { date: '2025-08-01', category: 'Groceries', merchant: 'Walmart',  paymentMethod: 'card',   amount: 54.99, notes: 'weekly shop' },
      { date: '2025-08-03', category: 'Entertainment', merchant: 'Netflix', paymentMethod: 'card',   amount: 15.99, notes: '' },
      { date: '2025-08-05', category: 'Travel', merchant: 'Uber',      paymentMethod: 'wallet', amount: 23.50, notes: 'airport' },
    ]);

    console.log('Seeded!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
