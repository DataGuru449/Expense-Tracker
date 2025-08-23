// backend/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const Expense = require('./models/Expense'); // shared model file
const Budget = require('./models/budget');   // new model

const app = express();
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5174'] }));
app.use(express.json());

const { MONGODB_URI, PORT = 5000 } = process.env;

mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ------- Expenses -------

// List expenses (optional month filter: YYYY-MM)
app.get('/api/expenses', async (req, res) => {
  try {
    const { month } = req.query;
    const query = {};
    if (month) {
      const start = new Date(`${month}-01T00:00:00.000Z`);
      const end = new Date(start);
      end.setMonth(end.getMonth() + 1);
      query.date = { $gte: start, $lt: end };
    }
    const items = await Expense.find(query).sort({ date: -1 }).lean();
    res.json(items);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Create expense
app.post('/api/expenses', async (req, res) => {
  try {
    const { date, category, merchant, paymentMethod, amount, notes } = req.body;
    const item = await Expense.create({
      date: new Date(date),
      category, merchant, paymentMethod,
      amount: Number(amount),
      notes: notes || ''
    });
    res.status(201).json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Update expense (NEW)
app.put('/api/expenses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    if (body.date) body.date = new Date(body.date);
    if (body.amount != null) body.amount = Number(body.amount);
    const updated = await Expense.findByIdAndUpdate(id, body, { new: true });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Delete expense
app.delete('/api/expenses/:id', async (req, res) => {
  try {
    await Expense.findByIdAndDelete(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// ------- Monthly Budget (NEW) -------

// Get budget for a month: /api/budget?month=YYYY-MM
app.get('/api/budget', async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ error: "month (YYYY-MM) is required" });
    const doc = await Budget.findOne({ month }).lean();
    res.json(doc || { month, amount: 0 });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Upsert budget for a month
app.post('/api/budget', async (req, res) => {
  try {
    const { month, amount } = req.body;
    if (!month) return res.status(400).json({ error: "month (YYYY-MM) is required" });
    const updated = await Budget.findOneAndUpdate(
      { month },
      { month, amount: Number(amount || 0) },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
