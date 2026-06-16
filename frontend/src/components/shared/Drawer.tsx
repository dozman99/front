import { X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: ReactNode
  children: ReactNode
}

// Right-side drawer. Clicking the backdrop intentionally does NOT close it
// (prevents accidental dismissal mid ban-flow, Runbook §1 Prompt 3). Only the
// X button closes.
export default function Drawer({ open, onClose, title, children }: Props) {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        className="animate-drawer-in absolute right-0 top-0 flex h-full w-[400px] max-w-full flex-col border-l border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl shadow-black/60"
      >
        <header className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
          <div className="min-w-0 flex-1">{title}</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="ml-2 shrink-0 rounded-md p-1 text-[var(--color-muted)] hover:bg-[var(--color-card)] hover:text-[var(--color-text)]"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </aside>
    </div>
  )
}
