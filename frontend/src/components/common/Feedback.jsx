import { AlertCircle, CheckCircle2, X } from 'lucide-react'

export function ErrorMessage({ children, onDismiss }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-3 text-sm text-red-800">
      <AlertCircle size={17} className="mt-0.5 shrink-0" />
      <span className="flex-1">{children}</span>
      {onDismiss && <button onClick={onDismiss} aria-label="Dismiss message" className="text-red-500 hover:text-red-700"><X size={16} /></button>}
    </div>
  )
}

export function Toast({ message, onClose }) {
  if (!message) return null
  return (
    <div role="status" className="fixed bottom-5 right-5 z-50 flex max-w-sm items-center gap-2.5 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-soft">
      <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
      <span className="flex-1">{message}</span>
      <button aria-label="Dismiss notification" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={16} /></button>
    </div>
  )
}
