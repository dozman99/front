import api from '../lib/axios'
import type { AdGroupRecord, Role } from '../types'

export async function listGroups(): Promise<AdGroupRecord[]> {
  const { data } = await api.get('/groups')
  return data
}

export async function createGroup(body: {
  group_name: string
  role: Role
}): Promise<AdGroupRecord> {
  const { data } = await api.post('/groups', body)
  return data
}

export async function deleteGroup(group_name: string) {
  const { data } = await api.delete(
    `/groups/${encodeURIComponent(group_name)}`
  )
  return data
}

export interface SyncResult {
  message: string
  synced: number
  groups: { group_name: string; role: string; member_count: number }[]
  not_found: string[]
}

export async function syncGroups(): Promise<SyncResult> {
  const { data } = await api.post('/groups/sync')
  return data
}
