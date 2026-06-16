import { formatDateTime } from '../../lib/utils'

export interface TimelineEvent {
  action: string
  date: string | null
  reason: string | null
  actor: string | null
  // Human actions render a solid dot; system actions a hollow one.
  system?: boolean
  color: string
}

export default function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-[var(--color-muted)]">No history recorded.</p>
    )
  }
  return (
    <ol className="relative ml-1 border-l border-[var(--color-border)] pl-5">
      {events.map((e, i) => (
        <li key={i} className="relative pb-5 last:pb-0">
          <span
            className="absolute -left-[26px] top-1 h-3 w-3 rounded-full border-2"
            style={{
              borderColor: e.color,
              backgroundColor: e.system ? 'transparent' : e.color,
            }}
            aria-hidden
          />
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-semibold" style={{ color: e.color }}>
              {e.action}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              {formatDateTime(e.date)}
            </span>
          </div>
          {e.reason && (
            <p className="mt-0.5 text-sm text-[var(--color-text)]">
              &ldquo;{e.reason}&rdquo;
            </p>
          )}
          {e.actor && (
            <p className="mt-0.5 text-xs text-[var(--color-muted)]">
              by {e.actor}
            </p>
          )}
        </li>
      ))}
    </ol>
  )
}
