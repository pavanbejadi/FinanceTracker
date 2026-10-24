import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchTransactions, removeTransactionById, saveTransaction } from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'

const emptyForm = {
  type: 'expense', title: '', amount: '', category: 'Food', paymentMethod: 'upi',
  description: '', transactionDate: new Date().toISOString().slice(0, 10)
}
const inputClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

function Transactions() {
  const dispatch = useDispatch()
  const { transactions, pagination, loading, error } = useSelector((state) => state.transactions)
  const [filters, setFilters] = useState({ search: '', type: '', category: '', sort: 'latest', page: 1 })
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')
  const query = useMemo(() => ({ ...filters, limit: 10 }), [filters])

  useEffect(() => { dispatch(fetchTransactions(query)) }, [dispatch, query])

  const updateFilter = (field, value) => setFilters((current) => ({ ...current, [field]: value, ...(field === 'page' ? {} : { page: 1 }) }))
  const openCreate = () => { setEditingId(null); setForm({ ...emptyForm, transactionDate: new Date().toISOString().slice(0, 10) }); setFormError(''); setShowForm(true) }
  const openEdit = (item) => {
    setEditingId(item._id)
    setForm({ type: item.type, title: item.title, amount: item.amount, category: item.category, paymentMethod: item.paymentMethod || 'other', description: item.description || '', transactionDate: new Date(item.transactionDate).toISOString().slice(0, 10) })
    setFormError('')
    setShowForm(true)
  }
  const submitForm = async (event) => {
    event.preventDefault()
    setFormError('')
    try {
      await dispatch(saveTransaction({ id: editingId, data: { ...form, amount: Number(form.amount) } })).unwrap()
      setShowForm(false)
      setMessage(editingId ? 'Transaction updated.' : 'Transaction added.')
      dispatch(fetchTransactions(query))
    } catch (submitError) { setFormError(submitError) }
  }
  const deleteItem = async (item) => {
    if (!window.confirm(`Delete “${item.title}”?`)) return
    setMessage('')
    try {
      await dispatch(removeTransactionById(item._id)).unwrap()
      setMessage('Transaction deleted.')
      dispatch(fetchTransactions(query))
    } catch (deleteError) { setMessage(deleteError) }
  }
  const resetFilters = () => setFilters({ search: '', type: '', category: '', sort: 'latest', page: 1 })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold text-slate-900">Transactions</h2><p className="mt-1 text-slate-500">Track and manage your income and expenses.</p></div><button onClick={openCreate} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800">Add Transaction</button></div>
      <section className="rounded-lg border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input aria-label="Search transactions" placeholder="Search…" value={filters.search} onChange={(event) => updateFilter('search', event.target.value)} className={inputClass} />
        <select aria-label="Filter by type" value={filters.type} onChange={(event) => updateFilter('type', event.target.value)} className={inputClass}><option value="">All types</option><option value="income">Income</option><option value="expense">Expense</option></select>
        <select aria-label="Filter by category" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)} className={inputClass}><option value="">All categories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select>
        <select aria-label="Sort transactions" value={filters.sort} onChange={(event) => updateFilter('sort', event.target.value)} className={inputClass}><option value="latest">Latest</option><option value="oldest">Oldest</option><option value="amount_desc">Amount high to low</option><option value="amount_asc">Amount low to high</option></select>
        <button onClick={resetFilters} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">Reset filters</button>
      </div></section>
      {(error || message) && <p role="status" className={`rounded-lg p-3 text-sm ${error || (message.toLowerCase().includes('failed') || message.toLowerCase().includes('error') ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700')}`}>{error || message}</p>}
      <section className="overflow-hidden rounded-lg border bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>{['Title', 'Type', 'Category', 'Date', 'Payment', 'Amount', 'Actions'].map((column) => <th key={column} className="px-4 py-3 font-semibold">{column}</th>)}</tr></thead><tbody className="divide-y">
        {loading ? <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">Loading transactions…</td></tr> : transactions.length ? transactions.map((item) => <tr key={item._id} className="hover:bg-slate-50"><td className="px-4 py-3 font-medium text-slate-800">{item.title}</td><td className="px-4 py-3 capitalize">{item.type}</td><td className="px-4 py-3">{item.category}</td><td className="px-4 py-3">{formatDate(item.transactionDate)}</td><td className="px-4 py-3 capitalize">{(item.paymentMethod || '').replace('_', ' ')}</td><td className={`px-4 py-3 font-semibold ${item.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</td><td className="px-4 py-3"><div className="flex gap-3"><button onClick={() => openEdit(item)} className="font-medium text-blue-700 hover:underline">Edit</button><button onClick={() => deleteItem(item)} className="font-medium text-rose-700 hover:underline">Delete</button></div></td></tr>) : <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500">No transactions found.</td></tr>}
      </tbody></table></div><div className="flex items-center justify-between border-t px-4 py-3 text-sm"><span className="text-slate-600">Page {pagination.page} of {Math.max(1, pagination.pages)}</span><div className="flex gap-2"><button disabled={loading || pagination.page <= 1} onClick={() => updateFilter('page', filters.page - 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Previous</button><button disabled={loading || pagination.page >= pagination.pages} onClick={() => updateFilter('page', filters.page + 1)} className="rounded border px-3 py-1.5 disabled:opacity-40">Next</button></div></div></section>
      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="transaction-form-title" className="my-auto w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"><div className="mb-5 flex items-center justify-between"><h3 id="transaction-form-title" className="text-xl font-bold">{editingId ? 'Edit Transaction' : 'Add Transaction'}</h3><button aria-label="Close" onClick={() => setShowForm(false)} className="text-2xl leading-none text-slate-500">×</button></div>{formError && <p role="alert" className="mb-4 rounded bg-rose-50 p-3 text-sm text-rose-700">{formError}</p>}<form onSubmit={submitForm} className="grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium">Type<select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })} className={`${inputClass} mt-1`}><option value="expense">Expense</option><option value="income">Income</option></select></label>
        <label className="text-sm font-medium">Title<input required value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className={`${inputClass} mt-1`} /></label>
        <label className="text-sm font-medium">Amount<input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} className={`${inputClass} mt-1`} /></label>
        <label className="text-sm font-medium">Category<select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={`${inputClass} mt-1`}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="text-sm font-medium">Payment Method<select value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className={`${inputClass} mt-1`}>{paymentMethods.map((method) => <option key={method} value={method}>{method.replace('_', ' ')}</option>)}</select></label>
        <label className="text-sm font-medium">Date<input type="date" required value={form.transactionDate} onChange={(event) => setForm({ ...form, transactionDate: event.target.value })} className={`${inputClass} mt-1`} /></label>
        <label className="text-sm font-medium md:col-span-2">Description<textarea rows="3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={`${inputClass} mt-1`} /></label>
        <div className="flex justify-end gap-3 md:col-span-2"><button type="button" onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2">Cancel</button><button disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{loading ? 'Saving…' : 'Save Transaction'}</button></div>
      </form></section></div>}
    </div>
  )
}

export default Transactions
