import { useSelector } from 'react-redux'

function Navbar() {
  const user = useSelector((state) => state.auth.user)
  return (
    <nav className="flex items-center justify-between border-b bg-white px-6 py-4 shadow-sm">
      <h1 className="text-lg font-semibold text-slate-800">Finance Dashboard</h1>
      {user && <div className="text-right">
        <p className="text-sm font-semibold text-slate-800">{user.name}</p>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>}
    </nav>
  )
}

export default Navbar
