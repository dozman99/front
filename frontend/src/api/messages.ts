import api from '../lib/axios'
import type { MessageRecord } from '../types'

export async function getPhoneMessages(
  number: string,
  limit = 20
): Promise<MessageRecord[]> {
  const { data } = await api.get(
    `/messages/phone/${encodeURIComponent(number)}`,
    { params: { limit } }
  )
  return data
}

export async function getEmailMessages(
  address: string,
  limit = 20
): Promise<MessageRecord[]> {
  const { data } = await api.get(
    `/messages/email/${encodeURIComponent(address)}`,
    { params: { limit } }
  )
  return data
}
