// src/App.test.jsx
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi, describe, it, beforeEach, afterEach, expect } from 'vitest'

// ---- Mock axios (API calls) ----
vi.mock('axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
    },
  }
})
import axios from 'axios'

// ---- Mock recharts (avoid JSDOM layout headaches) ----
vi.mock('recharts', () => {
  const React = require('react')
  const Box = ({ children, ...props }) => (
    <div data-testid="chart" {...props}>{children}</div>
  )
  return {
    ResponsiveContainer: Box,
    LineChart: Box, Line: Box, XAxis: Box, YAxis: Box,
    Tooltip: Box, CartesianGrid: Box, Legend: Box,
    PieChart: Box, Pie: Box,
    Cell: (props) => <div data-testid="cell" {...props} />,
  }
})

import App from './App'

// ------- Helpers to find inputs next to labels (since labels aren't associated) -------
// ------- Helpers to find inputs next to labels (since labels aren't associated) -------
const byLabelSibling = (labelText, { type } = {}) => {
  // find the <label> whose text matches exactly (case-insensitive)
  const label = screen.getByText(new RegExp(`^${labelText}$`, 'i'), { selector: 'label' })
  const container = label.closest('div') || label.parentElement

  // primary selector
  let selector = 'input, select, textarea'
  if (type === 'select') selector = 'select'
  else if (type) selector = `input[type="${type}"]`

  // try the primary selector
  let el = container.querySelector(selector)
  // if not found (e.g., no type="text" attribute), fall back to any field
  if (!el) el = container.querySelector('input, select, textarea')

  if (!el) throw new Error(`Field for label "${labelText}" not found`)
  return el
}

// Sample data
const sample = [
  { _id: 'a1', date: '2025-08-15', category: 'Groceries', merchant: 'Walmart', paymentMethod: 'card', amount: 12.34, notes: 'milk' },
  { _id: 'a2', date: '2025-08-16', category: 'Entertainment', merchant: 'Netflix', paymentMethod: 'card', amount: 9.99, notes: '' },
]

