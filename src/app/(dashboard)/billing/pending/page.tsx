'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle2, XCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { formatDateTime } from '@/lib/utils'

interface StatusData {
  status: string
  daysRemaining: number
  isActive: boolean
  isTrial: boolean
  isExpired: boolean
  hasPendingProof: boolean
  pendingProof?: {
    id: string
    planName: string
    submittedAt: string
    status: string
    rejectionReason?: string
  }
}

export default function BillingPendingPage() {
  const router = useRouter()
  const [statusData, setStatusData] = useState<StatusData | null>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/billing/status')
      const json = await res.json()
      if (!json.success) return

      const data = json.data as StatusData
      setStatusData(data)

      if (data.isActive && !data.hasPendingProof) {
        toast.success('Your subscription has been activated!')
        router.push('/dashboard')
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [checkStatus])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const isApproved = statusData?.isActive && !statusData?.hasPendingProof
  const isRejected = statusData?.pendingProof?.status === 'REJECTED'

  if (isApproved) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center py-16 space-y-4">
        <CheckCircle2 className="w-16 h-16 text-emerald-500" />
        <h1 className="text-2xl font-bold text-slate-900">Subscription Active!</h1>
        <p className="text-gray-500">Your payment has been approved and your subscription is now active.</p>
        <Button onClick={() => router.push('/dashboard')}>Go to Dashboard</Button>
      </div>
    )
  }

  if (isRejected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 text-center py-16 space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <h1 className="text-2xl font-bold text-slate-900">Payment Rejected</h1>
        <p className="text-gray-500 max-w-sm">
          Your payment proof was rejected. Please review and resubmit.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 max-w-sm text-sm text-red-700 text-left w-full">
          <p className="font-semibold mb-1">Reason:</p>
          <p>{statusData?.pendingProof?.rejectionReason || 'Please contact support for details.'}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push('/billing/plans')}>Choose Plan</Button>
          <Button onClick={() => router.push('/billing/pay')}>Resubmit Payment</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-64 text-center py-16 space-y-6">
      <div className="relative">
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center border-4 border-amber-200">
          <Clock className="w-10 h-10 text-amber-500 animate-pulse" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-amber-400 rounded-full flex items-center justify-center">
          <RefreshCw className="w-3.5 h-3.5 text-white animate-spin" />
        </div>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-slate-900">Payment Under Review</h1>
        <p className="text-gray-500 max-w-sm mx-auto">
          Your payment proof has been submitted and is being reviewed by our team.
          This usually takes less than 24 hours.
        </p>
      </div>

      <div className="bg-violet-50 border border-blue-200 rounded-xl p-5 max-w-sm w-full text-left space-y-2">
        <p className="text-sm font-semibold text-violet-900">What happens next?</p>
        <ul className="text-sm text-violet-700 space-y-1">
          <li>• Our team verifies your payment screenshot</li>
          <li>• You receive an email confirmation once approved</li>
          <li>• Your subscription activates automatically</li>
          <li>• This page refreshes every 30 seconds</li>
        </ul>
      </div>

      {statusData?.pendingProof?.submittedAt && (
        <p className="text-sm text-gray-500">
          Submitted: {formatDateTime(statusData.pendingProof.submittedAt)}
        </p>
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={checkStatus}>
          <RefreshCw className="w-4 h-4 mr-2" /> Check Now
        </Button>
        <Button variant="ghost" onClick={() => router.push('/dashboard')}>
          Continue Using Trial
        </Button>
      </div>
    </div>
  )
}
