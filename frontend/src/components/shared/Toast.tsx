import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useUiStore, type ToastType } from '../../store/uiStore'

const STYLE: Record<ToastType, { border: string; icon: typeof Info; color: string }> = {
  success: { border: 'border-l-[var(--color-safe)]', icon: CheckCircle2, color: 'text-green-400' },
  error: { border: 'border-l-[var(--color-critical)]', icon: XCircle, color: 'text-red-400' },
  info: { border: 'border-l-[var(--color-accent)]', icon: Info, color: 'text-blue-400' },
}

export default function ToastHost() {
  const toasts = useUiStore((s) => s.toasts)
  const dismiss = useUiStore((s) => s.dismissToast)

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {toasts.map((t) => {
        const s = STYLE[t.type]
        const Icon = s.icon
        return (
          <div
            key={t.id}
            role="status"
            className={`animate-toast-in flex items-start gap-3 rounded-lg border border-[var(--color-border)] border-l-4 ${s.border} bg-[var(--color-card)] p-3 shadow-lg shadow-black/40`}
          >
            <Icon size={18} className={`mt-0.5 shrink-0 ${s.color}`} />
            <p className="flex-1 text-sm text-[var(--color-text)]">{t.message}</p>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-[var(--color-muted)] hover:text-[var(--color-text)]"
              aria-label="Dismiss"
            >
              <X size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
