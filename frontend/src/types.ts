// Central type definitions for SAS Relay frontend (Runbook §8)

export interface PhoneRecord {
  phone_number: string
  banned: boolean
  temp_ban: boolean
  date_banned: string | null
  date_ban_expire: string | null
  ban_reason: string | null
  banned_by: string | null
  date_unbanned: string | null
  unbanned_by: string | null
  unban_reason: string | null
  msg_attempts: number
  last_msg_attempt: string | null
  opt_out: boolean
  auto_temp_ban_count: number
}

export interface EmailRecord {
  email_address: string
  banned: boolean
  temp_ban: boolean
  date_banned: string | null
  date_ban_expire: string | null
  ban_reason: string | null
  banned_by: string | null
  date_unbanned: string | null
  unbanned_by: string | null
  unbanned_reason: string | null
  msg_attempts: number
  last_msg_attempt: string | null
}


export interface MessageRecord {
  app_email: string | null
  phone_number: string | null
  attempted_at: string | null
  status: string | null
  block_reason: string | null
  twilio_response_code: string | null
}

export interface AdGroupRecord {
  group_name: string
  role: 'admin' | 'helpdesk'
  added_by: string | null
  added_at: string | null
}

export interface IncidentItem {
  type: string
  entity: string
  detail: string
  severity: 'info' | 'warning' | 'critical'
}

export interface ActivityItem {
  id: number
  action: string
  entity: string
  entity_type: string
  actor: string
  performed_at: string
  reason: string | null
}

export interface DashboardStats {
  banned_phones: number
  banned_apps: number
  temp_expiring_today: number
  opt_outs: number
  banned_phones_today: number
  banned_apps_today: number
  temp_bans_today: number
  opt_outs_today: number
}

export interface CheckResponse {
  status: string
  expires: string | null
}

export interface PaginatedResponse<T> {
  total: number
  page: number
  limit: number
  results: T[]
}

export type Role = 'admin' | 'helpdesk'

export interface AuthUser {
  username: string
  name: string
  role: Role
}
