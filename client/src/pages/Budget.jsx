import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'

const fieldClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

function Budget() {
  const dispatch = useDispatch()
  const budget = useSelector((state) => state.budget)
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')
  const [summaryError, setSummaryError] = useState('')

  useEffect(() => {
    dispatch(fetchBudget())
    getDashboardSummary().then(({ data }) => setSummary(data.data)).catch((error) => setSummaryError(error.response?.data?.message || 'Could not load spending progress.'))
  }, [dispatch])
  useEffect(() => {
    setMonthlyBudget(budget.monthlyBudget)
    setCategoryBudgets(budget.categories.map(({ category, limit }) => ({ category, limit })))
  }, [budget.monthlyBudget, budget.categories])

  const addCategory = () => setCategoryBudgets((items) => [...items, { category: categories.find((item) => !items.some((entry) => entry.category === item)) || categories[0], limit: '' }])
  const updateCategory = (index, field, value) => setCategoryBudgets((items) => items.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item))
  const removeCategory = (index) => setCategoryBudgets((items) => items.filter((_, itemIndex) => itemIndex !== index))
  const totalExpense = summary?.totalExpense || 0
  const remaining = Number(monthlyBudget || 0) - totalExpense
  const usedPercent = monthlyBudget > 0 ? Math.min(100, (totalExpense / monthlyBudget) * 100) : 0

  const save = async (event) => {
    event.preventDefault()
    setMessage('')
    try {
      await dispatch(saveBudget({ monthlyBudget: Number(monthlyBudget), categoryBudgets: categoryBudgets.map((item) => ({ ...item, limit: Number(item.limit) })) })).unwrap()
      const response = await getDashboardSummary()
      setSummary(response.data.data)
      setMessage('Budget saved successfully.')
    } catch (error) { setMessage(error || 'Could not save budget.') }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Budget</h2><p className="mt-1 text-slate-500">Set monthly and category limits to keep spending on track.</p></div>
      {message && <p role="status" className={`rounded-lg p-3 text-sm ${message.includes('successfully') ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{message}</p>}
      {budget.error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{budget.error}</p>}
      {summaryError && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{summaryError}</p>}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2"><form onSubmit={save} className="space-y-5">
          <label className="block text-sm font-medium text-slate-700">Monthly Budget<input type="number" min="0" step="0.01" required value={monthlyBudget} onChange={(event) => setMonthlyBudget(event.target.value)} className={`${fieldClass} mt-1`} /></label>
          <div className="flex items-center justify-between"><h3 className="font-semibold text-slate-800">Category Budgets</h3><button type="button" onClick={addCategory} className="rounded-lg border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50">Add Category</button></div>
          <div className="space-y-3">{categoryBudgets.length ? categoryBudgets.map((item, index) => {
            const spent = summary?.categoryBreakdown?.find((entry) => entry.category === item.category)?.amount || 0
            const percent = Number(item.limit) > 0 ? Math.min(100, (spent / Number(item.limit)) * 100) : 0
            return <div key={`${index}-${item.category}`} className="rounded-lg border border-slate-200 p-4"><div className="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
              <label className="text-sm font-medium">Category<select value={item.category} onChange={(event) => updateCategory(index, 'category', event.target.value)} className={`${fieldClass} mt-1`}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
              <label className="text-sm font-medium">Limit<input type="number" min="0" step="0.01" required value={item.limit} onChange={(event) => updateCategory(index, 'limit', event.target.value)} className={`${fieldClass} mt-1`} /></label>
              <button type="button" onClick={() => removeCategory(index)} className="rounded-lg px-3 py-2 text-sm font-medium text-rose-700 hover:bg-rose-50">Remove</button>
            </div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>Spent {formatCurrency(spent)}</span><span>Limit {formatCurrency(item.limit)}</span></div><div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${percent}%` }} /></div></div>
          }) : <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-500">No category limits yet. Add one to track spending by category.</p>}</div>
          <button disabled={budget.loading} className="rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{budget.loading ? 'Saving…' : 'Save Budget'}</button>
        </form></section>
        <section className="rounded-lg border bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-800">Monthly Progress</h3><div className="mt-5 space-y-5">
          <div><p className="text-sm text-slate-500">Spent this month</p><p className="mt-1 text-xl font-bold">{formatCurrency(totalExpense)}</p></div>
          <div><p className="text-sm text-slate-500">Remaining</p><p className={`mt-1 text-xl font-bold ${remaining < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{formatCurrency(remaining)}</p></div>
          <div><div className="mb-2 flex justify-between text-sm"><span>Budget used</span><span>{Math.round(usedPercent)}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className={`h-full ${usedPercent >= 100 ? 'bg-rose-500' : 'bg-sky-500'}`} style={{ width: `${usedPercent}%` }} /></div></div>
          {remaining < 0 && monthlyBudget > 0 && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">You have exceeded your monthly budget.</p>}
        </div></section>
      </div>
    </div>
  )
}

export default Budget
