import api from '../lib/axios'
import type { AuditRecord, PaginatedResponse } from '../types'

export interface AuditQuery {
  page?: number
  limit?: number
  action?: string
  entity?: string
  date_from?: string
  date_to?: string
}

export async function listAudit(
  q: AuditQuery = {}
): Promise<PaginatedResponse<AuditRecord>> {
  const { data } = await api.get('/audit', { params: q })
  return data
}

