import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/useAuth'
import { ApiError } from '../api/client'

const INPUT =
  'mt-1.5 mb-4 w-full rounded-lg border border-bd bg-card px-3 py-2.5 text-sm outline-none transition focus:border-ac focus:ring-4 focus:ring-ac/15'

export function LoginPage() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ email, password })
    } catch (err) {
      setError(err instanceof ApiError && err.status === 422 ? 'Check your email and password.' : 'Could not sign in. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-[1.1fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-linear-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-12 text-white md:flex md:flex-col md:justify-between">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-32 -left-16 size-96 rounded-full bg-black/10 blur-2xl" />
        <div className="relative flex items-center gap-2.5">
          <span className="grid size-10 place-items-center rounded-xl bg-white/20 text-base font-bold backdrop-blur">T</span>
          <span className="text-xl font-semibold tracking-tight">Tracker</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="text-4xl leading-tight font-bold tracking-tight">Plan, track and deliver every project.</h1>
          <p className="mt-4 text-white/80">
            Follow each POC from fact finding to CFA paper, keep billing on schedule and keep the whole team in step.
          </p>
        </div>
        <p className="relative text-sm text-white/70">Pepper Labs Sdn Bhd</p>
      </aside>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 md:hidden">
            <span className="grid size-9 place-items-center rounded-xl bg-linear-to-br from-indigo-500 to-violet-600 text-sm font-bold text-white">
              T
            </span>
            <span className="text-lg font-semibold tracking-tight">Tracker</span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="mt-1 mb-7 text-sm text-mu">Sign in with your work email.</p>

          <label htmlFor="email" className="text-sm font-medium">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={INPUT}
          />

          <label htmlFor="password" className="text-sm font-medium">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={INPUT}
          />

          {error && (
            <p role="alert" className="mb-4 rounded-lg bg-s2/10 px-3 py-2 text-sm text-s2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full cursor-pointer rounded-lg bg-ac px-4 py-2.5 font-medium text-white shadow-pop transition hover:brightness-110 disabled:opacity-60"
          >
            {submitting ? 'Signing in…' : 'Log in'}
          </button>
          <p className="mt-5 text-center text-xs text-mu">Accounts are created by an admin invitation. Public sign-up is off.</p>
        </form>
      </div>
    </div>
  )
}
