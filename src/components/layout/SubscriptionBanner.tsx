'use client'

import { useEffect, useState } from 'react'
import { X, AlertTriangle, Clock, CreditCard } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface BannerData {
  status: string
  daysRemaining: number
  isTrial: boolean
  isExpired: boolean
  hasPendingProof: boolean
  planName: string | null
}

interface SubscriptionBannerProps {
  storeId: string
}

export function SubscriptionBanner({ storeId }: SubscriptionBannerProps) {
  const [data, setData] = useState<BannerData | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    fetch('/api/billing/status')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data)
      })
      .catch(() => {})
  }, [])

  if (!data || dismissed) return null

  // Show nothing for healthy active subscriptions
  if (data.status === 'ACTIVE' && data.daysRemaining > 3 && !data.hasPendingProof) return null

  let bannerClass = ''
  let icon = <Clock className="w-4 h-4 flex-shrink-0" />
  let message: React.ReactNode = null

  if (data.isExpired) {
    bannerClass = 'bg-red-600 text-white'
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    message = (
      <>
        <span>Subscription expired. Renew now to continue using POS features.</span>
        <Link href="/billing/plans" className="ml-2 underline font-semibold hover:no-underline">
          Renew Now &rarr;
        </Link>
      </>
    )
  } else if (data.hasPendingProof) {
    bannerClass = 'bg-violet-600 text-white'
    icon = <CreditCard className="w-4 h-4 flex-shrink-0" />
    message = (
      <>
        <span>Payment review ho rahi hai. Admin approval ke baad subscription activate ho jayegi.</span>
        <Link href="/billing/pending" className="ml-2 underline font-semibold hover:no-underline">
          Status Check &rarr;
        </Link>
      </>
    )
  } else if (data.isTrial) {
    bannerClass = 'bg-amber-500 text-white'
    icon = <Clock className="w-4 h-4 flex-shrink-0" />
    message = (
      <>
        <span>Trial: {data.daysRemaining} din remaining</span>
        <Link href="/billing/plans" className="ml-2 underline font-semibold hover:no-underline">
          Upgrade Now &rarr;
        </Link>
      </>
    )
  } else if (data.daysRemaining <= 3 && data.status === 'ACTIVE') {
    bannerClass = 'bg-orange-500 text-white'
    icon = <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    message = (
      <>
        <span>Subscription {data.daysRemaining} din mein expire ho rahi hai</span>
        <Link href="/billing/plans" className="ml-2 underline font-semibold hover:no-underline">
          Renew Karein &rarr;
        </Link>
      </>
    )
  }

  if (!message) return null

  return (
    <div className={cn('flex items-center justify-between px-4 py-2.5 text-sm', bannerClass)}>
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {icon}
        <span className="truncate">{message}</span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="ml-4 flex-shrink-0 hover:opacity-75 transition-opacity"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
