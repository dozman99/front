import { useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { router } from './router'
import { useMe } from './hooks/useAuth'
import { useAuthStore } from './store/authStore'
import { registerAuthHandlers } from './lib/axios'
import { useToast } from './store/uiStore'
import ToastHost from './components/shared/Toast'

export default function App() {
  const setUser = useAuthStore((s) => s.setUser)
  const setLoading = useAuthStore((s) => s.setLoading)
  const clear = useAuthStore((s) => s.clear)
  const toast = useToast()
  const qc = useQueryClient()

  // Restore session on load.
  const me = useMe()

  useEffect(() => {
    if (me.isSuccess) {
      setUser(me.data)
      setLoading(false)
    } else if (me.isError) {
      clear()
      setLoading(false)
    }
  }, [me.isSuccess, me.isError, me.data, setUser, setLoading, clear])

  // Wire global 401/403 handling.
  useEffect(() => {
    registerAuthHandlers({
      onUnauthorized: () => {
        clear()
        qc.clear()
        if (!['/login', '/check'].includes(window.location.pathname)) {
          window.location.href = '/login'
        }
      },
      onForbidden: () => {
        toast('error', 'Access denied')
      },
    })
  }, [clear, qc, toast])

  return (
    <>
      <RouterProvider router={router} />
      <ToastHost />
    </>
  )
}
