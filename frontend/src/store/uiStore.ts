import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  type: ToastType
  message: string
}

interface UiState {
  toasts: Toast[]
  pushToast: (type: ToastType, message: string) => void
  dismissToast: (id: number) => void
}

let toastSeq = 1

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  pushToast: (type, message) => {
    const id = toastSeq++
    set((s) => ({ toasts: [...s.toasts, { id, type, message }] }))
    // Auto-dismiss after 3s (Runbook §2 toast spec).
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  dismissToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))

// Convenience hook for firing toasts.
export function useToast() {
  return useUiStore((s) => s.pushToast)
}
