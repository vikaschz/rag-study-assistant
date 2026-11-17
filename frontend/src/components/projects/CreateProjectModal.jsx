import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { getErrorMessage } from '../../api/axios.js'
import { projectService } from '../../services/projectService.js'
import { ErrorMessage } from '../common/Feedback.jsx'

export default function CreateProjectModal({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const dialogRef = useRef(null)
  const previousFocusRef = useRef(null)
  const loadingRef = useRef(loading)
  const onCloseRef = useRef(onClose)
  loadingRef.current = loading
  onCloseRef.current = onClose

  useEffect(() => {
    if (!open) return undefined
    previousFocusRef.current = document.activeElement
    const appRoot = document.getElementById('root')
    const wasInert = appRoot?.inert ?? false
    if (appRoot) appRoot.inert = true
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.querySelector('input')?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !loadingRef.current) onCloseRef.current()
      if (event.key !== 'Tab') return
      const controls = dialogRef.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)')
      if (!controls?.length) return
      const first = controls[0]
      const last = controls[controls.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      if (appRoot) appRoot.inert = wasInert
      document.body.style.overflow = previousOverflow
      if (previousFocusRef.current instanceof HTMLElement && previousFocusRef.current.isConnected) previousFocusRef.current.focus()
    }
  }, [open])

  if (!open) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const trimmedName = name.trim()
    if (!trimmedName) { setError('Enter a project name.'); return }
    if (trimmedName.length > 120) { setError('Project names can be up to 120 characters.'); return }
    setLoading(true)
    try {
      const project = await projectService.create({ name: trimmedName, description: description.trim() || null })
      setName('')
      setDescription('')
      onCreated(project)
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create the project.'))
    } finally {
      setLoading(false)
    }
  }

  return createPortal((
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !loading) onClose() }}>
      <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="create-title" className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-widest text-brand-600">New workspace</p><h2 id="create-title" className="mt-1 text-xl font-semibold text-ink">Create a project</h2></div>
          <button onClick={onClose} disabled={loading} aria-label="Close dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={19} /></button>
        </div>
        <p className="mt-2 text-sm text-muted">Give your study materials a place to live.</p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && <ErrorMessage onDismiss={() => setError('')}>{error}</ErrorMessage>}
          <div><label htmlFor="project-name" className="field-label">Project name <span className="text-red-500">*</span></label><input id="project-name" className="text-input" autoFocus maxLength={120} value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Cognitive Psychology" /></div>
          <div><label htmlFor="project-description" className="field-label">Description <span className="font-normal text-slate-400">(optional)</span></label><textarea id="project-description" className="text-input min-h-28 resize-y" maxLength={2000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="What are you studying in this space?" /></div>
          <div className="flex justify-end gap-3 pt-1"><button type="button" className="secondary-button" disabled={loading} onClick={onClose}>Cancel</button><button type="submit" className="primary-button" disabled={loading}>{loading ? 'Creating…' : 'Create project'}</button></div>
        </form>
      </section>
    </div>
  ), document.body)
}
