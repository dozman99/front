import { useQuery } from '@tanstack/react-query'
import { listPhones, getPhone, type PhoneQuery } from '../api/phones'

export function usePhones(q: PhoneQuery) {
  return useQuery({
    queryKey: ['phones', q],
    queryFn: () => listPhones(q),
    placeholderData: (prev) => prev,
  })
}

export function usePhone(number: string | null) {
  return useQuery({
    queryKey: ['phone', number],
    queryFn: () => getPhone(number as string),
    enabled: !!number,
  })
}
