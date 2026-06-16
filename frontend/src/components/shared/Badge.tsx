import type { EntityStatus } from '../../lib/utils'

const MAP: Record<
  EntityStatus,
  { label: string; bg: string; border: string; dot: string; text: string }
> = {
  banned: {
    label: 'Banned',
    bg: 'bg-red-500/10',
    border: 'border-red-500/40',
    dot: 'bg-[var(--color-critical)]',
    text: 'text-red-300',
  },
  temp_ban: {
    label: 'Temp Ban',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/40',
    dot: 'bg-[var(--color-warning)]',
    text: 'text-amber-300',
  },
  active: {
    label: 'Active',
    bg: 'bg-green-500/10',
    border: 'border-green-500/40',
    dot: 'bg-[var(--color-safe)]',
    text: 'text-green-300',
  },
  opt_out: {
    label: 'Opt-Out',
    bg: 'bg-slate-500/10',
    border: 'border-slate-500/40',
    dot: 'bg-slate-400',
    text: 'text-slate-300',
  },
  expired: {
    label: 'Expired',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/40',
    dot: 'bg-[var(--color-purple)]',
    text: 'text-violet-300',
  },
}

export default function Badge({ status }: { status: EntityStatus }) {
  const s = MAP[status]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.bg} ${s.border} ${s.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  )
}
