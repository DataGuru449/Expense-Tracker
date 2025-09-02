import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import "./index.css";

// ---- API base (env first, fallback to local) ----
const API_URL = (import.meta.env.VITE_API_URL || "http://127.0.0.1:5000").replace(/\/$/, "");
axios.defaults.baseURL = API_URL;
axios.defaults.withCredentials = true;

const CATEGORIES = [
  "Groceries", "Shopping", "Entertainment", "Credit Cards", "Amenities",
  "Travel", "Education", "Medical", "Miscellaneous"
];

// Simple currency formatter
const fmt = (n) => Number(n ?? 0).toLocaleString(undefined, { style: "currency", currency: "USD" });
const monthKey = (d) => {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
};

export default function App() {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    date: "", category: "Groceries", merchant: "", paymentMethod: "card", amount: "", notes: ""
  });
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get("/api/expenses");
      setItems(Array.isArray(data) ? data : []);
      setError("");
    } catch (e) {
      console.error(e);
      const msg = e?.response
        ? `${e.response.status} ${e.response.statusText}`
        : (e?.message || "Request failed");
      setError(`Failed to load expenses: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const total = useMemo(() => items.reduce((s, x) => s + (x.amount || 0), 0), [items]);

  // Monthly totals for line chart
  const lineData = useMemo(() => {
    const byMonth = new Map();
    for (const x of items) {
      const k = monthKey(x.date);
      byMonth.set(k, (byMonth.get(k) || 0) + Number(x.amount || 0));
    }
    return Array.from(byMonth, ([name, value]) => ({ name, value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items]);

  // Category totals for pie
  const pieData = useMemo(() => {
    const byCat = new Map();
    for (const x of items) {
      const k = x.category || "Miscellaneous";
      byCat.set(k, (byCat.get(k) || 0) + Number(x.amount || 0));
    }
    return Array.from(byCat, ([name, value]) => ({ name, value }));
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    const payload = { ...form, amount: Number(form.amount) };
    if (!payload.date || !payload.merchant || !payload.amount) {
      alert("Date, Merchant, and Amount are required.");
      return;
    }
    try {
      await axios.post("/api/expenses", payload);
      setForm({ date:"", category:"Groceries", merchant:"", paymentMethod:"card", amount:"", notes:"" });
      await load();
    } catch (e2) {
      console.error(e2);
      alert("Failed to add expense.");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await axios.delete(`/api/expenses/${id}`);
      await load();
    } catch (e3) {
      console.error(e3);
      alert("Failed to delete.");
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <div className="app-header">
        <h1 className="app-title">Expense Tracker (MERN)</h1>
        <div className="pill kpi">Total Spend: <span style={{ marginLeft: 6 }}>{fmt(total)}</span></div>
      </div>

      {/* Add Expense */}
      <form onSubmit={submit} className="form-grid card">
        <div>
          <label>Date</label>
          <input type="date" value={form.date} onChange={e=>setForm({...form, date:e.target.value})} />
        </div>
        <div>
          <label>Category</label>
          <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label>Merchant</label>
          <input value={form.merchant} onChange={e=>setForm({...form, merchant:e.target.value})} placeholder="Walmart" />
        </div>
        <div>
          <label>Payment</label>
          <select value={form.paymentMethod} onChange={e=>setForm({...form, paymentMethod:e.target.value})}>
            <option value="card">card</option>
            <option value="bank">bank</option>
            <option value="cash">cash</option>
            <option value="wallet">wallet</option>
            <option value="upi">upi</option>
            <option value="other">other</option>
          </select>
        </div>
        <div>
          <label>Amount</label>
          <input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form, amount:e.target.value})} placeholder="0.00" />
        </div>
        <div>
          <label>Notes</label>
          <input value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})} placeholder="" />
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">Add Expense</button>
          <button type="button" className="btn btn-ghost" onClick={()=>setForm({ date:"", category:"Groceries", merchant:"", paymentMethod:"card", amount:"", notes:"" })}>
            Reset
          </button>
        </div>
      </form>

      {/* Charts */}
      <div className="grid charts-grid">
        <div className="card chart-card">
          <h3>Monthly Spend</h3>
          <ResponsiveContainer width="100%" height="90%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" name="Amount" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card chart-card">
          <h3>By Category</h3>
          <ResponsiveContainer width="100%" height="90%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <h3>Recent Expenses</h3>
        {loading ? <p className="text-light">Loading…</p> : error ? (
          <p style={{ color: "tomato" }}>{error}</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Merchant</th><th>Payment</th><th>Amount</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {items.map(x => (
                  <tr key={x._id}>
                    <td>{new Date(x.date).toLocaleDateString()}</td>
                    <td>{x.category}</td>
                    <td>{x.merchant}</td>
                    <td>{x.paymentMethod}</td>
                    <td>{fmt(x.amount)}</td>
                    <td>{x.notes}</td>
                    <td>
                      <div className="table-actions">
                        <button className="btn btn-danger" onClick={() => remove(x._id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!items.length && <tr><td colSpan="7" style={{ textAlign: "center", color: "#6b7280" }}>No data yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
