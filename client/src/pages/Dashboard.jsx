import { useEffect, useState } from 'react'
import {
  Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts'
import SummaryCard from '../components/dashboard/SummaryCard'
import { getDashboardSummary } from '../services/dashboardService'
import { formatCurrency, formatDate } from '../utils/format'

const COLORS = ['#2563eb', '#059669', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getDashboardSummary()
      .then(({ data }) => { if (active) setSummary(data.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load the dashboard.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  if (loading) return <p className="rounded-lg border bg-white p-6 text-slate-600">Loading dashboard…</p>
  if (error) return <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p>

  const trend = summary?.monthlyTrend || []
  const categories = summary?.categoryBreakdown || []
  const incomeExpense = trend.map((item) => ({ month: item.month, Income: item.income, Expense: item.expense }))

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Dashboard</h2><p className="mt-1 text-slate-500">An overview of your income, spending, and savings.</p></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Total Income" value={formatCurrency(summary?.totalIncome)} tone="green" />
        <SummaryCard label="Total Expense" value={formatCurrency(summary?.totalExpense)} tone="red" />
        <SummaryCard label="Remaining Budget" value={formatCurrency(summary?.budgetRemaining)} tone="blue" />
        <SummaryCard label="Savings" value={formatCurrency(summary?.savings)} />
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-semibold text-slate-800">Monthly Spending Trend</h3>
          <div className="mt-4 h-72">
            {trend.length ? <ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Line type="monotone" dataKey="expense" name="Expense" stroke="#dc2626" strokeWidth={2} /></LineChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-500">Add transactions to see your spending trend.</p>}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">Category Distribution</h3>
          <div className="mt-4 h-72">
            {categories.length ? <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="amount" nameKey="category" outerRadius={90} label={({ name }) => name}>{categories.map((entry, index) => <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => formatCurrency(value)} /></PieChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-500">No expense categories yet.</p>}
          </div>
        </section>
      </div>
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
          <h3 className="font-semibold text-slate-800">Income vs Expense</h3>
          <div className="mt-4 h-72">
            {incomeExpense.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={incomeExpense} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="Income" fill="#059669" /><Bar dataKey="Expense" fill="#dc2626" /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-500">Add transactions to compare income and expenses.</p>}
          </div>
        </section>
        <section className="rounded-lg border bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800">Recent Transactions</h3>
          <div className="mt-4 space-y-3">
            {summary?.recentTransactions?.length ? summary.recentTransactions.map((item) => <div key={item._id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-800">{item.title}</p><p className="text-xs text-slate-500">{item.category} · {formatDate(item.transactionDate)}</p></div><p className={`shrink-0 text-sm font-semibold ${item.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</p></div>) : <p className="text-sm text-slate-500">No transactions yet.</p>}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Dashboard
