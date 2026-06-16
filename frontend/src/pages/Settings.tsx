import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2, RefreshCw, Plus } from 'lucide-react'
import TopBar from '../components/layout/TopBar'
import { useToast } from '../store/uiStore'
import { listGroups, createGroup, deleteGroup, syncGroups, type SyncResult } from '../api/groups'
import { classNames, relativeTime } from '../lib/utils'
import type { Role } from '../types'

const INPUT_CLS = 'w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]'

export default function Settings() {
  const qc = useQueryClient()
  const toast = useToast()
  const [showForm, setShowForm] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [role, setRole] = useState<Role>('helpdesk')

  const { data: groups = [], isLoading } = useQuery({ queryKey: ['groups'], queryFn: listGroups })

  const addMut = useMutation({
    mutationFn: () => createGroup({ group_name: groupName.trim(), role }),
    onSuccess: () => {
      toast('success', 'Group added')
      qc.invalidateQueries({ queryKey: ['groups'] })
      setGroupName(''); setRole('helpdesk'); setShowForm(false)
    },
    onError: () => toast('error', 'Failed to add group'),
  })

  const delMut = useMutation({
    mutationFn: (name: string) => deleteGroup(name),
    onSuccess: () => { toast('success', 'Group removed'); qc.invalidateQueries({ queryKey: ['groups'] }) },
    onError: () => toast('error', 'Failed to remove group'),
  })

  const syncMut = useMutation({
    mutationFn: syncGroups,
    onSuccess: (res: SyncResult) => {
      const missing = res.not_found.length
      const msg = missing
        ? `Synced ${res.synced} group${res.synced !== 1 ? 's' : ''} — ${missing} not found in AD`
        : `Synced ${res.synced} group${res.synced !== 1 ? 's' : ''} — all verified`
      toast(missing ? 'error' : 'success', msg)
      qc.invalidateQueries({ queryKey: ['groups'] })
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : 'Sync failed'
      toast('error', msg)
    },
  })

  return (
    <>
      <TopBar title="Settings" />
      <main className="flex-1 overflow-y-auto p-5">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[var(--color-muted)]">Map Active Directory groups to roles.</p>
            <div className="flex gap-2">
              <button
                onClick={() => syncMut.mutate()}
                disabled={syncMut.isPending}
                className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text)] hover:bg-[var(--color-card)] disabled:opacity-40"
              >
                <RefreshCw size={14} className={syncMut.isPending ? 'animate-spin' : ''} />
                Sync from AD
              </button>
              <button
                onClick={() => setShowForm((v) => !v)}
                className="flex items-center gap-1.5 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-white hover:brightness-110"
              >
                <Plus size={14} /> Add Group
              </button>
            </div>
          </div>

          {showForm && (
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-4">
              <div className="flex-1 min-w-[200px]">
                <label className="mb-1 block text-xs text-[var(--color-muted)]">Group Name (DN)</label>
                <input
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="CN=SAS-Admins,OU=Groups,DC=corp,DC=com"
                  className={`mono ${INPUT_CLS}`}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-[var(--color-muted)]">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-text)] outline-none focus:border-[var(--color-accent)]"
                >
                  <option value="helpdesk">Helpdesk</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowForm(false); setGroupName('') }}
                  className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => addMut.mutate()}
                  disabled={!groupName.trim() || addMut.isPending}
                  className="rounded-md bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-white disabled:opacity-40 hover:brightness-110"
                >
                  {addMut.isPending ? 'Adding…' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {isLoading ? (
            <p className="text-sm text-[var(--color-muted)]">Loading…</p>
          ) : groups.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">No groups mapped yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface)] text-left text-xs uppercase text-[var(--color-muted)]">
                    <th className="px-4 py-2.5">Group Name</th>
                    <th className="px-4 py-2.5">Role</th>
                    <th className="px-4 py-2.5">Added By</th>
                    <th className="px-4 py-2.5">Added At</th>
                    <th className="px-4 py-2.5" />
                  </tr>
                </thead>
                <tbody>
                  {groups.map((g) => (
                    <tr key={g.group_name} className="border-b border-[var(--color-border)] last:border-0">
                      <td className="mono max-w-[300px] truncate px-4 py-3 text-[var(--color-text)]">{g.group_name}</td>
                      <td className="px-4 py-3">
                        <span className={classNames(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          g.role === 'admin' ? 'bg-green-500/15 text-green-400' : 'bg-blue-500/15 text-blue-400'
                        )}>
                          {g.role === 'admin' ? 'Admin' : 'Helpdesk'}
                        </span>
                      </td>
                      <td className="mono px-4 py-3 text-[var(--color-muted)]">{g.added_by ?? '—'}</td>
                      <td className="px-4 py-3 text-[var(--color-muted)]">{relativeTime(g.added_at)}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => delMut.mutate(g.group_name)}
                          disabled={delMut.isPending}
                          className="rounded p-1 text-[var(--color-muted)] hover:text-[var(--color-critical)] disabled:opacity-40"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
