import axios from 'axios'

// Base API client. Credentials included so the sas_session cookie rides along
// on every request (Runbook §4 — API CLIENT).
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// 401 -> clear auth + bounce to login. 403 -> toast + back to dashboard.
// Handlers are registered from outside (App) to avoid circular imports.
type Handlers = {
  onUnauthorized?: () => void
  onForbidden?: () => void
}
const handlers: Handlers = {}

export function registerAuthHandlers(h: Handlers) {
  handlers.onUnauthorized = h.onUnauthorized
  handlers.onForbidden = h.onForbidden
}

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) handlers.onUnauthorized?.()
    if (status === 403) handlers.onForbidden?.()
    return Promise.reject(error)
  }
)

export default api
