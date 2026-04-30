'use client'
import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

export function useSubscription() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: async () => {
      const res = await axios.get('/api/billing/status')
      return res.data.data
    },
    refetchInterval: 30000, // auto-refresh every 30s
    staleTime: 10000,
  })

  return {
    status: data?.status as string | undefined,
    daysRemaining: data?.daysRemaining as number | undefined,
    isExpired: data?.isExpired as boolean | undefined,
    isTrial: data?.isTrial as boolean | undefined,
    isActive: data?.isActive as boolean | undefined,
    hasPendingProof: data?.hasPendingProof as boolean | undefined,
    planName: data?.planName as string | undefined,
    isLoading,
    refetch,
  }
}
