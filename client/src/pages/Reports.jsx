import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency, formatDate } from '../utils/format'

const monthNames = Array.from({ length: 12 }, (_, index) => new Date(2000, index, 1).toLocaleString('en', { month: 'long' }))
const currentDate = new Date()

function Reports() {
  const [period, setPeriod] = useState({ month: currentDate.getMonth() + 1, year: currentDate.getFullYear() })
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const params = useMemo(() => ({ ...period }), [period])

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    getMonthlyReport(params)
      .then(({ data }) => { if (active) setReport(data.data) })
      .catch((requestError) => { if (active) setError(requestError.response?.data?.message || 'Could not load the report.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [params])

  const exportPdf = async () => {
    setError('')
    setExporting(true)
    try {
      const response = await downloadMonthlyReport(params)
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Could not export the PDF report.')
    } finally { setExporting(false) }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold text-slate-900">Reports</h2><p className="mt-1 text-slate-500">Review and export a monthly summary of your finances.</p></div><button onClick={exportPdf} disabled={exporting || loading || !report} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-50">{exporting ? 'Exporting…' : 'Export PDF'}</button></div>
      <section className="rounded-lg border bg-white p-4 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><label className="text-sm font-medium text-slate-700">Month<select value={period.month} onChange={(event) => setPeriod({ ...period, month: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2">{monthNames.map((month, index) => <option key={month} value={index + 1}>{month}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Year<input type="number" min="2000" max="2100" value={period.year} onChange={(event) => setPeriod({ ...period, year: Number(event.target.value) })} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" /></label></div></section>
      {loading && <p className="rounded-lg border bg-white p-6 text-slate-600">Loading report…</p>}
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-4 text-rose-700">{error}</p>}
      {report && !loading && <>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{[
          ['Income', report.totalIncome, 'text-emerald-700'], ['Expense', report.totalExpense, 'text-rose-700'], ['Savings', report.savings, 'text-slate-900'], ['Remaining', report.budgetRemaining, 'text-blue-700']
        ].map(([label, value, tone]) => <div key={label} className="rounded-lg border bg-white p-5 shadow-sm"><p className="text-sm font-medium text-slate-500">{label}</p><p className={`mt-2 text-2xl font-bold ${tone}`}>{formatCurrency(value)}</p></div>)}</div>
        <div className="grid gap-6 xl:grid-cols-3"><section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2"><h3 className="font-semibold text-slate-800">Category Analytics</h3><div className="mt-4 h-72">{report.categoryBreakdown?.length ? <ResponsiveContainer width="100%" height="100%"><BarChart data={report.categoryBreakdown} margin={{ top: 8, right: 12, left: 8, bottom: 4 }}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="category" /><YAxis /><Tooltip formatter={(value) => formatCurrency(value)} /><Bar dataKey="amount" name="Expense" fill="#2563eb" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer> : <p className="pt-16 text-center text-sm text-slate-500">No spending by category for this period.</p>}</div></section>
          <section className="rounded-lg border bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-800">Transactions</h3><div className="mt-4 max-h-72 space-y-3 overflow-auto">{report.transactions?.length ? report.transactions.map((item) => <div key={item._id} className="flex justify-between gap-3 border-b border-slate-100 pb-3 last:border-0"><div><p className="text-sm font-medium text-slate-800">{item.title}</p><p className="text-xs text-slate-500">{item.category} · {formatDate(item.transactionDate)}</p></div><p className={`shrink-0 text-sm font-semibold ${item.type === 'income' ? 'text-emerald-700' : 'text-rose-700'}`}>{item.type === 'income' ? '+' : '−'}{formatCurrency(item.amount)}</p></div>) : <p className="text-sm text-slate-500">No transactions for this period.</p>}</div></section>
        </div>
      </>}
    </div>
  )
}

export default Reports
