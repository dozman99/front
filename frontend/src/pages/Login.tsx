import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { LayoutGrid } from 'lucide-react'
import { samlLogin, devLogin } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import type { Role } from '../types'

const IS_DEV = import.meta.env.VITE_ENVIRONMENT === 'development'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [devRole, setDevRole] = useState<Role>('admin')
  const navigate = useNavigate()
  const qc = useQueryClient()

  async function signIn() {
    setLoading(true)
    setError(false)
    try {
      if (IS_DEV) {
        const user = await devLogin(devRole)
        qc.setQueryData(['me'], user)
        useAuthStore.getState().setUser(user)
        useAuthStore.getState().setLoading(false)
        navigate('/dashboard', { replace: true })
      } else {
        const { redirect_url } = await samlLogin()
        setTimeout(() => { window.location.href = redirect_url }, 1200)
      }
    } catch {
      setLoading(false)
      setError(true)
    }
  }

  return (
    <div className="bg-glow grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-8 shadow-2xl shadow-black/50">
          <div className="flex flex-col items-center text-center">
            <div className="grid h-14 w-14 place-items-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-2xl font-bold text-white shadow-lg shadow-blue-900/50">
              S
            </div>
            <h1 className="mt-4 text-xl font-bold text-[var(--color-text)]">SAS Relay</h1>
            <p className="text-sm text-[var(--color-muted)]">SMS Gateway Portal</p>
          </div>

          {error && (
            <div className="mt-6 rounded-md border border-red-500/40 bg-red-500/10 p-3 text-center text-sm text-red-300">
              {IS_DEV
                ? 'Dev login failed — is the backend running on port 8000?'
                : 'Your account is not in an authorized group. Contact your administrator.'}
            </div>
          )}

          {IS_DEV && (
            <div className="mt-6 rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="mb-2 text-center text-xs font-medium text-amber-300">Dev Mode — select role</p>
              <div className="flex gap-2">
                {(['admin', 'helpdesk'] as Role[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setDevRole(r)}
                    className={`flex-1 rounded-md border py-1.5 text-xs font-medium capitalize transition ${
                      devRole === r
                        ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                        : 'border-[var(--color-border)] text-[var(--color-muted)]'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={signIn}
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-900/40 transition hover:shadow-blue-700/50 hover:brightness-110 disabled:opacity-70"
          >
            {loading ? (
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <>
                <LayoutGrid size={17} />
                {IS_DEV ? `Sign in as ${devRole}` : 'Sign in with Microsoft'}
              </>
            )}
          </button>

          <p className="mt-4 text-center text-xs text-[var(--color-muted)]">
            {IS_DEV ? 'Development mode — no SSO required' : 'Access restricted to WVT authorized AD groups'}
          </p>
        </div>
      </div>
    </div>
  )
}
