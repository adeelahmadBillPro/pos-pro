'use client'

import { useState, useEffect, useCallback } from 'react'
import { RotateCcw, Search, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { toast } from 'sonner'

interface ReturnRecord {
  id: string
  returnNumber: string
  refundAmount: number
  refundMethod: string
  reason: string
  status: string
  createdAt: string
  order: { orderNumber: string; total: number }
  processedBy: { name: string }
  items: Array<{ quantity: number; orderItem: { name: string } }>
}

interface OrderItem {
  id: string
  name: string
  quantity: number
  unitPrice: number
  total: number
  returnItems: Array<{ quantity: number }>
}

interface OrderForReturn {
  id: string
  orderNumber: string
  total: number
  createdAt: string
  items: OrderItem[]
}

export default function ReturnsPage() {
  const [returns, setReturns] = useState<ReturnRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 })
  const [page, setPage] = useState(1)

  const [returnOpen, setReturnOpen] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [searchingOrder, setSearchingOrder] = useState(false)
  const [foundOrder, setFoundOrder] = useState<OrderForReturn | null>(null)
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({})
  const [reason, setReason] = useState('DEFECTIVE')
  const [refundMethod, setRefundMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [processing, setProcessing] = useState(false)

  const loadReturns = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/returns?page=${page}&limit=20`)
      const data = await res.json()
      if (data.success) {
        setReturns(data.data)
        setPagination(data.pagination)
      }
    } catch {
      toast.error('Failed to load returns')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { loadReturns() }, [loadReturns])

  async function searchOrder() {
    if (!orderSearch.trim()) return
    setSearchingOrder(true)
    setFoundOrder(null)
    try {
      const res = await fetch(`/api/orders?search=${orderSearch}&limit=1`)
      const data = await res.json()
      if (data.success && data.data.length > 0) {
        const orderId = data.data[0].id
        const detailRes = await fetch(`/api/orders/${orderId}`)
        const detailData = await detailRes.json()
        if (detailData.success) {
          setFoundOrder(detailData.data)
          setSelectedItems({})
        }
      } else {
        toast.error('Order not found')
      }
    } catch {
      toast.error('Search failed')
    } finally {
      setSearchingOrder(false)
    }
  }

  function toggleItem(itemId: string, maxQty: number) {
    setSelectedItems((prev) => {
      if (prev[itemId]) {
        const { [itemId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [itemId]: 1 }
    })
  }

  function updateItemQty(itemId: string, qty: number) {
    setSelectedItems((prev) => ({ ...prev, [itemId]: qty }))
  }

  async function processReturn() {
    if (!foundOrder) return
    const items = Object.entries(selectedItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }))

    if (items.length === 0) {
      toast.error('Select at least one item to return')
      return
    }

    setProcessing(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: foundOrder.id,
          items,
          reason,
          notes: notes || undefined,
          refundMethod,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Return processed successfully')
        setReturnOpen(false)
        setFoundOrder(null)
        setOrderSearch('')
        setSelectedItems({})
        loadReturns()
      } else {
        toast.error(data.error || 'Failed to process return')
      }
    } catch {
      toast.error('Failed to process return')
    } finally {
      setProcessing(false)
    }
  }

  const refundAmount = foundOrder
    ? foundOrder.items.reduce((sum, item) => {
        const qty = selectedItems[item.id] || 0
        const alreadyReturned = item.returnItems?.reduce((s: number, r: any) => s + r.quantity, 0) || 0
        const unitPrice = item.total / item.quantity
        return sum + (unitPrice * Math.min(qty, item.quantity - alreadyReturned))
      }, 0)
    : 0

  return (
    <div>
      <PageHeader
        title="Returns"
        description={`${pagination.total} returns processed`}
        actions={
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setReturnOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            Process Return
          </Button>
        }
      />

      {loading ? (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <TableSkeleton rows={6} cols={5} />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {returns.length === 0 ? (
            <div className="py-16 text-center">
              <RotateCcw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-900">No returns yet</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Return #</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Order</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Refund</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{r.returnNumber}</p>
                      <p className="text-xs text-gray-400">{formatDateTime(r.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell text-gray-600">{r.order.orderNumber}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-gray-500 text-xs">{r.reason.replace(/_/g, ' ')}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <StatusBadge status={r.refundMethod.toLowerCase()} label={r.refundMethod.replace(/_/g, ' ')} />
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(r.refundAmount)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status.toLowerCase()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Page {page} of {pagination.pages}</p>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="h-7 text-xs">Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)} className="h-7 text-xs">Next</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Process Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={setReturnOpen}>
        <DialogContent className="max-w-lg w-full mx-4">
          <DialogHeader>
            <DialogTitle>Process Return</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Order search */}
            <div>
              <Label>Search Order</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  placeholder="Order number or customer name..."
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchOrder()}
                />
                <Button variant="outline" onClick={searchOrder} disabled={searchingOrder}>
                  {searchingOrder ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {foundOrder && (
              <>
                <div className="bg-gray-50 rounded-lg p-3 text-sm">
                  <p className="font-medium">{foundOrder.orderNumber} — {formatCurrency(foundOrder.total)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(foundOrder.createdAt)}</p>
                </div>

                {/* Items */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {foundOrder.items.map((item) => {
                    const alreadyReturned = item.returnItems?.reduce((s: number, r: any) => s + r.quantity, 0) || 0
                    const available = item.quantity - alreadyReturned
                    const selected = selectedItems[item.id]

                    return (
                      <div key={item.id} className={`flex items-center gap-3 p-2.5 rounded-lg border ${selected ? 'border-violet-300 bg-violet-50' : 'border-gray-200'}`}>
                        <input
                          type="checkbox"
                          checked={!!selected}
                          onChange={() => available > 0 && toggleItem(item.id, available)}
                          disabled={available <= 0}
                          className="rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.name}</p>
                          <p className="text-xs text-gray-400">{item.quantity} ordered {alreadyReturned > 0 ? `(${alreadyReturned} returned)` : ''}</p>
                        </div>
                        {selected && (
                          <Input
                            type="number"
                            min={1}
                            max={available}
                            value={selected}
                            onChange={(e) => updateItemQty(item.id, Math.min(parseInt(e.target.value) || 1, available))}
                            className="w-16 h-7 text-xs px-2"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>

                {Object.keys(selectedItems).length > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800 font-medium">
                    Refund Amount: {formatCurrency(refundAmount)}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Return Reason</Label>
                    <select
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="DEFECTIVE">Defective</option>
                      <option value="WRONG_ITEM">Wrong Item</option>
                      <option value="CUSTOMER_CHANGED_MIND">Changed Mind</option>
                      <option value="DAMAGED_IN_DELIVERY">Damaged Delivery</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <Label>Refund Method</Label>
                    <select
                      value={refundMethod}
                      onChange={(e) => setRefundMethod(e.target.value)}
                      className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white"
                    >
                      <option value="CASH">Cash</option>
                      <option value="ORIGINAL_PAYMENT">Original Method</option>
                      <option value="STORE_CREDIT">Store Credit</option>
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Notes (optional)</Label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional notes..."
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={processing}>
                    Cancel
                  </Button>
                  <Button
                    onClick={processReturn}
                    disabled={processing || Object.keys(selectedItems).length === 0}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {processing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                    Process Return
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
