import { useState } from 'react'

interface Props {
  onSubmit: (reason: string) => Promise<void>
  onCancel: () => void
  submitting: boolean
  error?: string | null
  label?: string
  placeholder?: string
  submitLabel?: string
  submittingLabel?: string
}

export default function UnbanForm({
  onSubmit,
  onCancel,
  submitting,
  error,
  label = 'Unban Reason',
  placeholder = 'Why is this entity being unbanned?',
  submitLabel = 'Confirm Unban',
  submittingLabel = 'Unbanning…',
}: Props) {
  const [reason, setReason] = useState('')
  const valid = reason.trim().length >= 3

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-[var(--color-text)]">
        {label} <span className="text-[var(--color-critical)]">*</span>
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder={placeholder}
        className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 text-sm text-[var(--color-text)]"
      />
      {!valid && reason.length > 0 && (
        <p className="text-sm text-red-400">Reason must be at least 3 characters</p>
      )}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <div className="flex justify-between gap-2 pt-1">
        <button
          onClick={onCancel}
          className="rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-card)]"
        >
          Cancel
        </button>
        <button
          onClick={() => void onSubmit(reason.trim())}
          disabled={!valid || submitting}
          className="rounded-md bg-[var(--color-safe)] px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </div>
    </div>
  )
}
