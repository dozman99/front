import api from '../lib/axios'
import type { PhoneRecord, PaginatedResponse } from '../types'

export interface PhoneQuery {
  status?: 'banned' | 'temp' | 'active' | 'optout'
  search?: string
  page?: number
  limit?: number
}

export async function listPhones(
  q: PhoneQuery = {}
): Promise<PaginatedResponse<PhoneRecord>> {
  const { data } = await api.get('/phones', { params: q })
  return data
}

export async function getPhone(number: string): Promise<PhoneRecord> {
  const { data } = await api.get(`/phones/${encodeURIComponent(number)}`)
  return data
}

export async function createPhone(phone_number: string): Promise<PhoneRecord> {
  const { data } = await api.post('/phones', { phone_number })
  return data
}

export interface BanBody {
  is_temporary: boolean
  expiry_date: string | null
  reason: string
}

export async function banPhone(
  number: string,
  body: BanBody
): Promise<PhoneRecord> {
  const { data } = await api.post(
    `/phones/${encodeURIComponent(number)}/ban`,
    body
  )
  return data
}

export async function setOptOut(
  number: string,
  opt_out: boolean
): Promise<PhoneRecord> {
  const { data } = await api.patch(`/phones/${encodeURIComponent(number)}`, {
    opt_out,
  })
  return data
}

export async function activatePhone(
  number: string,
  reason: string
): Promise<PhoneRecord> {
  const { data } = await api.post(
    `/phones/${encodeURIComponent(number)}/activate`,
    { reason }
  )
  return data
}

export async function deletePhone(number: string) {
  const { data } = await api.delete(`/phones/${encodeURIComponent(number)}`)
  return data
}
