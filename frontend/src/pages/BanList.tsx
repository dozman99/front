import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'react-router-dom'
import { Plus, Search } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import RoleGuard from '../components/layout/RoleGuard'
import Badge from '../components/shared/Badge'
import Drawer from '../components/shared/Drawer'
import EmptyState from '../components/shared/EmptyState'
import BanForm from '../components/shared/BanForm'
import UnbanForm from '../components/shared/UnbanForm'
import Timeline, { type TimelineEvent } from '../components/shared/Timeline'
import { useIsAdmin } from '../store/authStore'
import { useToast } from '../store/uiStore'
import { usePhones } from '../hooks/usePhones'
import { useEmails } from '../hooks/useEmails'
import { usePhoneMessages, useEmailMessages } from '../hooks/useMessages'
import {
  banPhone,
  activatePhone,
  type BanBody,
} from '../api/phones'
import { banEmail, unbanEmail } from '../api/emails'
import {
  formatNumber,
  relativeTime,
  formatDateTime,
  phoneStatus,
  emailStatus,
  classNames,
} from '../lib/utils'
import type { PhoneRecord, EmailRecord } from '../types'
import type { BanListNavState } from './Dashboard'

type Tab = 'phones' | 'emails'

const STATUS_TO_PHONE_FILTER: Record<string, PhoneFilter> = {
  banned: 'Banned', temp: 'Temp', active: 'Active', optout: 'Opt-Out',
}
const STATUS_TO_EMAIL_FILTER: Record<string, EmailFilter> = {
  banned: 'Banned', temp: 'Temp', active: 'Active',
}

export default function BanList() {
  const location = useLocation()
  const nav = (location.state ?? {}) as BanListNavState
  const [tab, setTab] = useState<Tab>(nav.tab ?? 'phones')

  return (
    <>
      <TopBar title="Ban List" />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="mb-5 flex gap-1 border-b border-[var(--color-border)]">
          <button onClick={() => setTab('phones')} className={tabClass(tab === 'phones')}>
            Phone Numbers
          </button>
          <button onClick={() => setTab('emails')} className={tabClass(tab === 'emails')}>
            Email Addresses
          </button>
        </div>
        {tab === 'phones'
          ? <PhonesTab initialFilter={STATUS_TO_PHONE_FILTER[nav.status ?? '']} initialSearch={nav.search} />
          : <EmailsTab initialFilter={STATUS_TO_EMAIL_FILTER[nav.status ?? '']} initialSearch={nav.search} />
        }
      </main>
    </>
  )
}

function tabClass(active: boolean) {
  return classNames(
    '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition',
    active
      ? 'border-[var(--color-accent)] text-[var(--color-text)]'
      : 'border-transparent text-[var(--color-muted)] hover:text-[var(--color-text)]'
  )
}

/* ---------------- PHONES TAB ---------------- */

const PHONE_FILTERS = ['All', 'Banned', 'Temp', 'Active', 'Opt-Out'] as const
type PhoneFilter = (typeof PHONE_FILTERS)[number]

