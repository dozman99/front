import { useQuery } from '@tanstack/react-query'
import { listEmails, type EmailQuery } from '../api/emails'

export function useEmails(q: EmailQuery) {
  return useQuery({
    queryKey: ['emails', q],
    queryFn: () => listEmails(q),
    placeholderData: (prev) => prev,
  })
}
