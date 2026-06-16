import type { ReactNode } from 'react'
import { useIsAdmin } from '../../store/authStore'

// Renders children only for admins. Used to gate write actions so they are
// NOT rendered at all for helpdesk (Runbook §5 — do not just hide).
export default function RoleGuard({ children }: { children: ReactNode }) {
  const isAdmin = useIsAdmin()
  if (!isAdmin) return null
  return <>{children}</>
}
