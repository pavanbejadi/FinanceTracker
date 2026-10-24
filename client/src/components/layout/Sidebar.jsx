import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'

const navItems = [
  { label: 'Dashboard', path: '/dashboard' },
  { label: 'Transactions', path: '/transactions' },
  { label: 'Budget', path: '/budget' },
  { label: 'Insights', path: '/insights' },
  { label: 'Reports', path: '/reports' },
  { label: 'Profile', path: '/profile' }
]

function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const isActive = (path) => location.pathname === path
  const handleLogout = () => {
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">
      <div className="border-b border-slate-700 p-6">
        <Link to="/dashboard" className="text-2xl font-bold">FinTrack</Link>
        <p className="mt-1 text-sm text-slate-400">Personal finance manager</p>
      </div>
      <nav className="flex-1 space-y-1 p-4" aria-label="Main navigation">
        {navItems.map(({ label, path }) => <Link key={path} to={path} className={`block rounded-lg px-4 py-3 text-sm font-medium transition ${isActive(path) ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'}`}>
          {label}
        </Link>)}
      </nav>
      <div className="border-t border-slate-700 p-4">
        <button onClick={handleLogout} className="w-full rounded-lg px-4 py-3 text-left text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white">Log out</button>
      </div>
    </aside>
  )
}

export default Sidebar
