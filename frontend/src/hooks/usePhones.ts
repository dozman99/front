import { useQuery } from '@tanstack/react-query'
import { listPhones, type PhoneQuery } from '../api/phones'

export function usePhones(q: PhoneQuery) {
  return useQuery({
    queryKey: ['phones', q],
    queryFn: () => listPhones(q),
    placeholderData: (prev) => prev,
  })
}
