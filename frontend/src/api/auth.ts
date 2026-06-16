import api from '../lib/axios'
import type { AuthUser, Role } from '../types'

// POST /auth/saml/login -> { redirect_url }. In dev the URL points at the
// backend dev login page; in prod at the SECDS IDP. Frontend is identical.
export async function samlLogin(): Promise<{ redirect_url: string }> {
  const { data } = await api.post('/auth/saml/login')
  return data
}

export async function devLogin(role: Role): Promise<AuthUser> {
  const { data } = await api.post(
    `/auth/dev-login?username=dev-admin&role=${role}`
  )
  return data
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get('/auth/me')
  return data
}

export async function logout(): Promise<{ status: string }> {
  const { data } = await api.post('/auth/logout')
  return data
}