function PhonesTab({ initialFilter, initialSearch }: { initialFilter?: PhoneFilter; initialSearch?: string }) {
  const isAdmin = useIsAdmin()
  const [filter, setFilter] = useState<PhoneFilter>(initialFilter ?? 'All')
  const [search, setSearch] = useState(initialSearch ?? '')
  const [active, setActive] = useState<PhoneRecord | null>(null)

  const statusParam =
    filter === 'Banned'
      ? 'banned'
      : filter === 'Temp'
        ? 'temp'
        : filter === 'Active'
          ? 'active'
          : filter === 'Opt-Out'
            ? 'optout'
            : undefined

  const { data } = usePhones({ status: statusParam, search, limit: 200 })
  const rows = data?.results ?? []

  return (
    <div className="space-y-4">
      <Controls
        filters={PHONE_FILTERS as readonly string[]}
        active={filter}
        onFilter={(f) => setFilter(f as PhoneFilter)}
        search={search}
        onSearch={setSearch}
        placeholder="Search phone numbers…"
        canAdd={isAdmin}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="No phone numbers match this filter."
          onClear={() => {
            setFilter('All')
            setSearch('')
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                <th className="px-4 py-2.5">Phone Number</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Attempted</th>
                <th className="px-4 py-2.5">Auto Ban</th>
                <th className="px-4 py-2.5">Last Msg Attempt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.phone_number}
                  onClick={() => setActive(r)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent)]/5"
                >
                  <td className="mono max-w-[180px] truncate px-4 py-3 text-[var(--color-text)]">
                    {r.phone_number}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={phoneStatus(r)} />
                  </td>
                  <td className="mono px-4 py-3 text-[var(--color-text)]">
                    {formatNumber(r.msg_attempts)}
                  </td>
                  <td
                    className={classNames(
                      'mono px-4 py-3',
                      r.auto_temp_ban_count > 2 ? 'text-amber-400' : 'text-[var(--color-text)]'
                    )}
                  >
                    {r.auto_temp_ban_count}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {relativeTime(r.last_msg_attempt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <PhoneDrawer record={active} onClose={() => setActive(null)} onRefresh={setActive} />
      )}
    </div>
  )
}

/* ---------------- EMAILS TAB ---------------- */

const EMAIL_FILTERS = ['All', 'Banned', 'Temp', 'Active'] as const
type EmailFilter = (typeof EMAIL_FILTERS)[number]

function EmailsTab({ initialFilter, initialSearch }: { initialFilter?: EmailFilter; initialSearch?: string }) {
  const isAdmin = useIsAdmin()
  const [filter, setFilter] = useState<EmailFilter>(initialFilter ?? 'All')
  const [search, setSearch] = useState(initialSearch ?? '')
  const [active, setActive] = useState<EmailRecord | null>(null)

  const statusParam =
    filter === 'Banned'
      ? 'banned'
      : filter === 'Temp'
        ? 'temp'
        : filter === 'Active'
          ? 'active'
          : undefined

  const { data } = useEmails({ status: statusParam, search, limit: 200 })
  const rows = data?.results ?? []

  return (
    <div className="space-y-4">
      <Controls
        filters={EMAIL_FILTERS as readonly string[]}
        active={filter}
        onFilter={(f) => setFilter(f as EmailFilter)}
        search={search}
        onSearch={setSearch}
        placeholder="Search email addresses…"
        canAdd={isAdmin}
      />

      {rows.length === 0 ? (
        <EmptyState
          message="No email addresses match this filter."
          onClear={() => {
            setFilter('All')
            setSearch('')
          }}
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                <th className="px-4 py-2.5">Email Address</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Attempted</th>
                <th className="px-4 py-2.5">Last Msg Attempt</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.email_address}
                  onClick={() => setActive(r)}
                  className="cursor-pointer border-b border-[var(--color-border)] last:border-0 hover:bg-[var(--color-accent)]/5"
                >
                  <td className="mono max-w-[220px] truncate px-4 py-3 text-[var(--color-text)]">
                    {r.email_address}
                  </td>
                  <td className="px-4 py-3">
                    <Badge status={emailStatus(r)} />
                  </td>
                  <td className="mono px-4 py-3 text-[var(--color-text)]">
                    {formatNumber(r.msg_attempts)}
                  </td>
                  <td className="px-4 py-3 text-[var(--color-muted)]">
                    {relativeTime(r.last_msg_attempt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {active && (
        <EmailDrawer record={active} onClose={() => setActive(null)} onRefresh={setActive} />
      )}
    </div>
  )
}

/* ---------------- Shared controls ---------------- */

function Controls({
  filters,
  active,
  onFilter,
  search,
  onSearch,
  placeholder,
  canAdd,
}: {
  filters: readonly string[]
  active: string
  onFilter: (f: string) => void
  search: string
  onSearch: (s: string) => void
  placeholder: string
  canAdd: boolean
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilter(f)}
            className={classNames(
              'rounded-full border px-3 py-1 text-xs font-medium transition',
              active === f
                ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10 text-blue-300'
                : 'border-[var(--color-border)] text-[var(--color-muted)] hover:text-[var(--color-text)]'
            )}
          >
            {f}
          </button>
        ))}
      </div>
      <div className="relative ml-auto">
        <Search
          size={15}
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-muted)]"
        />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder={placeholder}
          className="mono w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] py-1.5 pl-8 pr-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>
      {canAdd && (
        <button className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110">
          <Plus size={15} /> Add Ban
        </button>
      )}
    </div>
  )
}

