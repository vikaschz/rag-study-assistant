import { BookOpen, FolderKanban, LayoutDashboard, LogOut, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'

export default function Sidebar({ user, open, onClose, onLogout }) {
  const navClass = ({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-100 hover:text-ink'}`
  return (
    <>
      {open && <button aria-label="Close navigation" className="fixed inset-0 z-30 bg-slate-950/30 md:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-line bg-white px-4 py-5 transition-transform duration-200 md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-2">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={19} strokeWidth={2.2} /></span>
            <span className="text-[15px] font-bold tracking-tight text-ink">studyspace</span>
          </Link>
          <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 md:hidden" onClick={onClose} aria-label="Close menu"><X size={19} /></button>
        </div>

        <div className="mt-10 px-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</div>
        <nav className="mt-3 space-y-1" aria-label="Main navigation">
          <NavLink to="/dashboard" end className={navClass} onClick={onClose}><LayoutDashboard size={18} /> Dashboard</NavLink>
          <NavLink to="/dashboard#projects" className={navClass} onClick={onClose}><FolderKanban size={18} /> Projects</NavLink>
        </nav>

        <div className="mt-auto rounded-2xl border border-slate-100 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold uppercase text-brand-700">{user?.username?.slice(0, 1) || 'S'}</div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-800">{user?.username}</p>
              <p className="truncate text-xs text-slate-500">{user?.email}</p>
            </div>
          </div>
          <button onClick={onLogout} className="mt-3 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-red-600"><LogOut size={16} /> Sign out</button>
        </div>
      </aside>
    </>
  )
}
