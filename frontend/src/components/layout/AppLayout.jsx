import { Menu } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const handleLogout = () => { logout(); navigate('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-canvas">
      <Sidebar user={user} open={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} />
      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-line bg-white/90 px-4 backdrop-blur md:hidden">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu size={20} /></button>
          <span className="ml-3 text-sm font-semibold text-ink">Studyspace</span>
        </header>
        <main className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  )
}
