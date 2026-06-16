import { useQuery } from '@tanstack/react-query'
import { listThrottle, getGlobalThrottle } from '../api/throttle'

export function useThrottle() {
  return useQuery({ queryKey: ['throttle'], queryFn: listThrottle })
}

export function useGlobalThrottle() {
  return useQuery({
    queryKey: ['throttle', 'global'],
    queryFn: getGlobalThrottle,
  })
}
