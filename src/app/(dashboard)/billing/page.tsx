'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { formatCurrency, formatDate, getDaysRemaining } from '@/lib/utils'
import Link from 'next/link'

interface BillingStatus {
  status: string
  daysRemaining: number
  isExpired: boolean
  isTrial: boolean
  isActive: boolean
  hasPendingProof: boolean
  planName: string | null
  expiryDate: string | null
}

interface PaymentHistory {
  id: string
  amount: number
  status: string
  createdAt: string
  plan: { name: string }
  durationMonths: number
  reviewedAt: string | null
  bankName: string
  transactionId: string | null
}

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null)
  const [history, setHistory] = useState<PaymentHistory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [statusRes, historyRes] = await Promise.all([
          fetch('/api/billing/status'),
          fetch('/api/billing/history'),
        ])
        const [statusData, historyData] = await Promise.all([
          statusRes.json(),
          historyRes.json(),
        ])
        if (statusData.success) setStatus(statusData.data)
        if (historyData.success) setHistory(historyData.data || [])
      } catch {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    )
  }

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'ACTIVE': return 'bg-green-100 text-green-700'
      case 'TRIAL': return 'bg-amber-100 text-amber-700'
      case 'EXPIRED': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Manage your subscription"
      />

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Plan</CardTitle>
        </CardHeader>
        <CardContent>
          {status ? (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(status.status)}`}>
                    {status.isTrial ? 'Free Trial' : status.planName || status.status}
                  </span>
                  {status.isActive && !status.isTrial && (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  )}
                </div>

                {status.expiryDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {status.isExpired ? 'Expired' : 'Expires'}: {formatDate(status.expiryDate)}
                    </span>
                    {!status.isExpired && (
                      <span className={`font-medium ${status.daysRemaining <= 3 ? 'text-red-600' : status.daysRemaining <= 7 ? 'text-amber-600' : 'text-green-600'}`}>
                        ({status.daysRemaining} days remaining)
                      </span>
                    )}
                  </div>
                )}

                {status.hasPendingProof && (
                  <div className="flex items-center gap-2 text-sm text-violet-600">
                    <Clock className="w-4 h-4" />
                    <span>Payment proof submitted — awaiting approval</span>
                    <Link href="/billing/pending" className="underline">Check Status</Link>
                  </div>
                )}

                {status.isExpired && !status.hasPendingProof && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Your subscription has expired. Please renew to continue.</span>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:items-end gap-2">
                {!status.hasPendingProof && (
                  <Link href="/billing/plans">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                      {status.isExpired ? 'Renew Subscription' : status.isTrial ? 'Upgrade Plan' : 'Change Plan'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </Link>
                )}
                {status.hasPendingProof && (
                  <Link href="/billing/pending">
                    <Button variant="outline">View Pending Payment</Button>
                  </Link>
                )}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No subscription information available</p>
          )}
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link href="/billing/plans">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-violet-50 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">View Plans</p>
                <p className="text-xs text-gray-400">Compare and upgrade</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing/pay">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">Make Payment</p>
                <p className="text-xs text-gray-400">Bank transfer + proof</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/billing/pending">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-sm text-slate-900">Check Status</p>
                <p className="text-xs text-gray-400">Payment review status</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Payment History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {history.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-400 text-sm">
              No payment history yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Plan</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500">Amount</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((h) => (
                    <tr key={h.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-600">{formatDate(h.createdAt)}</td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{h.plan.name}</p>
                        <p className="text-xs text-gray-400">{h.durationMonths} month(s) · {h.bankName}</p>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(h.amount)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={h.status.toLowerCase()} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
