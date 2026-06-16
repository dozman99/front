import { create } from 'zustand'
import type { AuthUser, Role } from '../types'

interface AuthState {
  user: AuthUser | null
  role: Role | null
  // viewAsRole lets an admin preview the Helpdesk experience without losing
  // their real role. Effective role used for gating = viewAsRole ?? role.
  viewAsRole: Role | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setViewAs: (role: Role | null) => void
  setLoading: (loading: boolean) => void
  clear: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  viewAsRole: null,
  loading: true,
  setUser: (user) => set({ user, role: user?.role ?? null }),
  setViewAs: (viewAsRole) => set({ viewAsRole }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, role: null, viewAsRole: null }),
}))

// Effective role for UI gating. An admin previewing as helpdesk is gated as
// helpdesk; the real role still governs actual API authorization server-side.
export function useEffectiveRole(): Role | null {
  return useAuthStore((s) => s.viewAsRole ?? s.role)
}

export function useIsAdmin(): boolean {
  return useAuthStore((s) => (s.viewAsRole ?? s.role) === 'admin')
}
