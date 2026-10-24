import { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { formatCurrency } from '../utils/format'

function Insights() {
  const dispatch = useDispatch()
  const { insights, predictions, provider, loading, status, predictionStatus, error } = useSelector((state) => state.insights)
  const initialized = useRef(false)
  const refresh = () => dispatch(fetchInsights())
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    if (status === 'idle' || status === 'failed') dispatch(fetchInsights())
    if (predictionStatus === 'idle' || predictionStatus === 'failed') dispatch(fetchPrediction())
  }, [dispatch, status, predictionStatus])
  const confidence = Math.max(0, Math.min(100, Number(predictions.confidence) || 0))
  const providerLabel = status === 'failed'
    ? 'Unavailable'
    : status === 'loading' && !provider
      ? 'Loading'
      : provider || (status === 'succeeded' ? 'heuristic' : 'Not generated')

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"><div><h2 className="text-2xl font-bold text-slate-900">Insights</h2><p className="mt-1 text-slate-500">Personalized observations based on your finance activity.</p></div><button onClick={refresh} disabled={loading} className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">{loading ? 'Refreshing…' : 'Refresh Insights'}</button></div>
      {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
      <div className="grid gap-6 xl:grid-cols-3">
        <section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2"><div className="mb-4 flex items-center justify-between"><h3 className="font-semibold text-slate-800">Recommendations</h3><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">{providerLabel}</span></div>
          {loading && !insights.length ? <p className="text-sm text-slate-500">Generating insights…</p> : insights.length ? <><ul className="space-y-3">{insights.map((insight, index) => <li key={`${index}-${insight}`} className="rounded-lg border border-slate-100 bg-slate-50 p-4 text-sm leading-6 text-slate-700">{insight}</li>)}</ul>{loading && <p role="status" className="mt-3 text-xs text-slate-500">Refreshing insights… Your current recommendations remain available.</p>}</> : <p className="text-sm text-slate-500">Add transactions to generate insights.</p>}
        </section>
        <section className="rounded-lg border bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-800">Spending Prediction</h3><div className="mt-5 space-y-5">
          <div><p className="text-sm text-slate-500">Predicted Expense</p><p className="mt-1 text-2xl font-bold text-slate-900">{formatCurrency(predictions.predictedExpense)}</p></div>
          <div><div className="mb-2 flex justify-between text-sm"><span className="text-slate-600">Confidence</span><span className="font-medium">{confidence}%</span></div><div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-600" style={{ width: `${confidence}%` }} /></div></div>
          {predictions.budgetRisk && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">Predicted spending is above your monthly budget.</p>}
        </div></section>
      </div>
    </div>
  )
}

export default Insights
