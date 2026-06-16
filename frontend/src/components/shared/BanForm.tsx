import { useState } from 'react'
import { z } from 'zod'
import { AlertTriangle } from 'lucide-react'
import { minExpiryLocal } from '../../lib/utils'
import type { BanBody } from '../../api/phones'

// Zod schema mirrors Runbook §5. Validated before submit.
const BanSchema = z
  .object({
    banType: z.enum(['temporary', 'permanent']),
    expiryDate: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true
          const expiry = new Date(val)
          const minExpiry = new Date(Date.now() + 60 * 60 * 1000)
          return expiry > minExpiry
        },
        { message: 'Expiry must be at least 1 hour from now' }
      ),
    confirmed: z.boolean().refine((v) => v === true, {
      message: 'You must confirm before proceeding',
    }),
    reason: z.string().min(3, 'Reason must be at least 3 characters'),
  })
  .refine((d) => d.banType !== 'temporary' || !!d.expiryDate, {
    message: 'Pick an expiration date',
    path: ['expiryDate'],
  })

interface Props {
  onSubmit: (body: BanBody) => Promise<void>
  onCancel: () => void
  submitting: boolean
  error?: string | null
}

export default function BanForm({ onSubmit, onCancel, submitting, error }: Props) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [banType, setBanType] = useState<'temporary' | 'permanent'>('temporary')
  const [expiryDate, setExpiryDate] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [reason, setReason] = useState('')
  const [fieldErr, setFieldErr] = useState<string | null>(null)

  const reasonValid = reason.trim().length >= 3

  function goStep2() {
    setConfirmed(false)
    setStep(2)
  }

  function submit() {
    const parsed = BanSchema.safeParse({ banType, expiryDate, confirmed, reason })
    if (!parsed.success) {
      setFieldErr(parsed.error.issues[0]?.message ?? 'Invalid input')
      return
    }
    setFieldErr(null)
    void onSubmit({
      is_temporary: banType === 'temporary',
      expiry_date: banType === 'temporary' ? new Date(expiryDate).toISOString() : null,
      reason: reason.trim(),
    })
  }

  return (
    <div className="space-y-4">
      <StepDots step={step} />

      {step === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-[var(--color-text)]">Choose ban type</p>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm hover:bg-[var(--color-card)]">
            <input
              type="radio"
              name="banType"
              checked={banType === 'temporary'}
              onChange={() => setBanType('temporary')}
            />
            Temporary Ban
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-[var(--color-border)] p-3 text-sm hover:bg-[var(--color-card)]">
            <input
              type="radio"
              name="banType"
              checked={banType === 'permanent'}
              onChange={() => setBanType('permanent')}
            />
            Permanent Ban
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <GhostBtn onClick={onCancel}>Cancel</GhostBtn>
            <PrimaryBtn onClick={goStep2}>Next</PrimaryBtn>
          </div>
        </div>
      )}

      {step === 2 && banType === 'temporary' && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Expiration
          </label>
          <input
            type="datetime-local"
            min={minExpiryLocal()}
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
          <label className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            I confirm this is NOT a permanent ban
          </label>
          {fieldErr && <ErrText>{fieldErr}</ErrText>}
          <div className="flex justify-between gap-2 pt-2">
            <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
            <PrimaryBtn
              onClick={() => {
                if (!expiryDate) return setFieldErr('Pick an expiration date')
                if (!confirmed) return setFieldErr('You must confirm before proceeding')
                setFieldErr(null)
                setStep(3)
              }}
            >
              Continue
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === 2 && banType === 'permanent' && (
        <div className="space-y-3">
          <div className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
            <AlertTriangle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p>This is a PERMANENT ban. It will not expire automatically.</p>
              <p className="mt-1">The existing cron job script will notify the admin team.</p>
            </div>
          </div>
          <label className="flex items-start gap-2 text-sm text-[var(--color-text)]">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            I confirm this is a permanent ban
          </label>
          {fieldErr && <ErrText>{fieldErr}</ErrText>}
          <div className="flex justify-between gap-2 pt-2">
            <GhostBtn onClick={() => setStep(1)}>Back</GhostBtn>
            <PrimaryBtn
              onClick={() => {
                if (!confirmed) return setFieldErr('You must confirm before proceeding')
                setFieldErr(null)
                setStep(3)
              }}
            >
              Continue
            </PrimaryBtn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3">
          <label className="block text-sm font-medium text-[var(--color-text)]">
            Ban Reason <span className="text-[var(--color-critical)]">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            placeholder="Why is this entity being banned?"
            className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)]"
          />
          {fieldErr && <ErrText>{fieldErr}</ErrText>}
          {error && <ErrText>{error}</ErrText>}
          <div className="flex justify-between gap-2 pt-2">
            <GhostBtn onClick={() => setStep(2)}>Back</GhostBtn>
            <button
              onClick={submit}
              disabled={!reasonValid || submitting}
              className="rounded-md bg-[var(--color-critical)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Banning…' : 'Confirm Ban'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StepDots({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {[1, 2, 3].map((n) => (
        <span
          key={n}
          className={`h-1.5 flex-1 rounded-full ${
            n <= step ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border)]'
          }`}
        />
      ))}
    </div>
  )
}

function PrimaryBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:brightness-110"
    >
      {children}
    </button>
  )
}

function GhostBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-card)]"
    >
      {children}
    </button>
  )
}

function ErrText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-red-400">{children}</p>
}
