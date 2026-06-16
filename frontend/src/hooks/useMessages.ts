import { useQuery } from '@tanstack/react-query'
import { getPhoneMessages, getEmailMessages } from '../api/messages'

export function usePhoneMessages(number: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['messages', 'phone', number],
    queryFn: () => getPhoneMessages(number as string),
    enabled: enabled && !!number,
  })
}

export function useEmailMessages(address: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['messages', 'email', address],
    queryFn: () => getEmailMessages(address as string),
    enabled: enabled && !!address,
  })
}
