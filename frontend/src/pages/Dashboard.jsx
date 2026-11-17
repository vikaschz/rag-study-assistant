import { useCallback, useEffect, useState } from 'react'
import { FolderPlus, Plus, Search } from 'lucide-react'
import { getErrorMessage } from '../api/axios.js'
import AppLayout from '../components/layout/AppLayout.jsx'
import ConfirmationDialog from '../components/common/ConfirmationDialog.jsx'
import EmptyState from '../components/common/EmptyState.jsx'
import { ErrorMessage, Toast } from '../components/common/Feedback.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import CreateProjectModal from '../components/projects/CreateProjectModal.jsx'
import ProjectCard from '../components/projects/ProjectCard.jsx'
import { projectService } from '../services/projectService.js'

export default function Dashboard() {
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState('')

  const loadProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try { setProjects(await projectService.list()) }
    catch (requestError) { setError(getErrorMessage(requestError, 'Could not load your projects.')) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  function showToast(message) {
    setToast(message)
    window.setTimeout(() => setToast(''), 3500)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await projectService.remove(deleteTarget.id)
      setProjects((items) => items.filter((project) => project.id !== deleteTarget.id))
      setDeleteTarget(null)
      showToast('Project deleted.')
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not delete the project.'))
      setDeleteTarget(null)
    } finally { setDeleting(false) }
  }

  function handleCreated(project) {
    setProjects((items) => [project, ...items])
    setModalOpen(false)
    showToast('Project created.')
  }

  return (
    <AppLayout>
      <div className="mb-9 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div><p className="text-sm font-medium text-brand-700">Your workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-[34px]">Good to see you.</h1><p className="mt-2 text-sm leading-6 text-muted">Keep your learning organized, one project at a time.</p></div>
        <button className="primary-button self-start sm:self-auto" onClick={() => setModalOpen(true)}><Plus size={17} /> New project</button>
      </div>

      <section id="projects" aria-labelledby="projects-heading">
        <div className="mb-4 flex items-center justify-between"><div><h2 id="projects-heading" className="text-lg font-semibold text-ink">Projects</h2><p className="mt-1 text-sm text-muted">Your personal study spaces</p></div><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{projects.length}</span></div>
        {error && <div className="mb-4"><ErrorMessage onDismiss={() => setError('')}>{error}</ErrorMessage><button onClick={loadProjects} className="mt-2 text-sm font-medium text-brand-700 hover:underline">Try again</button></div>}
        {loading ? <LoadingSpinner label="Loading projects" /> : projects.length === 0 ? (
          <EmptyState title="Your first project starts here" description="Create a project for a class, exam, or topic you want to explore. Your study materials will have a home when you are ready." action={<button className="primary-button" onClick={() => setModalOpen(true)}><FolderPlus size={17} /> Create your first project</button>} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} onDelete={setDeleteTarget} />)}</div>
        )}
      </section>
      <CreateProjectModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={handleCreated} />
      <ConfirmationDialog open={Boolean(deleteTarget)} title="Delete this project?" description={`“${deleteTarget?.name || ''}” will be permanently removed from your workspace.`} loading={deleting} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
      <Toast message={toast} onClose={() => setToast('')} />
    </AppLayout>
  )
}
