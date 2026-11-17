import { useEffect, useState } from 'react'
import { ArrowLeft, BookOpen, FileText } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getErrorMessage } from '../api/axios.js'
import EmptyState from '../components/common/EmptyState.jsx'
import { ErrorMessage } from '../components/common/Feedback.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import AppLayout from '../components/layout/AppLayout.jsx'
import { projectService } from '../services/projectService.js'

export default function ProjectDetails() {
  const { projectId } = useParams()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    setError('')
    projectService.get(projectId)
      .then((data) => { if (active) setProject(data) })
      .catch((requestError) => {
        if (!active) return
        setError(requestError.response?.status === 404 || requestError.response?.status === 422 ? 'This project could not be found.' : getErrorMessage(requestError, 'Could not load this project.'))
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [projectId])

  return (
    <AppLayout>
      <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-brand-700"><ArrowLeft size={16} /> Back to projects</Link>
      {loading ? <LoadingSpinner label="Opening project" /> : error ? <div className="mt-8"><ErrorMessage>{error}</ErrorMessage><Link to="/dashboard" className="mt-4 inline-block text-sm font-semibold text-brand-700 hover:underline">Return to dashboard</Link></div> : (
        <>
          <div className="mt-8 border-b border-line pb-7"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600"><BookOpen size={20} /></div><h1 className="mt-5 break-words text-3xl font-semibold tracking-tight text-ink">{project.name}</h1><p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-6 text-muted">{project.description || 'No description added yet.'}</p><p className="mt-4 text-xs text-slate-400">Created {new Date(project.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}</p></div>
          <section className="pt-7"><div className="mb-4 flex items-center gap-2"><FileText size={18} className="text-slate-500"/><h2 className="text-lg font-semibold text-ink">Documents</h2><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">Coming soon</span></div><EmptyState title="Your documents will live here" description="Document upload and page-level study tools are on the way. For now, this is your project workspace." /></section>
        </>
      )}
    </AppLayout>
  )
}
