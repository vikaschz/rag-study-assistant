import { useState } from 'react'
import { ArrowRight, BookOpen, Eye, EyeOff, UserRound } from 'lucide-react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getErrorMessage } from '../api/axios.js'
import { ErrorMessage } from '../components/common/Feedback.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { authService } from '../services/authService.js'

export default function Register() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (authLoading) return null
  if (user) return <Navigate to="/dashboard" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    const cleanUsername = username.trim()
    if (cleanUsername.length < 3 || cleanUsername.length > 50 || !/^[A-Za-z0-9_.-]+$/.test(cleanUsername)) {
      setError('Username must be 3–50 characters and use only letters, numbers, dots, dashes, or underscores.'); return
    }
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setError('Enter a valid email address.'); return }
    if (password.length < 8 || password.length > 128) { setError('Password must be between 8 and 128 characters.'); return }
    if (password !== confirmPassword) { setError('The passwords do not match.'); return }
    setBusy(true)
    try {
      await authService.register({ username: cleanUsername, email: email.trim(), password })
      navigate('/login', { replace: true, state: { registered: true } })
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Could not create your account.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-[#f3f6fb] p-12 lg:flex xl:p-16">
        <div className="absolute -right-28 top-28 h-80 w-80 rounded-full border border-blue-100" /><div className="absolute -right-12 top-44 h-48 w-48 rounded-full border border-blue-100" />
        <Link to="/login" className="relative flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={21} /></span><span className="text-base font-bold tracking-tight text-ink">studyspace</span></Link>
        <div className="relative max-w-lg pb-6"><p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">Start with a fresh page</p><h1 className="mt-5 text-4xl font-semibold leading-[1.15] tracking-tight text-ink xl:text-5xl">Make room for the subjects you want to understand.</h1><p className="mt-5 max-w-md text-base leading-7 text-slate-600">Set up your workspace and organize your learning around the things that matter to you.</p></div>
        <p className="relative text-xs text-slate-400">Personal study workspace</p>
      </section>
      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-[420px]">
          <Link to="/login" className="mb-9 flex items-center justify-center gap-2.5 lg:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white"><BookOpen size={19} /></span><span className="text-base font-bold tracking-tight text-ink">studyspace</span></Link>
          <p className="text-sm font-medium text-brand-700">Get started</p><h2 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Create your account</h2><p className="mt-2 text-sm text-muted">A few details and your workspace is ready.</p>
          <div className="mt-6">{error && <ErrorMessage onDismiss={() => setError('')}>{error}</ErrorMessage>}</div>
          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <div><label htmlFor="username" className="field-label">Username</label><div className="relative"><UserRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"/><input id="username" autoComplete="username" maxLength={50} className="text-input pl-10" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Choose a username" /></div></div>
            <div><label htmlFor="register-email" className="field-label">Email address</label><input id="register-email" type="email" autoComplete="email" className="text-input" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
            <div><label htmlFor="register-password" className="field-label">Password</label><div className="relative"><input id="register-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="text-input pr-11" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters"/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
            <div><label htmlFor="confirm-password" className="field-label">Confirm password</label><input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" className="text-input" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Re-enter your password" /></div>
            <button className="primary-button mt-2 w-full py-3" disabled={busy}>{busy ? 'Creating account…' : <>Create account <ArrowRight size={16} /></>}</button>
          </form>
          <p className="mt-6 text-center text-sm text-muted">Already have an account? <Link to="/login" className="font-semibold text-brand-700 hover:text-brand-800">Sign in</Link></p>
        </div>
      </section>
    </main>
  )
}
