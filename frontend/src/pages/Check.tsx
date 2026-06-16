import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle, MinusCircle, HelpCircle, ArrowLeft } from 'lucide-react'
import { checkPhone, checkEmail } from '../api/check'
import { formatDateTime } from '../lib/utils'
import type { CheckResponse } from '../types'

type Tab = 'phone' | 'email'

// Each result state's presentation. Detail text is built per-state; ban reason
// is NEVER shown here — the API only returns { status, expires }.
const STATES: Record<
  string,
  { icon: typeof CheckCircle2; color: string; tint: string; title: string }
> = {
  active: { icon: CheckCircle2, color: '#16a34a', tint: 'rgba(22,163,74,0.1)', title: 'Not Banned' },
  temp_banned: { icon: Clock, color: '#f59e0b', tint: 'rgba(245,158,11,0.1)', title: 'Temporarily Suspended' },
  permanently_banned: { icon: XCircle, color: '#dc2626', tint: 'rgba(220,38,38,0.1)', title: 'Permanently Banned' },
  opted_out: { icon: MinusCircle, color: '#94a3b8', tint: 'rgba(148,163,184,0.1)', title: 'Opted Out' },
  not_found: { icon: HelpCircle, color: '#2563eb', tint: 'rgba(37,99,235,0.1)', title: 'No Record Found' },
}

function detailFor(tab: Tab, res: CheckResponse): string {
  const noun = tab === 'phone' ? 'number' : 'email address'
  switch (res.status) {
    case 'active':
      return `Your ${noun} is not banned. You are able to receive SMS messages normally.`
    case 'temp_banned':
      return `Your ${noun} has been temporarily suspended. Expires: ${formatDateTime(
        res.expires
      )}. Contact IT Helpdesk for assistance.`
    case 'permanently_banned':
      return `Your ${noun} has been permanently banned from receiving SMS messages. Contact IT Helpdesk for assistance.`
    case 'opted_out':
      return `You have opted out of SMS messages. Contact IT Helpdesk to opt back in.`
    case 'not_found':
    default:
      return `This ${noun} has no record in our system. If you believe this is an error contact IT Helpdesk.`
  }
}

export default function Check() {
  const [tab, setTab] = useState<Tab>('phone')
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckResponse | null>(null)
  const [resultTab, setResultTab] = useState<Tab>('phone')

  async function check() {
    if (!value.trim()) return
    setLoading(true)
    setResult(null)
    const res = await (tab === 'phone' ? checkPhone(value.trim()) : checkEmail(value.trim()))
      .catch(() => ({ status: 'not_found', expires: null } as const))
    setResultTab(tab)
    // 800ms minimum so the loading state reads as deliberate.
    setTimeout(() => {
      setResult(res)
      setLoading(false)
    }, 800)
  }

  function switchTab(next: Tab) {
    setTab(next)
    setValue('')
    setResult(null)
  }

  const state = result ? STATES[result.status] ?? STATES.not_found : null
  const Icon = state?.icon

  return (
    <div className="bg-glow min-h-screen px-4 py-6">
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
      >
        <ArrowLeft size={13} /> Back to Portal
      </Link>

      <div className="mx-auto mt-16 w-full max-w-[420px]">
        <p className="text-center text-xs uppercase tracking-[0.25em] text-[var(--color-muted)]">
          SAS Relay
        </p>
        <h1 className="mt-3 text-center text-[26px] font-bold text-[var(--color-text)]">
          Check Your Status
        </h1>
        <p className="mt-2 text-center text-sm leading-relaxed text-[var(--color-muted)]">
          Find out if your phone number or email address has been suspended from
          receiving SMS messages.
        </p>

        <div className="mt-8 flex gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1">
          {(['phone', 'email'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition ${
                tab === t
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'text-[var(--color-muted)] hover:text-[var(--color-text)]'
              }`}
            >
              {t === 'phone' ? 'Phone Number' : 'Email Address'}
            </button>
          ))}
        </div>

        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && check()}
          placeholder={tab === 'phone' ? '+1 555 123 4567' : 'you@example.com'}
          className="mono mt-4 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
        />

        <button
          onClick={check}
          disabled={!value.trim() || loading}
          className="mt-3 flex w-full items-center justify-center rounded-lg bg-[var(--color-accent)] py-3 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            'Check Status'
          )}
        </button>

        {result && state && Icon && (
          <div
            className="animate-fade-up mt-6 rounded-xl border p-5 text-center"
            style={{ backgroundColor: state.tint, borderColor: state.color }}
          >
            <div
              className="mx-auto grid h-12 w-12 place-items-center rounded-full"
              style={{ backgroundColor: state.tint }}
            >
              <Icon size={26} style={{ color: state.color }} />
            </div>
            <h2 className="mt-3 text-base font-bold" style={{ color: state.color }}>
              {state.title}
            </h2>
            <p className="mt-1.5 text-sm text-[var(--color-muted)]">
              {detailFor(resultTab, result)}
            </p>
          </div>
        )}

        <p className="mt-8 text-center text-[11px] text-[var(--color-muted)]">
          Rate limited — No login required — Ban reason not disclosed
        </p>
      </div>
    </div>
  )
}
