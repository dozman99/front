import { useNavigate } from 'react-router-dom'
import { Eye, LogOut } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../../store/uiStore'
import { logout } from '../../api/auth'

export default function TopBar({ title }: { title: string }) {
  const navigate = useNavigate()
  const toast = useToast()
  const realRole = useAuthStore((s) => s.role)
  const viewAsRole = useAuthStore((s) => s.viewAsRole)
  const setViewAs = useAuthStore((s) => s.setViewAs)
  const clear = useAuthStore((s) => s.clear)

  const effective = viewAsRole ?? realRole

  async function handleSignOut() {
    try {
      await logout()
    } catch {
      /* clear locally regardless */
    }
    clear()
    navigate('/login', { replace: true })
  }

  function toggleViewAs() {
    const next = effective === 'admin' ? 'helpdesk' : 'admin'
    // Only an admin can preview; reset to null when back to real role.
    setViewAs(next === realRole ? null : next)
    toast('info', `Previewing as ${next === 'admin' ? 'Admin' : 'Helpdesk'}`)
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-5">
      <h1 className="text-lg font-bold text-[var(--color-text)]">{title}</h1>
      <div className="flex items-center gap-2">
        {realRole === 'admin' && (
          <button
            onClick={toggleViewAs}
            className={`flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              viewAsRole
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-blue-300'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            <Eye size={14} />
            View as {effective === 'admin' ? 'Helpdesk' : 'Admin'}
          </button>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-[var(--color-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </header>
  )
}
