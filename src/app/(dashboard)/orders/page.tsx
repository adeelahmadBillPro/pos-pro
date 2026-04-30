'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Search, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ExportButton } from '@/components/shared/ExportButton'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface Order {
  id: string
  orderNumber: string
  total: number
  status: string
  createdAt: string
  customer: { id: string; name: string; phone: string | null } | null
  cashier: { id: string; name: string }
  items: { id: string; quantity: number; name: string; total: number }[]
  payments: { method: string; amount: number }[]
}

const ORDER_STATUSES = [
  { value: '', label: 'All Statuses' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'REFUNDED', label: 'Refunded' },
]

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<any>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' })
      if (search) params.set('search', search)
      if (status) params.set('status', status)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)

      const res = await fetch(`/api/orders?${params}`)
      const json = await res.json()
      if (json.success) {
        setOrders(json.data)
        setPagination(json.pagination)
      }
    } catch {
      toast.error('Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [page, search, status, fromDate, toDate])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const exportData = orders.map((o) => ({
    'Order #': o.orderNumber,
    Date: formatDateTime(o.createdAt),
    Customer: o.customer?.name || 'Walk-in',
    'Items Count': o.items.reduce((s, i) => s + i.quantity, 0),
    Total: o.total,
    'Payment Method': o.payments.map((p) => p.method).join(', '),
    Status: o.status,
    Cashier: o.cashier.name,
  }))

  return (
    <div>
      <PageHeader
        title="Orders"
        description={`${pagination?.total ?? 0} total orders`}
        actions={<ExportButton data={exportData} filename="orders" label="Export CSV" />}
      />

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            className="pl-9"
            placeholder="Order # or customer name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={status || '_all'} onValueChange={(v) => { setStatus(v === '_all' ? '' : v); setPage(1) }}>
          <SelectTrigger>
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s.value || '_all'} value={s.value || '_all'}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            className="pl-9"
            value={fromDate}
            onChange={(e) => { setFromDate(e.target.value); setPage(1) }}
            placeholder="From date"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="date"
            className="pl-9"
            value={toDate}
            onChange={(e) => { setToDate(e.target.value); setPage(1) }}
            placeholder="To date"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={10} cols={7} />
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 py-16 flex flex-col items-center gap-3">
          <ShoppingCart className="w-12 h-12 text-gray-300" />
          <p className="font-medium text-gray-600">No orders found</p>
          {(search || status || fromDate || toDate) && (
            <Button variant="outline" size="sm" onClick={() => { setSearch(''); setStatus(''); setFromDate(''); setToDate('') }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Desktop */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {['Order #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/orders/${order.id}`)}>
                    <td className="px-4 py-3 font-mono font-medium text-slate-800 text-xs">{order.orderNumber}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 text-slate-700">{order.customer?.name || <span className="text-gray-400">Walk-in</span>}</td>
                    <td className="px-4 py-3 text-gray-600">{order.items.reduce((s, i) => s + i.quantity, 0)}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {order.payments.map((p) => p.method.replace(/_/g, ' ')).join(', ')}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm" className="text-xs" onClick={(e) => { e.stopPropagation(); router.push(`/orders/${order.id}`) }}>
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile */}
          <div className="md:hidden divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="p-4 cursor-pointer hover:bg-gray-50 active:bg-gray-100"
                onClick={() => router.push(`/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-mono font-semibold text-slate-800 text-xs">{order.orderNumber}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{order.customer?.name || 'Walk-in'}</p>
                    <p className="text-xs text-gray-400">{formatDateTime(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatCurrency(order.total)}</p>
                    <StatusBadge status={order.status} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          <span className="text-gray-500">
            {(page - 1) * 20 + 1}–{Math.min(page * 20, pagination.total)} of {pagination.total} orders
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  )
}