/* ---------------- Phone Drawer ---------------- */

type DrawerTab = 'info' | 'messages'

function PhoneDrawer({
  record,
  onClose,
  onRefresh,
}: {
  record: PhoneRecord
  onClose: () => void
  onRefresh: (r: PhoneRecord) => void
}) {
  const isAdmin = useIsAdmin()
  const qc = useQueryClient()
  const toast = useToast()
  const [dtab, setDtab] = useState<DrawerTab>('info')
  const [mode, setMode] = useState<'view' | 'ban' | 'activate'>('view')
  const [err, setErr] = useState<string | null>(null)

  const messages = usePhoneMessages(record.phone_number, dtab === 'messages')

  const banMut = useMutation({
    mutationFn: (body: BanBody) => banPhone(record.phone_number, body),
    onSuccess: (updated) => {
      toast('success', 'Phone banned')
      invalidate()
      onRefresh(updated)
      setMode('view')
    },
    onError: () => setErr('Ban failed. Try again.'),
  })

  const activateMut = useMutation({
    mutationFn: (reason: string) => activatePhone(record.phone_number, reason),
    onSuccess: (updated) => {
      toast('success', 'Number activated')
      invalidate()
      onRefresh(updated)
      setMode('view')
    },
    onError: () => setErr('Activate failed. Try again.'),
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['phones'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <div>
          <p className="mono truncate text-sm font-semibold text-[var(--color-text)]">
            {record.phone_number}
          </p>
          <div className="mt-1">
            <Badge status={phoneStatus(record)} />
          </div>
        </div>
      }
    >
      <InnerTabs tab={dtab} setTab={setDtab} />

      {dtab === 'info' && (
        <div className="space-y-5">
          <Stats
            items={[
              ['Attempted', formatNumber(record.msg_attempts)],
              ['Auto Bans', String(record.auto_temp_ban_count)],
              ['Last Msg Attempt', relativeTime(record.last_msg_attempt)],
            ]}
          />

          <RoleGuard>
            {mode === 'view' && (
              <div className="flex flex-wrap gap-2">
                {!record.opt_out && !record.banned && !record.temp_ban && (
                  <ActionBtn onClick={() => { setErr(null); setMode('ban') }}>Ban</ActionBtn>
                )}
                {(record.opt_out || record.banned || record.temp_ban) && (
                  <ActionBtn green onClick={() => { setErr(null); setMode('activate') }}>
                    Activate
                  </ActionBtn>
                )}
              </div>
            )}
            {mode === 'ban' && (
              <BanForm
                submitting={banMut.isPending}
                error={err}
                onCancel={() => setMode('view')}
                onSubmit={async (b) => { banMut.mutate(b) }}
              />
            )}
            {mode === 'activate' && (
              <UnbanForm
                submitting={activateMut.isPending}
                error={err}
                label="Activation Reason"
                placeholder="e.g. Employee requested re-activation"
                submitLabel="Confirm Activate"
                submittingLabel="Activating…"
                onCancel={() => setMode('view')}
                onSubmit={async (reason) => { activateMut.mutate(reason) }}
              />
            )}
          </RoleGuard>

          {!isAdmin && <ReadOnlyNote />}

          <BanHistorySection events={buildHistory(record)} />
        </div>
      )}

      {dtab === 'messages' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-muted)]">
            Showing last {messages.data?.length ?? 0} messages for this number
          </p>
          <MessageTable
            rows={(messages.data ?? []).map((m) => ({
              ts: m.attempted_at,
              status: m.status,
              detail: m.app_email,
            }))}
            detailHeader="App Source"
          />
        </div>
      )}
    </Drawer>
  )
}

