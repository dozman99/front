import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Ban, Settings, ShieldCheck, ExternalLink } from 'lucide-react'
import { useAuthStore, useEffectiveRole } from '../../store/authStore'
import { initials } from '../../lib/utils'

const navItem =
  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors border-l-2 border-transparent'

export default function Sidebar() {
  const user = useAuthStore((s) => s.user)
  const role = useEffectiveRole()
  const isAdmin = role === 'admin'

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 font-bold text-white shadow-lg shadow-blue-900/40">
          S
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-[var(--color-text)]">SAS Relay</p>
          <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            SMS Gateway
          </p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        <Item to="/dashboard" icon={<LayoutDashboard size={17} />} label="Dashboard" />
        <Item to="/ban-list" icon={<Ban size={17} />} label="Ban List" />
        {isAdmin && (
          <Item to="/settings" icon={<Settings size={17} />} label="Settings" />
        )}
        <a
          href="/check"
          target="_blank"
          rel="noreferrer"
          className={`${navItem} text-[var(--color-muted)] hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-text)]`}
        >
          <ShieldCheck size={17} />
          <span className="flex-1">Status Check</span>
          <ExternalLink size={13} />
        </a>
      </nav>

      {user && (
        <div className="m-2 flex items-center gap-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--color-accent)]/20 text-xs font-semibold text-blue-300">
            {initials(user.name)}
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-xs font-medium text-[var(--color-text)]">
              {user.name}
            </p>
            <span
              className={`text-[10px] font-medium ${
                role === 'admin' ? 'text-green-400' : 'text-blue-400'
              }`}
            >
              {role === 'admin' ? 'Admin' : 'Helpdesk'}
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}

function Item({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${navItem} ${
          isActive
            ? 'border-l-[var(--color-accent)] bg-[var(--color-accent)]/10 text-[var(--color-text)]'
            : 'text-[var(--color-muted)] hover:bg-[var(--color-accent)]/5 hover:text-[var(--color-text)]'
        }`
      }
    >
      {icon}
      <span>{label}</span>
    </NavLink>
  )
}
