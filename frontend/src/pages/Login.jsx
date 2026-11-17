import { useState } from 'react'
import { ArrowRight, BookOpen, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/axios.js'
import { ErrorMessage } from '../components/common/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, user, loading: authLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [success] = useState(location.state?.registered ? 'Your account is ready. Sign in to continue.' : '')

  if (authLoading) return null
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    if (!password) { setError('Enter your password.'); return }
    setBusy(true)
    try {
      await login(email.trim(), password)
      navigate(location.state?.from || '/dashboard', { replace: true })
    } catch (requestError) {
      setError(requestError.response?.status === 401 ? 'That email and password do not match.' : getErrorMessage(requestError, 'Could not sign in.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#f3f6fb] p-12 lg:flex xl:p-16">
        <div className="absolute -right-28 top-28 h-80 w-80 rounded-full border border-blue-100" /><div className="absolute -right-12 top-44 h-48 w-48 rounded-full border border-blue-100" />
        <Link to="/login" className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={21} /></span><span className="text-base font-bold tracking-tight text-ink">studyspace</span></Link>
        <div className="relative max-w-lg pb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Your thinking, organized</p>
          <h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-ink xl:text-5xl">A clearer space to make sense of what you study.</h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-600">Keep each subject together and build a more focused study routine, one project at a time.</p>
          <div className="mt-10 flex items-center gap-3 text-sm text-slate-500"><span className="flex -space-x-2"><span className="h-8 w-8 rounded-full border-2 border-[#f3f6fb] bg-[#d9e6ff]"/><span className="h-8 w-8 rounded-full border-2 border-[#f3f6fb] bg-[#e8e0fc]"/><span className="h-8 w-8 rounded-full border-2 border-[#f3f6fb] bg-[#d9eee7]"/></span><span>A calmer way to study</span></div>
        </div>
        <p className="relative text-xs text-slate-400">Personal study workspace</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          <Link to="/login" className="mb-12 flex items-center justify-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={19} /></span><span className="text-base font-bold tracking-tight text-ink">studyspace</span></Link>
          <p className="text-sm font-medium text-brand-700">Welcome back</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Sign in to your space</h2>
          <p className="mt-2 text-sm text-muted">Pick up where your learning left off.</p>
          <div className="mt-7 space-y-3">{success && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-sm text-emerald-800">{success}</p>}{error && <ErrorMessage>{error}</ErrorMessage>}</div>
          <form onSubmit={handleSubmit} className="mt-6 space-y-5" noValidate>
            <div><label htmlFor="email" className="field-label">Email address</label><div className="relative"><Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input id="email" type="email" autoComplete="email" className="text-input pl-10" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div></div>
            <div><label htmlFor="password" className="field-label">Password</label><div className="relative"><LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="text-input px-10" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
            <button className="primary-button w-full py-3" disabled={busy}>{busy ? 'Signing in…' : <>Sign in <ArrowRight size={16} /></>}</button>
          </form>
          <p className="mt-7 text-center text-sm text-muted">New to Studyspace? <Link to="/register" className="font-semibold text-brand-700 hover:text-brand-800">Create an account</Link></p>
          <p className="mt-10 text-center text-xs text-slate-400">Your personal study workspace</p>
        </div>
      </section>
    </main>
  )
}