/* ---------------- Email Drawer ---------------- */

function EmailDrawer({
  record,
  onClose,
  onRefresh,
}: {
  record: EmailRecord
  onClose: () => void
  onRefresh: (r: EmailRecord) => void
}) {
  const isAdmin = useIsAdmin()
  const qc = useQueryClient()
  const toast = useToast()
  const [dtab, setDtab] = useState<DrawerTab>('info')
  const [mode, setMode] = useState<'view' | 'ban' | 'unban'>('view')
  const [err, setErr] = useState<string | null>(null)

  const messages = useEmailMessages(record.email_address, dtab === 'messages')

  const banMut = useMutation({
    mutationFn: (body: BanBody) => banEmail(record.email_address, body),
    onSuccess: (updated) => {
      toast('success', 'Email banned')
      invalidate()
      onRefresh(updated)
      setMode('view')
    },
    onError: () => setErr('Ban failed. Try again.'),
  })

  const unbanMut = useMutation({
    mutationFn: (reason: string) => unbanEmail(record.email_address, reason),
    onSuccess: (updated) => {
      toast('success', 'Email unbanned')
      invalidate()
      onRefresh(updated)
      setMode('view')
    },
    onError: () => setErr('Unban failed. Try again.'),
  })

  function invalidate() {
    qc.invalidateQueries({ queryKey: ['emails'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  return (
    <Drawer
      open
      onClose={onClose}
      title={
        <div>
          <p className="mono truncate text-sm font-semibold text-[var(--color-text)]">
            {record.email_address}
          </p>
          <div className="mt-1">
            <Badge status={emailStatus(record)} />
          </div>
        </div>
      }
    >
      <InnerTabs tab={dtab} setTab={setDtab} />

      {dtab === 'info' && (
        <div className="space-y-5">
          <Stats
            items={[
              ['Attempted', formatNumber(record.msg_attempts)],
              ['Last Msg Attempt', relativeTime(record.last_msg_attempt)],
            ]}
          />

          <RoleGuard>
            {mode === 'view' && (
              <div className="flex flex-wrap gap-2">
                {!record.banned && !record.temp_ban && (
                  <ActionBtn onClick={() => { setErr(null); setMode('ban') }}>Ban</ActionBtn>
                )}
                {(record.banned || record.temp_ban) && (
                  <ActionBtn green onClick={() => { setErr(null); setMode('unban') }}>
                    Unban
                  </ActionBtn>
                )}
              </div>
            )}
            {mode === 'ban' && (
              <BanForm
                submitting={banMut.isPending}
                error={err}
                onCancel={() => setMode('view')}
                onSubmit={async (b) => { banMut.mutate(b) }}
              />
            )}
            {mode === 'unban' && (
              <UnbanForm
                submitting={unbanMut.isPending}
                error={err}
                onCancel={() => setMode('view')}
                onSubmit={async (reason) => { unbanMut.mutate(reason) }}
              />
            )}
          </RoleGuard>

          {!isAdmin && <ReadOnlyNote />}

          <BanHistorySection events={emailHistory(record)} />
        </div>
      )}

      {dtab === 'messages' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-muted)]">
            Showing last {messages.data?.length ?? 0} messages for this address
          </p>
          <MessageTable
            rows={(messages.data ?? []).map((m) => ({
              ts: m.attempted_at,
              status: m.status,
              detail: m.phone_number,
            }))}
            detailHeader="Recipient"
          />
        </div>
      )}
    </Drawer>
  )
}

function ReadOnlyNote() {
  return (
    <p className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-xs text-[var(--color-muted)]">
      Read-only view. Contact an admin to make changes.
    </p>
  )
}

function BanHistorySection({ events }: { events: TimelineEvent[] }) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-[var(--color-text)]">Ban History</h3>
      <Timeline events={events} />
    </div>
  )
}

