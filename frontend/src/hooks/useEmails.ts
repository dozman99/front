import { useQuery } from '@tanstack/react-query'
import { listEmails, getEmail, type EmailQuery } from '../api/emails'

export function useEmails(q: EmailQuery) {
  return useQuery({
    queryKey: ['emails', q],
    queryFn: () => listEmails(q),
    placeholderData: (prev) => prev,
  })
}

export function useEmail(address: string | null) {
  return useQuery({
    queryKey: ['email', address],
    queryFn: () => getEmail(address as string),
    enabled: !!address,
  })
}
