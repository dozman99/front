import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { PhoneOff, Mail, Clock, UserMinus, AlertTriangle, CheckCircle2, ShieldAlert, TrendingUp } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import { formatNumber, relativeTime } from '../lib/utils'
import { getStats, getIncidents, getActivity } from '../api/dashboard'

export interface BanListNavState {
  tab?: 'phones' | 'emails'
  status?: string
  search?: string
}

export default function Dashboard() {
  return (
    <>
      <TopBar title="Dashboard" />
      <main className="flex-1 overflow-y-auto p-5 space-y-4">
        <StatsRow />
        <Incidents />
        <Activity />
      </main>
    </>
  )
}

/* ── Stats ────────────────────────────────────────────────────────────────── */

function StatsRow() {
  const { data: s } = useQuery({ queryKey: ['dashboard', 'stats'], queryFn: getStats })

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <StatCard
        color="var(--color-critical)" label="Banned Phones" icon={PhoneOff}
        value={s?.banned_phones ?? 0} today={s?.banned_phones_today}
        to={{ tab: 'phones', status: 'banned' }}
      />
      <StatCard
        color="var(--color-critical)" label="Banned Apps" icon={Mail}
        value={s?.banned_apps ?? 0} today={s?.banned_apps_today}
        to={{ tab: 'emails', status: 'banned' }}
      />
      <StatCard
        color="var(--color-warning)" label="Expiring Today" icon={Clock}
        value={s?.temp_expiring_today ?? 0} today={s?.temp_bans_today}
        to={{ tab: 'phones', status: 'temp' }}
      />
      <StatCard
        color="var(--color-accent)" label="Opt-Outs" icon={UserMinus}
        value={s?.opt_outs ?? 0} today={s?.opt_outs_today}
        to={{ tab: 'phones', status: 'optout' }}
      />
    </div>
  )
}