/* ---------------- Drawer sub-parts ---------------- */

function InnerTabs({ tab, setTab }: { tab: DrawerTab; setTab: (t: DrawerTab) => void }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-[var(--color-border)]">
      <button
        onClick={() => setTab('info')}
        className={tabClass(tab === 'info')}
      >
        Ban Info
      </button>
      <button
        onClick={() => setTab('messages')}
        className={tabClass(tab === 'messages')}
      >
        Last 20 Messages
      </button>
    </div>
  )
}

function Stats({ items }: { items: Array<[string, string]> }) {
  return (
    <div className={`grid gap-2 ${items.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {items.map(([label, val]) => (
        <div key={label} className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 text-center">
          <p className="text-[10px] uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
          <p className="mono mt-0.5 text-lg font-bold text-[var(--color-text)]">{val}</p>
        </div>
      ))}
    </div>
  )
}

function ActionBtn({
  children,
  onClick,
  green,
}: {
  children: React.ReactNode
  onClick: () => void
  green?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={classNames(
        'rounded-md px-4 py-2 text-sm font-medium text-white hover:brightness-110',
        green ? 'bg-[var(--color-safe)]' : 'bg-[var(--color-critical)]'
      )}
    >
      {children}
    </button>
  )
}

const MSG_STATUS_COLOR: Record<string, string> = {
  Blocked: 'var(--color-critical)',
  Delivered: 'var(--color-safe)',
  Throttled: 'var(--color-warning)',
}

function MessageTable({
  rows,
  detailHeader,
}: {
  rows: Array<{ ts: string | null; status: string | null; detail: string | null }>
  detailHeader: string
}) {
  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-muted)]">No messages recorded.</p>
  }
  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[var(--color-border)] bg-[var(--color-card)] text-left uppercase text-[var(--color-muted)]">
            <th className="px-3 py-2">Timestamp</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">{detailHeader}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-[var(--color-border)] last:border-0">
              <td className="mono px-3 py-2 text-[var(--color-text)]">{formatDateTime(r.ts)}</td>
              <td className="px-3 py-2">
                <span style={{ color: MSG_STATUS_COLOR[r.status ?? ''] ?? 'var(--color-muted)' }}>
                  {r.status ?? '—'}
                </span>
              </td>
              <td className="mono px-3 py-2 text-[var(--color-muted)]">{r.detail ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ---------------- History builders ---------------- */

function emailHistory(r: EmailRecord): TimelineEvent[] {
  return buildHistory({ ...r, unban_reason: r.unbanned_reason })
}

function buildHistory(r: {
  date_banned: string | null
  ban_reason: string | null
  banned_by: string | null
  temp_ban: boolean
  date_unbanned: string | null
  unban_reason: string | null
  unbanned_by: string | null
}): TimelineEvent[] {
  const events: TimelineEvent[] = []
  if (r.date_unbanned) {
    events.push({
      action: 'Unbanned',
      date: r.date_unbanned,
      reason: r.unban_reason,
      actor: r.unbanned_by,
      color: 'var(--color-safe)',
      system: false,
    })
  }
  if (r.date_banned) {
    events.push({
      action: r.temp_ban ? 'Temp Ban' : 'Banned',
      date: r.date_banned,
      reason: r.ban_reason,
      actor: r.banned_by,
      color: r.temp_ban ? 'var(--color-warning)' : 'var(--color-critical)',
      system: !r.banned_by,
    })
  }
  return events
}
