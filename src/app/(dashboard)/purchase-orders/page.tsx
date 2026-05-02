'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Plus, Truck, ClipboardList, Package, CheckCircle2, Clock,
  XCircle, AlertCircle, Search, Loader2, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDate, cn } from '@/lib/utils'

interface PurchaseOrder {
  id: string
  poNumber: string
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
  total: number
  expectedAt: string | null
  receivedAt: string | null
  createdAt: string
  supplier: { id: string; name: string }
  createdBy: { id: string; name: string }
  _count: { items: number }
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-700',   icon: <ClipboardList className="w-3 h-3" /> },
  SENT:      { label: 'Sent',      bg: 'bg-blue-100',    text: 'text-blue-700',    icon: <Truck className="w-3 h-3" /> },
  PARTIAL:   { label: 'Partial',   bg: 'bg-amber-100',   text: 'text-amber-700',   icon: <AlertCircle className="w-3 h-3" /> },
  RECEIVED:  { label: 'Received',  bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" /> },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-100',    text: 'text-rose-700',    icon: <XCircle className="w-3 h-3" /> },
}

export default function PurchaseOrdersPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>}>
      <PurchaseOrdersContent />
    </Suspense>
  )
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams()
  const supplierIdFilter = searchParams.get('supplierId') ?? ''

  const [orders, setOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (statusFilter) params.set('status', statusFilter)
      if (supplierIdFilter) params.set('supplierId', supplierIdFilter)
      const res = await fetch(`/api/purchase-orders?${params}`)
      const json = await res.json()
      if (json.success) setOrders(json.data)
    } catch {
      toast.error('Failed to load purchase orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [search, statusFilter, supplierIdFilter])

  const summary = {
    draft: orders.filter((o) => o.status === 'DRAFT').length,
    sent: orders.filter((o) => o.status === 'SENT').length,
    partial: orders.filter((o) => o.status === 'PARTIAL').length,
    received: orders.filter((o) => o.status === 'RECEIVED').length,
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Purchase Orders"
        description="Track stock orders sent to vendors"
        actions={
          <div className="flex gap-2">
            <Link
              href="/suppliers"
              className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-gray-200 text-sm hover:bg-gray-50 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              Vendors
            </Link>
            <Link href="/purchase-orders/new">
              <Button className="gap-1.5">
                <Plus className="w-4 h-4" /> New PO
              </Button>
            </Link>
          </div>
        }
      />

      {/* Status counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatBox label="Draft" value={summary.draft} icon={<ClipboardList />} accent="slate" onClick={() => setStatusFilter(statusFilter === 'DRAFT' ? '' : 'DRAFT')} active={statusFilter === 'DRAFT'} />
        <StatBox label="Sent / Pending" value={summary.sent} icon={<Truck />} accent="blue" onClick={() => setStatusFilter(statusFilter === 'SENT' ? '' : 'SENT')} active={statusFilter === 'SENT'} />
        <StatBox label="Partial" value={summary.partial} icon={<AlertCircle />} accent="amber" onClick={() => setStatusFilter(statusFilter === 'PARTIAL' ? '' : 'PARTIAL')} active={statusFilter === 'PARTIAL'} />
        <StatBox label="Received" value={summary.received} icon={<CheckCircle2 />} accent="emerald" onClick={() => setStatusFilter(statusFilter === 'RECEIVED' ? '' : 'RECEIVED')} active={statusFilter === 'RECEIVED'} />
      </div>

      {/* Search + filter */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search PO number or supplier…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {(statusFilter || supplierIdFilter) && (
          <button
            onClick={() => {
              setStatusFilter('')
              window.history.replaceState({}, '', '/purchase-orders')
            }}
            className="text-xs text-gray-500 hover:text-slate-700 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* PO list */}
      {loading ? (
        <TableSkeleton rows={5} cols={4} />
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="font-semibold text-slate-700">No purchase orders yet</p>
          <p className="text-sm text-gray-500 mt-1 mb-4">Create your first PO to track stock orders sent to vendors.</p>
          <Link href="/purchase-orders/new">
            <Button className="gap-1.5">
              <Plus className="w-4 h-4" /> Create First PO
            </Button>
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr className="text-xs uppercase tracking-wide text-gray-500">
                  <th className="text-left px-4 py-2.5 font-semibold">PO #</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Vendor</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Items</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Total</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Status</th>
                  <th className="text-left px-4 py-2.5 font-semibold">Date</th>
                  <th className="text-right px-4 py-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((po) => {
                  const status = STATUS_CONFIG[po.status]
                  return (
                    <tr key={po.id} className="hover:bg-amber-50/40 transition-colors">
                      <td className="px-4 py-3">
                        <Link href={`/purchase-orders/${po.id}`} className="font-mono text-amber-700 hover:underline font-semibold">
                          {po.poNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">{po.supplier.name}</td>
                      <td className="px-4 py-3 text-gray-600">{po._count.items}</td>
                      <td className="px-4 py-3 font-semibold tabular-nums">{formatCurrency(po.total)}</td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', status.bg, status.text)}>
                          {status.icon}
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(po.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="text-xs text-amber-700 hover:underline font-medium inline-flex items-center gap-1"
                        >
                          View
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.map((po) => {
              const status = STATUS_CONFIG[po.status]
              return (
                <Link key={po.id} href={`/purchase-orders/${po.id}`} className="block px-4 py-3 hover:bg-amber-50/40 transition-colors">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-mono font-semibold text-amber-700 text-sm">{po.poNumber}</p>
                    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold', status.bg, status.text)}>
                      {status.icon}
                      {status.label}
                    </span>
                  </div>
                  <p className="font-medium text-slate-900">{po.supplier.name}</p>
                  <div className="flex items-center justify-between gap-3 mt-1 text-xs text-gray-500">
                    <span>{po._count.items} items</span>
                    <span className="tabular-nums font-semibold text-slate-700">{formatCurrency(po.total)}</span>
                    <span>{formatDate(po.createdAt)}</span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

function StatBox({
  label, value, icon, accent, onClick, active,
}: {
  label: string
  value: number
  icon: React.ReactNode
  accent: 'slate' | 'blue' | 'amber' | 'emerald'
  onClick: () => void
  active: boolean
}) {
  const colors: Record<string, { bg: string; text: string; ring: string }> = {
    slate:   { bg: 'bg-slate-50',   text: 'text-slate-700',   ring: 'ring-slate-300' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-300' },
    amber:   { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-300' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-300' },
  }
  const c = colors[accent]
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-2xl border-2 p-4 text-left transition-all active:scale-95',
        active ? `${c.bg} border-current ${c.text} ring-4 ${c.ring}` : 'bg-white border-gray-200 hover:border-gray-300',
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center [&_svg]:w-4 [&_svg]:h-4', c.bg, c.text)}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
    </button>
  )
}