function StatCard({
  color, label, value, icon: Icon, to, today,
}: {
  color: string
  label: string
  value: number
  icon: React.ElementType
  to: BanListNavState
  today?: number
}) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate('/ban-list', { state: to })}
      style={{ borderTopColor: color, borderTopWidth: 2 }}
      className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 flex items-center gap-3 transition hover:brightness-110"
    >
      <div
        className="shrink-0 rounded-md p-2"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)` }}
      >
        <Icon size={16} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-muted)] leading-none mb-1">{label}</p>
        <p className="mono text-2xl font-bold text-[var(--color-text)] leading-none">{formatNumber(value)}</p>
        {today !== undefined && (
          <p className="text-[11px] mt-1 flex items-center gap-0.5" style={{ color: today > 0 ? color : 'var(--color-muted)' }}>
            {today > 0 ? <><TrendingUp size={10} /> +{today} today</> : 'no change today'}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Incidents ────────────────────────────────────────────────────────────── */

const SEV_COLOR: Record<string, string> = {
  critical: 'var(--color-critical)',
  warning:  'var(--color-warning)',
  info:     'var(--color-accent)',
}

const SEV_BORDER: Record<string, string> = {
  critical: 'border-l-[var(--color-critical)]',
  warning:  'border-l-[var(--color-warning)]',
  info:     'border-l-[var(--color-accent)]',
}

function Incidents() {
  const navigate = useNavigate()
  const { data: incidents = [] } = useQuery({
    queryKey: ['dashboard', 'incidents'],
    queryFn: getIncidents,
  })

  if (incidents.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2.5 text-sm text-[var(--color-muted)]">
        <CheckCircle2 size={14} className="text-[var(--color-safe)] shrink-0" />
        All clear — nothing needs attention right now.
      </div>
    )
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5">
        <ShieldAlert size={14} className="text-[var(--color-warning)]" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">
          Needs Attention
        </h2>
        <span className="ml-1 rounded-full bg-[var(--color-warning)]/15 px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-warning)]">
          {incidents.length}
        </span>
      </div>
      <div className="divide-y divide-[var(--color-border)]">
        {incidents.map((inc, i) => {
          const color = SEV_COLOR[inc.severity] ?? SEV_COLOR.info
          const clickable = inc.entity !== 'System'
          return (
            <div
              key={i}
              onClick={() => clickable && navigate('/ban-list', { state: { tab: 'phones', search: inc.entity } })}
              className={`flex items-center gap-3 border-l-4 px-4 py-2.5 transition hover:bg-[var(--color-surface)] ${SEV_BORDER[inc.severity] ?? SEV_BORDER.info} ${clickable ? 'cursor-pointer' : ''}`}
            >
              <AlertTriangle size={14} className="shrink-0" style={{ color }} />
              <span className="mono text-sm font-medium text-[var(--color-text)] shrink-0">{inc.entity}</span>
              <span className="text-sm text-[var(--color-muted)] truncate">{inc.detail}</span>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ── Recent Activity ──────────────────────────────────────────────────────── */

const ACTION_LABEL: Record<string, string> = {
  BAN:           'Banned',
  TEMP_BAN:      'Temp Banned',
  UNBAN:         'Unbanned',
  OPT_IN:        'Opted In',
  OPT_OUT:       'Opted Out',
  ADDED:         'Added',
  REMOVED:       'Removed',
  ACTIVATE:      'Activated',
  GROUP_ADDED:   'Group Added',
  GROUP_REMOVED: 'Group Removed',
}

function formatAction(action: string): string {
  return ACTION_LABEL[action] ?? action.replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase())
}

function actionColor(action: string): string {
  const a = action.toLowerCase()
  if (a.includes('unban') || a === 'activate') return 'var(--color-safe)'
  if (a.includes('temp'))                       return 'var(--color-warning)'
  if (a.includes('opt'))                        return '#94a3b8'
  if (a.includes('ban'))                        return 'var(--color-critical)'
  return 'var(--color-accent)'
}

const TIME_FILTERS = [
  { label: '1h',  hours: 1 },
  { label: '24h', hours: 24 },
  { label: '7d',  hours: 24 * 7 },
  { label: 'All', hours: undefined },
] as const

function Activity() {
  const navigate = useNavigate()
  const [hours, setHours] = useState<number | undefined>(24 * 7)

  const { data: rows = [] } = useQuery({
    queryKey: ['dashboard', 'activity', hours],
    queryFn: () => getActivity(hours),
  })

  function handleRowClick(entity_type: string, entity: string) {
    if (entity_type === 'group' || entity_type === 'rule') return
    navigate('/ban-list', { state: { tab: entity_type === 'email' ? 'emails' : 'phones', search: entity } })
  }

  return (
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2.5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--color-muted)]">Recent Activity</h2>
        <div className="flex gap-1">
          {TIME_FILTERS.map(({ label, hours: h }) => (
            <button
              key={label}
              onClick={() => setHours(h)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition ${
                hours === h
                  ? 'bg-[var(--color-accent)]/15 text-blue-300'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="px-4 py-4 text-sm text-[var(--color-muted)]">No activity in this window.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-[11px] uppercase tracking-wide text-[var(--color-muted)]">
                <th className="px-4 py-2">Entity</th>
                <th className="px-4 py-2">Action</th>
                <th className="px-4 py-2">By</th>
                <th className="px-4 py-2 text-right">When</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {rows.map((a) => {
                const color = actionColor(a.action)
                const clickable = a.entity_type === 'phone' || a.entity_type === 'email'
                return (
                  <tr
                    key={a.id}
                    onClick={() => handleRowClick(a.entity_type, a.entity)}
                    className={`transition hover:bg-[var(--color-surface)] ${clickable ? 'cursor-pointer' : ''}`}
                  >
                    <td className="mono px-4 py-2.5 text-[var(--color-text)] max-w-[220px] truncate">{a.entity}</td>
                    <td className="px-4 py-2.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap"
                        style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                      >
                        {formatAction(a.action)}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--color-muted)] max-w-[140px] truncate">{a.actor}</td>
                    <td className="px-4 py-2.5 text-right text-xs text-[var(--color-muted)] whitespace-nowrap">{relativeTime(a.performed_at)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
