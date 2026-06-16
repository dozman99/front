import { useQuery } from '@tanstack/react-query'
import { listAudit, type AuditQuery } from '../api/audit'

export function useAudit(q: AuditQuery) {
  return useQuery({
    queryKey: ['audit', q],
    queryFn: () => listAudit(q),
    placeholderData: (prev) => prev,
  })
}
