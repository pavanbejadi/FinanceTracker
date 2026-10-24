import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { signupUser } from '../redux/slices/authSlice'

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [error, setError] = useState('')
  const loading = useSelector((state) => state.auth.loading)
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const handleChange = (event) => setFormData({ ...formData, [event.target.name]: event.target.value })
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    try {
      await dispatch(signupUser({ name: formData.name, email: formData.email, password: formData.password })).unwrap()
      navigate('/dashboard', { replace: true })
    } catch (submitError) {
      setError(submitError)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-700 to-slate-900 px-4 py-10">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-xl">
        <h1 className="text-center text-3xl font-bold text-slate-900">FinTrack</h1>
        <p className="mt-2 text-center text-slate-500">Create an account to get started.</p>
        {error && <p role="alert" className="mt-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Full Name
            <input name="name" type="text" autoComplete="name" required value={formData.name} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Email
            <input name="email" type="email" autoComplete="email" required value={formData.email} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Password
            <input name="password" type="password" autoComplete="new-password" minLength="6" required value={formData.password} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Confirm Password
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength="6" required value={formData.confirmPassword} onChange={handleChange} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100" />
          </label>
          <button disabled={loading} className="w-full rounded-lg bg-blue-700 px-4 py-2.5 font-semibold text-white hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60">{loading ? 'Creating account…' : 'Sign Up'}</button>
        </form>
        <p className="mt-6 text-center text-sm text-slate-600">Already have an account? <Link className="font-semibold text-blue-700 hover:underline" to="/login">Login</Link></p>
      </div>
    </div>
  )
}

export default Signup
