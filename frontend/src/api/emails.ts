import api from '../lib/axios'
import type { EmailRecord, PaginatedResponse } from '../types'
import type { BanBody } from './phones'

export interface EmailQuery {
  status?: 'banned' | 'temp' | 'active'
  search?: string
  page?: number
  limit?: number
}

export async function listEmails(
  q: EmailQuery = {}
): Promise<PaginatedResponse<EmailRecord>> {
  const { data } = await api.get('/emails', { params: q })
  return data
}

export async function getEmail(address: string): Promise<EmailRecord> {
  const { data } = await api.get(`/emails/${encodeURIComponent(address)}`)
  return data
}

export async function createEmail(email_address: string): Promise<EmailRecord> {
  const { data } = await api.post('/emails', { email_address })
  return data
}

export async function banEmail(
  address: string,
  body: BanBody
): Promise<EmailRecord> {
  const { data } = await api.post(
    `/emails/${encodeURIComponent(address)}/ban`,
    body
  )
  return data
}

export async function unbanEmail(
  address: string,
  reason: string
): Promise<EmailRecord> {
  const { data } = await api.post(
    `/emails/${encodeURIComponent(address)}/unban`,
    { reason }
  )
  return data
}

export async function deleteEmail(address: string) {
  const { data } = await api.delete(`/emails/${encodeURIComponent(address)}`)
  return data
}
