import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Sidebar from '../components/layout/Sidebar'

// Requires an authenticated session. adminOnly additionally requires the real
// admin role (a helpdesk user cannot reach admin routes by URL).
export function ProtectedRoute({ adminOnly = false }: { adminOnly?: boolean }) {
  const role = useAuthStore((s) => s.role)
  const loading = useAuthStore((s) => s.loading)

  if (loading) {
    return (
      <div className="grid h-screen place-items-center bg-[var(--color-bg)] text-[var(--color-muted)]">
        Loading…
      </div>
    )
  }
  if (!role) return <Navigate to="/login" replace />
  if (adminOnly && role !== 'admin') return <Navigate to="/dashboard" replace />
  return <Outlet />
}

// Shared chrome (sidebar) for the authenticated app. TopBar is rendered per
// page so each page owns its title.
export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
