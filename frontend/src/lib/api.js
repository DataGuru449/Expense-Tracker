// frontend/src/lib/api.js
const BASE = (import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000').replace(/\/$/, '');

export async function getExpenses(month) {
  const url = month ? `${BASE}/api/expenses?month=${encodeURIComponent(month)}`
                    : `${BASE}/api/expenses`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
  return res.json();
}

export async function addExpense(payload) {
  const res = await fetch(`${BASE}/api/expenses`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`POST /api/expenses -> ${res.status}`);
  return res.json();
}

export async function deleteExpense(id) {
  const res = await fetch(`${BASE}/api/expenses/${id}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok) throw new Error(`DELETE /api/expenses/${id} -> ${res.status}`);
}
