import { ArrowUpRight, CalendarDays, Folder, MoreHorizontal, Trash2 } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function ProjectCard({ project, onDelete }) {
  const date = new Date(project.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
  return (
    <article className="group flex min-h-56 flex-col rounded-2xl border border-line bg-white p-5 shadow-[0_1px_2px_rgba(23,32,51,0.03)] transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><Folder size={19} /></div>
        <button aria-label={`Delete ${project.name}`} title="Delete project" onClick={() => onDelete(project)} className="rounded-lg p-2 text-slate-400 opacity-100 transition hover:bg-red-50 hover:text-red-600 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"><Trash2 size={16} /></button>
      </div>
      <h3 className="mt-5 truncate text-base font-semibold text-ink" title={project.name}>{project.name}</h3>
      <p className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 text-muted">{project.description || 'A quiet space for your study materials.'}</p>
      <div className="mt-auto flex items-center justify-between border-t border-slate-100 pt-4">
        <span className="flex items-center gap-1.5 text-xs text-slate-500"><CalendarDays size={14} /> {date}</span>
        <Link to={`/projects/${project.id}`} className="inline-flex items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800">Open <ArrowUpRight size={15} /></Link>
      </div>
    </article>
  )
}
