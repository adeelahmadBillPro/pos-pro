'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Printer, RotateCcw, Package } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { TableSkeleton } from '@/components/shared/LoadingSkeleton'
import { formatCurrency, formatDateTime } from '@/lib/utils'

interface OrderItem {
  id: string
  name: string
  sku: string
  quantity: number
  unitPrice: number
  discount: number
  taxAmount: number
  total: number
  returnItems: { quantity: number }[]
}

interface Order {
  id: string
  orderNumber: string
  total: number
  subtotal: number
  taxAmount: number
  discountAmount: number
  status: string
  notes: string | null
  createdAt: string
  customer: any | null
  cashier: { id: string; name: string; email: string }
  items: OrderItem[]
  payments: { id: string; method: string; amount: number; change: number; reference: string | null }[]
  returns: any[]
}

const RETURN_REASONS = [
  { value: 'DEFECTIVE', label: 'Defective Product' },
  { value: 'WRONG_ITEM', label: 'Wrong Item' },
  { value: 'CUSTOMER_CHANGED_MIND', label: 'Customer Changed Mind' },
  { value: 'DAMAGED_IN_DELIVERY', label: 'Damaged in Delivery' },
  { value: 'OTHER', label: 'Other' },
]

const REFUND_METHODS = [
  { value: 'ORIGINAL_PAYMENT', label: 'Original Payment Method' },
  { value: 'CASH', label: 'Cash' },
  { value: 'STORE_CREDIT', label: 'Store Credit (Loyalty Points)' },
]

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const printRef = useRef<HTMLDivElement>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [orderId, setOrderId] = useState('')

  const [returnOpen, setReturnOpen] = useState(false)
  const [returnItems, setReturnItems] = useState<Record<string, number>>({})
  const [returnReason, setReturnReason] = useState('DEFECTIVE')
  const [refundMethod, setRefundMethod] = useState('CASH')
  const [returnNotes, setReturnNotes] = useState('')
  const [submittingReturn, setSubmittingReturn] = useState(false)

  useEffect(() => {
    params.then(({ id }) => {
      setOrderId(id)
      fetchOrder(id)
    })
  }, [params])

  async function fetchOrder(id: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/orders/${id}`)
      const json = await res.json()
      if (json.success) {
        setOrder(json.data)
      } else {
        toast.error('Order not found')
        router.push('/orders')
      }
    } catch {
      toast.error('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  function openReturn() {
    if (!order) return
    // Initialize return items with 0 for each item
    const initial: Record<string, number> = {}
    order.items.forEach((item) => {
      const alreadyReturned = item.returnItems?.reduce((s: number, r: any) => s + r.quantity, 0) || 0
      const available = item.quantity - alreadyReturned
      initial[item.id] = available > 0 ? 0 : -1 // -1 means fully returned
    })
    setReturnItems(initial)
    setReturnOpen(true)
  }

  function getAvailableToReturn(item: OrderItem) {
    const alreadyReturned = item.returnItems?.reduce((s: number, r: any) => s + r.quantity, 0) || 0
    return item.quantity - alreadyReturned
  }

  async function handleReturn() {
    const itemsToReturn = Object.entries(returnItems)
      .filter(([, qty]) => qty > 0)
      .map(([orderItemId, quantity]) => ({ orderItemId, quantity }))

    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item to return')
      return
    }

    setSubmittingReturn(true)
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order!.id,
          items: itemsToReturn,
          reason: returnReason,
          refundMethod,
          notes: returnNotes || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Return failed'); return }
      toast.success(`Return ${json.data.returnNumber} processed successfully`)
      setReturnOpen(false)
      fetchOrder(orderId)
    } catch {
      toast.error('An error occurred')
    } finally {
      setSubmittingReturn(false)
    }
  }

  function handlePrint() {
    window.print()
  }

  const returnAmount = Object.entries(returnItems)
    .filter(([, qty]) => qty > 0)
    .reduce((sum, [itemId, qty]) => {
      const item = order?.items.find((i) => i.id === itemId)
      if (!item) return sum
      return sum + (item.total / item.quantity) * qty
    }, 0)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-100 rounded animate-pulse" />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <TableSkeleton rows={5} cols={5} />
        </div>
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="space-y-6 max-w-4xl mx-auto" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="w-4 h-4 mr-2" /> Print Receipt
          </Button>
          {order.status === 'COMPLETED' && (
            <Button size="sm" onClick={openReturn}>
              <RotateCcw className="w-4 h-4 mr-2" /> Process Return
            </Button>
          )}
        </div>
      </div>

      {/* Order header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-lg font-bold text-slate-900 font-mono">{order.orderNumber}</h1>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-gray-500">{formatDateTime(order.createdAt)}</p>
            <p className="text-xs text-gray-400 mt-1">Cashier: {order.cashier.name}</p>
          </div>
          {order.customer && (
            <div className="text-sm">
              <p className="font-medium text-slate-800">{order.customer.name}</p>
              {order.customer.phone && <p className="text-gray-500">{order.customer.phone}</p>}
              {order.customer.email && <p className="text-gray-400">{order.customer.email}</p>}
            </div>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-slate-900">Order Items</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Qty', 'Unit Price', 'Discount', 'Tax', 'Total'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const returned = item.returnItems?.reduce((s: number, r: any) => s + r.quantity, 0) || 0
                return (
                  <tr key={item.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{item.name}</p>
                      <p className="text-xs text-gray-400">{item.sku}</p>
                      {returned > 0 && (
                        <span className="text-xs text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                          {returned} returned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-3">{formatCurrency(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-red-600">{item.discount > 0 ? `-${formatCurrency(item.discount)}` : '—'}</td>
                    <td className="px-4 py-3 text-gray-500">{item.taxAmount > 0 ? formatCurrency(item.taxAmount) : '—'}</td>
                    <td className="px-4 py-3 font-semibold">{formatCurrency(item.total)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="border-t border-gray-200 px-6 py-4">
          <div className="ml-auto w-full max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            {order.taxAmount > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Tax</span>
                <span>{formatCurrency(order.taxAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payments */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="font-semibold text-slate-900 mb-4">Payment Summary</h2>
        <div className="space-y-2">
          {order.payments.map((payment) => (
            <div key={payment.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <StatusBadge status={payment.method} label={payment.method.replace(/_/g, ' ')} />
                {payment.reference && <span className="text-xs text-gray-400">Ref: {payment.reference}</span>}
              </div>
              <span className="font-medium">{formatCurrency(payment.amount)}</span>
            </div>
          ))}
          {order.payments.some((p) => p.change > 0) && (
            <div className="flex justify-between text-sm text-gray-500 pt-1 border-t border-gray-100">
              <span>Change Given</span>
              <span>{formatCurrency(order.payments.reduce((s, p) => s + p.change, 0))}</span>
            </div>
          )}
        </div>
      </div>

      {/* Returns */}
      {order.returns.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <h2 className="font-semibold text-amber-900 mb-3">Return History</h2>
          <div className="space-y-2">
            {order.returns.map((ret: any) => (
              <div key={ret.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono font-medium text-amber-900">{ret.returnNumber}</p>
                  <p className="text-amber-700 text-xs">{ret.reason?.replace(/_/g, ' ')} · {ret.refundMethod?.replace(/_/g, ' ')}</p>
                </div>
                <span className="font-semibold text-amber-900">{formatCurrency(ret.refundAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Process Return Dialog */}
      <Dialog open={returnOpen} onOpenChange={(o) => !o && setReturnOpen(false)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Process Return — {order?.orderNumber}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2 max-h-[70vh] overflow-y-auto">
            {/* Items selection */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold">Select Items to Return</Label>
              {order.items.map((item) => {
                const available = getAvailableToReturn(item)
                return (
                  <div key={item.id} className={`flex items-center gap-3 p-3 rounded-lg border ${available === 0 ? 'opacity-50 bg-gray-50' : 'bg-white border-gray-200'}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        Ordered: {item.quantity} · Available to return: {available}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={available}
                        className="w-20 text-center"
                        value={available > 0 ? (returnItems[item.id] || 0) : 0}
                        disabled={available === 0}
                        onChange={(e) => {
                          const val = Math.min(parseInt(e.target.value) || 0, available)
                          setReturnItems((p) => ({ ...p, [item.id]: val }))
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Reason */}
            <div className="space-y-1.5">
              <Label>Return Reason *</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RETURN_REASONS.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Refund method */}
            <div className="space-y-1.5">
              <Label>Refund Method</Label>
              <Select value={refundMethod} onValueChange={setRefundMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REFUND_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Input value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Additional notes..." />
            </div>

            {/* Refund amount preview */}
            {returnAmount > 0 && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex justify-between items-center">
                <span className="text-sm text-emerald-700">Refund Amount</span>
                <span className="font-bold text-emerald-700">{formatCurrency(returnAmount)}</span>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setReturnOpen(false)} disabled={submittingReturn}>Cancel</Button>
              <Button onClick={handleReturn} disabled={submittingReturn || returnAmount === 0}>
                {submittingReturn ? 'Processing...' : 'Process Return'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
