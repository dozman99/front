// Formatters and small helpers shared across the app.

export function formatNumber(n: number | null | undefined): string {
  if (n === null || n === undefined) return '0'
  return n.toLocaleString('en-US')
}

// "3m ago", "2h ago", "5d ago". Falls back to a date for older items.
function toUtc(iso: string): string {
  return iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z'
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const then = new Date(toUtc(iso)).getTime()
  if (Number.isNaN(then)) return '—'
  const diff = Date.now() - then
  const sec = Math.round(diff / 1000)
  if (sec < 60) return `${sec}s ago`
  const min = Math.round(sec / 60)
  if (min < 60) return `${min}m ago`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h ago`
  const day = Math.round(hr / 24)
  if (day < 30) return `${day}d ago`
  return new Date(iso).toLocaleDateString('en-US')
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(toUtc(iso))
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// For min datetime-local value: now + 1 hour, in the format the input expects.
export function minExpiryLocal(): string {
  const d = new Date(Date.now() + 60 * 60 * 1000)
  const pad = (x: number) => String(x).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`
}

export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export function classNames(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

// Derive a display status from a record for badge rendering.
export type EntityStatus = 'banned' | 'temp_ban' | 'active' | 'opt_out' | 'expired'

export function phoneStatus(r: {
  banned: boolean
  temp_ban: boolean
  opt_out?: boolean
  date_ban_expire?: string | null
}): EntityStatus {
  if (r.opt_out) return 'opt_out'
  if (r.temp_ban) {
    if (r.date_ban_expire && new Date(r.date_ban_expire).getTime() < Date.now())
      return 'expired'
    return 'temp_ban'
  }
  if (r.banned) return 'banned'
  return 'active'
}

export function emailStatus(r: {
  banned: boolean
  temp_ban: boolean
  date_ban_expire?: string | null
}): EntityStatus {
  return phoneStatus(r)
}
