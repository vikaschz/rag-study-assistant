export default function LoadingSpinner({ label = 'Loading', fullPage = false }) {
  return (
    <div className={`flex items-center justify-center gap-3 text-sm text-slate-500 ${fullPage ? 'min-h-screen' : 'py-10'}`} role="status">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-brand-600" />
      <span>{label}</span>
    </div>
  )
}
