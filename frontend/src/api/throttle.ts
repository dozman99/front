import api from '../lib/axios'
import type { ThrottleRecord } from '../types'

export async function listThrottle(): Promise<ThrottleRecord[]> {
  const { data } = await api.get('/throttle')
  return data
}

export async function getGlobalThrottle(): Promise<ThrottleRecord> {
  const { data } = await api.get('/throttle/global')
  return data
}

export async function patchGlobalThrottle(body: {
  cap_per_hour?: number
  enabled?: boolean
}): Promise<ThrottleRecord> {
  const { data } = await api.patch('/throttle/global', body)
  return data
}

export async function patchThrottle(
  email: string,
  body: { cap_per_hour?: number; enabled?: boolean }
): Promise<ThrottleRecord> {
  const { data } = await api.patch(
    `/throttle/${encodeURIComponent(email)}`,
    body
  )
  return data
}
