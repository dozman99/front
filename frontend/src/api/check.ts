import api from '../lib/axios'
import type { CheckResponse } from '../types'

// Public, no-auth endpoints. Rate limited 100/hr/IP server-side.
export async function checkPhone(number: string): Promise<CheckResponse> {
  const { data } = await api.get(
    `/check/phone/${encodeURIComponent(number)}`
  )
  return data
}

export async function checkEmail(address: string): Promise<CheckResponse> {
  const { data } = await api.get(
    `/check/email/${encodeURIComponent(address)}`
  )
  return data
}