beforeEach(() => {
  axios.get.mockResolvedValue({ data: sample })
  axios.post.mockResolvedValue({ data: { ...sample[0], _id: 'new1' } })
  axios.delete.mockResolvedValue({ status: 204 })
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------- Smoke tests (15) ----------
describe('<App /> smoke suite', () => {
  it('@smoke renders header and KPI', async () => {
    render(<App />)
    expect(screen.getByText(/Expense Tracker/i)).toBeInTheDocument()
    expect(screen.getByText(/Total Spend:/i)).toBeInTheDocument()
    await waitFor(() => expect(axios.get).toHaveBeenCalled())
  })

  it('@smoke loads initial expenses from API', async () => {
    render(<App />)
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith('http://localhost:5000/api/expenses'))
    const rows = await screen.findAllByRole('row')
    expect(rows.length).toBeGreaterThan(1)
    expect(screen.getByText('Walmart')).toBeInTheDocument()
  })

  it('@smoke shows "No data yet" when list empty', async () => {
    axios.get.mockResolvedValueOnce({ data: [] })
    render(<App />)
    expect(await screen.findByText(/No data yet/i)).toBeInTheDocument()
  })

  it('@smoke submits a new expense and refreshes list', async () => {
    render(<App />)
    await screen.findByText('Walmart')

    // Date (use change/input for type="date")
    const dateEl = byLabelSibling('Date', { type: 'date' })
    fireEvent.input(dateEl, { target: { value: '2025-08-17' } })

    await userEvent.selectOptions(byLabelSibling('Category', { type: 'select' }), 'Travel')
    await userEvent.type(byLabelSibling('Merchant', { type: 'text' }), 'Uber')
    await userEvent.selectOptions(byLabelSibling('Payment', { type: 'select' }), 'wallet')
    await userEvent.type(byLabelSibling('Amount', { type: 'number' }), '23.50')

    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))

    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/expenses',
        expect.objectContaining({
          date: '2025-08-17',
          category: 'Travel',
          merchant: 'Uber',
          paymentMethod: 'wallet',
          amount: 23.5,
        })
      )
    )
    expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2)
  })

  it('@smoke blocks submit without date', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    await userEvent.type(byLabelSibling('Merchant', { type: 'text' }), 'Target')
    await userEvent.type(byLabelSibling('Amount', { type: 'number' }), '10')
    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))
    expect(window.alert).toHaveBeenCalled()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('@smoke blocks submit without merchant', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    fireEvent.input(byLabelSibling('Date', { type: 'date' }), { target: { value: '2025-08-18' } })
    const merchantEl = byLabelSibling('Merchant', { type: 'text' })
    await userEvent.clear(merchantEl)
    await userEvent.type(byLabelSibling('Amount', { type: 'number' }), '8.75')
    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))
    expect(window.alert).toHaveBeenCalled()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('@smoke blocks submit without amount', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    fireEvent.input(byLabelSibling('Date', { type: 'date' }), { target: { value: '2025-08-18' } })
    await userEvent.type(byLabelSibling('Merchant', { type: 'text' }), 'Shell')
    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))
    expect(window.alert).toHaveBeenCalled()
    expect(axios.post).not.toHaveBeenCalled()
  })

  it('@smoke delete row calls API', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    const row = screen.getByText('Walmart').closest('tr')
    const delBtn = within(row).getByRole('button', { name: /Delete/i })
    await userEvent.click(delBtn)
    await waitFor(() =>
      expect(axios.delete).toHaveBeenCalledWith('http://localhost:5000/api/expenses/a1')
    )
  })

  it('@smoke category dropdown includes common options', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    const select = byLabelSibling('Category', { type: 'select' })
    const opts = Array.from(select.querySelectorAll('option')).map(o => o.textContent)
    expect(opts).toEqual(expect.arrayContaining(['Groceries', 'Entertainment', 'Travel', 'Medical']))
  })

  it('@smoke currency formatting shows two decimals', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    expect(screen.getByText(/12\.34/)).toBeInTheDocument()
  })

  it('@smoke line chart renders (mock wrapper)', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    const charts = screen.getAllByTestId('chart')
    expect(charts.length).toBeGreaterThan(0)
  })

  it('@smoke pie chart cells render (mock cells)', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    const cells = screen.getAllByTestId('cell')
    expect(cells.length).toBeGreaterThan(0)
  })

  it('@smoke reset button clears inputs', async () => {
    render(<App />)
    await screen.findByText('Walmart')

    const dateEl = byLabelSibling('Date', { type: 'date' })
    const merchantEl = byLabelSibling('Merchant', { type: 'text' })
    const amountEl = byLabelSibling('Amount', { type: 'number' })

    fireEvent.input(dateEl, { target: { value: '2025-08-19' } })
    await userEvent.type(merchantEl, 'Costco')
    await userEvent.type(amountEl, '45')

    await userEvent.click(screen.getByRole('button', { name: /Reset/i }))

    expect(dateEl.value).toBe('')
    expect(merchantEl.value).toBe('')
    expect(amountEl.value).toBe('')
  })

  it('@smoke submit converts amount string to number', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    fireEvent.input(byLabelSibling('Date', { type: 'date' }), { target: { value: '2025-08-20' } })
    await userEvent.type(byLabelSibling('Merchant', { type: 'text' }), 'Uber')
    const amountEl = byLabelSibling('Amount', { type: 'number' })
    await userEvent.clear(amountEl)
    await userEvent.type(amountEl, '23.50')
    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))
    await waitFor(() => {
      const body = axios.post.mock.calls[0][1]
      expect(body.amount).toBe(23.5)
    })
  })

  it('@smoke submit with UPI payment works', async () => {
    render(<App />)
    await screen.findByText('Walmart')
    fireEvent.input(byLabelSibling('Date', { type: 'date' }), { target: { value: '2025-08-21' } })
    await userEvent.type(byLabelSibling('Merchant', { type: 'text' }), 'Zomato')
    await userEvent.selectOptions(byLabelSibling('Payment', { type: 'select' }), 'upi')
    await userEvent.type(byLabelSibling('Amount', { type: 'number' }), '19.99')
    await userEvent.click(screen.getByRole('button', { name: /Add Expense/i }))
    await waitFor(() =>
      expect(axios.post).toHaveBeenCalledWith(
        'http://localhost:5000/api/expenses',
        expect.objectContaining({ paymentMethod: 'upi' })
      )
    )
  })
})
