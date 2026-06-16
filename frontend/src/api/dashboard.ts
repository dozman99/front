import api from '../lib/axios'
import type { DashboardStats, IncidentItem, ActivityItem } from '../types'

export async function getStats(): Promise<DashboardStats> {
  const { data } = await api.get('/dashboard/stats')
  return data
}

export async function getIncidents(): Promise<IncidentItem[]> {
  const { data } = await api.get('/dashboard/incidents')
  return data
}

export async function getActivity(hours?: number): Promise<ActivityItem[]> {
  const { data } = await api.get('/dashboard/activity', { params: hours ? { hours } : {} })
  return data
}
