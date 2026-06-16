import api from '../lib/axios'
import type { RuleRecord } from '../types'

export async function listRules(): Promise<RuleRecord[]> {
  const { data } = await api.get('/rules')
  return data
}

export async function createRule(body: {
  title: string
  condition_text: string
  action_text: string
}): Promise<RuleRecord> {
  const { data } = await api.post('/rules', body)
  return data
}

export async function patchRule(
  id: number,
  body: Partial<{
    title: string
    condition_text: string
    action_text: string
    enabled: boolean
  }>
): Promise<RuleRecord> {
  const { data } = await api.patch(`/rules/${id}`, body)
  return data
}

export async function deleteRule(id: number) {
  const { data } = await api.delete(`/rules/${id}`)
  return data
}
