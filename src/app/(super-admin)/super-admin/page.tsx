'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Store, Users, DollarSign, Clock, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { CardSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Stats {
  totalStores: number
  activeStores: number
  trialStores: number
  expiredStores: number
  totalUsers: number
  pendingPayments: number
  monthlyRevenue: number
  totalRevenue: number
}

interface RecentProof {
  id: string
  amount: number
  status: string
  submittedAt: string
  store: { id: string; name: string; city: string | null }
  plan: { name: string }
}

function StatCard({ label, value, icon: Icon, color, subtitle }: { label: string; value: string | number; icon: any; color: string; subtitle?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-400">{subtitle}</p>}
      </div>
    </div>
  )
}

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [stats, setStats] = useState<Stats | null>(null)
  const [recentProofs, setRecentProofs] = useState<RecentProof[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, proofsRes] = await Promise.all([
          fetch('/api/super-admin/stats'),
          fetch('/api/super-admin/payments?limit=5&status=PENDING'),
        ])
        const statsJson = await statsRes.json()
        if (statsJson.success) setStats(statsJson.data)

        const proofsJson = await proofsRes.json()
        if (proofsJson.success) setRecentProofs(proofsJson.data)
      } catch {
        toast.error('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Super Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Platform overview and management</p>
      </div>

      {loading ? (
        <CardSkeleton count={4} />
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Stores" value={stats?.totalStores ?? 0} icon={Store} color="bg-violet-500" subtitle={`${stats?.activeStores ?? 0} active`} />
            <StatCard label="Trial Stores" value={stats?.trialStores ?? 0} icon={Clock} color="bg-amber-500" />
            <StatCard label="Pending Payments" value={stats?.pendingPayments ?? 0} icon={AlertTriangle} color="bg-red-500" subtitle="Awaiting review" />
            <StatCard label="Total Revenue" value={formatCurrency(stats?.totalRevenue ?? 0)} icon={DollarSign} color="bg-emerald-500" subtitle={`${formatCurrency(stats?.monthlyRevenue ?? 0)} this month`} />
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-3xl font-bold text-slate-900">{stats?.totalUsers ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              <p className="text-3xl font-bold text-emerald-600">{stats?.activeStores ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Expired Stores</p>
              <p className="text-3xl font-bold text-red-500">{stats?.expiredStores ?? 0}</p>
            </div>
          </div>
        </>
      )}

      {/* Pending Payment Proofs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Pending Payment Reviews</h2>
          <Button size="sm" onClick={() => router.push('/super-admin/payments')}>
            View All
          </Button>
        </div>
        {recentProofs.length === 0 ? (
          <div className="py-10 text-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No pending payments</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {recentProofs.map((proof) => (
              <div key={proof.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-slate-800">{proof.store.name}</p>
                  <p className="text-xs text-gray-500">{proof.plan.name} · {formatDateTime(proof.submittedAt)}</p>
                  {proof.store.city && <p className="text-xs text-gray-400">{proof.store.city}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{formatCurrency(proof.amount)}</p>
                  <StatusBadge status={proof.status} />
                  <Button size="sm" onClick={() => router.push('/super-admin/payments')}>
                    Review
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-200 hover:bg-violet-50/30 transition-colors"
          onClick={() => router.push('/super-admin/payments')}
        >
          <h3 className="font-semibold text-slate-900">Payment Review</h3>
          <p className="text-sm text-gray-500 mt-1">Approve or reject payment proofs</p>
        </div>
        <div
          className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer hover:border-blue-200 hover:bg-violet-50/30 transition-colors"
          onClick={() => router.push('/super-admin/stores')}
        >
          <h3 className="font-semibold text-slate-900">Store Management</h3>
          <p className="text-sm text-gray-500 mt-1">View and manage all stores</p>
        </div>
      </div>
    </div>
  )
}
