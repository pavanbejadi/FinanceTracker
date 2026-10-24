import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'

const fieldClass = 'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100'

function Profile() {
  const dispatch = useDispatch()
  const { user, loading, error: authError } = useSelector((state) => state.auth)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    setProfile({ name: user?.name || '', email: user?.email || '' })
    getAccountStats().then(({ data }) => setStats(data.data)).catch((requestError) => setError(requestError.response?.data?.message || 'Could not load account statistics.'))
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault(); setMessage(''); setError('')
    try {
      await dispatch(updateProfileThunk(profile)).unwrap()
      setMessage('Profile updated successfully.')
    } catch (submitError) { setError(submitError) }
  }
  const savePassword = async (event) => {
    event.preventDefault(); setMessage(''); setError('')
    try {
      const response = await changePassword(passwords)
      setMessage(response.data.message || 'Password changed successfully.')
      setPasswords({ currentPassword: '', newPassword: '' })
    } catch (requestError) { setError(requestError.response?.data?.message || 'Could not change the password.') }
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-bold text-slate-900">Profile</h2><p className="mt-1 text-slate-500">Manage your account details and password.</p></div>
      {message && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}
      {(error || authError) && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error || authError}</p>}
      <div className="grid gap-6 xl:grid-cols-3"><section className="rounded-lg border bg-white p-5 shadow-sm xl:col-span-2">
        <h3 className="font-semibold text-slate-800">User Details</h3>
        <form onSubmit={saveProfile} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Name<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-medium">Email<input type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} className={`${fieldClass} mt-1`} /></label>
          <button disabled={loading} className="w-fit rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white disabled:opacity-60">{loading ? 'Saving…' : 'Save Profile'}</button>
        </form>
        <h3 className="mt-8 font-semibold text-slate-800">Change Password</h3>
        <form onSubmit={savePassword} className="mt-4 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium">Current Password<input type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} className={`${fieldClass} mt-1`} /></label>
          <label className="text-sm font-medium">New Password<input type="password" autoComplete="new-password" minLength="6" required value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} className={`${fieldClass} mt-1`} /></label>
          <button className="w-fit rounded-lg border border-slate-300 px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50">Change Password</button>
        </form>
      </section>
      <section className="rounded-lg border bg-white p-5 shadow-sm"><h3 className="font-semibold text-slate-800">Account Statistics</h3><div className="mt-4 space-y-4">
        <div className="flex justify-between"><span className="text-sm text-slate-500">Transactions</span><strong>{stats?.transactionCount ?? '—'}</strong></div>
        <div className="flex justify-between"><span className="text-sm text-slate-500">Income</span><strong>{formatCurrency(stats?.totalIncome)}</strong></div>
        <div className="flex justify-between"><span className="text-sm text-slate-500">Expenses</span><strong>{formatCurrency(stats?.totalExpense)}</strong></div>
        <div className="flex justify-between"><span className="text-sm text-slate-500">Savings</span><strong>{formatCurrency(stats?.savings)}</strong></div>
      </div></section></div>
    </div>
  )
}

export default Profile
