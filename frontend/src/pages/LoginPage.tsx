import { useState, type FormEvent } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { AlertCircle, UserRound, Lock, Loader2, Info } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const ERROR_MESSAGES: Record<string, string> = {
  USER_NOT_FOUND: 'Invalid username or password',
  INVALID_PASSWORD: 'Invalid username or password',
  ACCOUNT_DISABLED: 'This account has been disabled',
  ACCOUNT_LOCKED: 'This account is locked after too many failed attempts',
}

const SERVER_ERRORS = [
  'Network error. Please check your connection.',
  'Invalid server response',
  'Internal server error',
]

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(username.trim(), password)
    setLoading(false)
    if (result.success) {
      toast.success('Welcome back', { description: `Signed in as ${username.trim()}` })
      navigate('/dashboard', { replace: true })
    } else {
      setError(
        (result.error && ERROR_MESSAGES[result.error]) ||
          result.error ||
          'Login failed. Please try again.'
      )
    }
  }

  const showServerHint =
    import.meta.env.DEV && SERVER_ERRORS.includes(error || '')

  return (
    <div className="grid min-h-screen bg-dust-100 lg:grid-cols-2">
      {/* Left — branding panel with logo watermark */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary-500 p-12 lg:flex">
        <div className="absolute inset-x-0 top-0 h-1.5 bg-accent-500" />

        {/* Watermark */}
        <img
          src="/AH_Logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-24 -right-20 h-[560px] w-[560px] object-contain opacity-[0.07] select-none"
        />
        <img
          src="/AH_Logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -left-32 -top-28 h-96 w-96 rotate-12 object-contain opacity-[0.05] select-none"
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <img src="/AH_Logo.png" alt="ALTONS Hotel logo" className="h-11 w-11 object-contain" />
          <div className="leading-tight">
            <p className="font-display text-xl font-bold text-white">
              ALTONS<span className="text-accent-400">HOTEL</span>
            </p>
            <p className="text-xs text-primary-200">Management System</p>
          </div>
        </div>

        {/* Tagline */}
        <div className="relative max-w-md">
          <div className="mb-6 h-1 w-16 bg-accent-500" />
          <h2 className="font-display text-4xl font-bold leading-tight text-white">
            Welcome to
            <br />
            <span className="text-accent-400">ALTONS HOTEL</span>
          </h2>
          <p className="mt-4 text-primary-100">
            Manage rooms, guests, reservations, billing and staff — all in one
            place, from front desk to management.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-xs text-primary-300">
          &copy; {new Date().getFullYear()} ALTONS Hotel. All rights reserved.
        </p>
      </div>

      {/* Right — sign-in form */}
      <div className="relative flex items-center justify-center overflow-hidden p-6">
        {/* Mobile watermark */}
        <img
          src="/AH_Logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 -right-16 h-80 w-80 object-contain opacity-[0.06] select-none lg:hidden"
        />

        <div className="relative w-full max-w-sm animate-slide-up">
          {/* Compact branding (visible on all sizes) */}
          <div className="mb-8 text-center lg:text-left">
            <img
              src="/AH_Logo.png"
              alt="ALTONS Hotel logo"
              className="mx-auto mb-3 h-16 w-16 rounded-xl object-contain shadow-card ring-1 ring-dust-300 lg:mx-0"
            />
            <h1 className="font-display text-2xl font-bold text-primary-500">
              ALTONS<span className="text-accent-600">HOTEL</span>
            </h1>
            <p className="mt-1 text-sm text-steel-600">
              Sign in to the management system
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 animate-fade-in">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {showServerHint && (
              <div className="flex items-start gap-2 rounded-lg border border-accent-500/40 bg-accent-50 p-3 text-xs text-accent-800 animate-fade-in">
                <Info className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  API server not detected — run{' '}
                  <code className="rounded bg-white/70 px-1 py-0.5 font-mono">
                    npm run dev
                  </code>{' '}
                  from the project root (not just{' '}
                  <code className="rounded bg-white/70 px-1 py-0.5 font-mono">
                    frontend/
                  </code>
                  ).
                </span>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
                <Input
                  id="username"
                  type="text"
                  className="pl-9"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-steel-400" />
                <Input
                  id="password"
                  type="password"
                  className="pl-9"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Your password"
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            {import.meta.env.DEV && (
              <p className="pt-2 text-center text-xs text-steel-500">
                Dev credentials: <span className="font-medium">admin</span> /{' '}
                <span className="font-medium">Admin123!</span>
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
