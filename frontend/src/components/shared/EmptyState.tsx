import { Inbox } from 'lucide-react'

interface Props {
  message: string
  onClear?: () => void
}

export default function EmptyState({ message, onClear }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="rounded-full bg-[var(--color-surface)] p-4">
        <Inbox size={28} className="text-[var(--color-muted)]" />
      </div>
      <p className="max-w-xs text-sm text-[var(--color-muted)]">{message}</p>
      {onClear && (
        <button
          onClick={onClear}
          className="rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          Clear filters
        </button>
      )}
    </div>
  )
}
