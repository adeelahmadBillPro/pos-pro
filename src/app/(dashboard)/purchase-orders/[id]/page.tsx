'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Loader2, Truck, ClipboardList, CheckCircle2, AlertCircle,
  XCircle, Package, Send, Calendar, User, FileText, PackageCheck,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, formatDateTime, cn } from '@/lib/utils'

interface POItem {
  id: string
  productName: string
  sku: string
  quantityOrdered: number
  quantityReceived: number
  unitCost: number
  total: number
  product: { id: string; name: string; images: string[]; unit: string }
}

interface PO {
  id: string
  poNumber: string
  status: 'DRAFT' | 'SENT' | 'PARTIAL' | 'RECEIVED' | 'CANCELLED'
  subtotal: number
  total: number
  notes: string | null
  expectedAt: string | null
  receivedAt: string | null
  createdAt: string
  supplier: { id: string; name: string; phone: string | null; email: string | null }
  createdBy: { name: string }
  receivedBy: { name: string } | null
  items: POItem[]
}

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  DRAFT:     { label: 'Draft',     bg: 'bg-slate-100',   text: 'text-slate-700',   icon: <ClipboardList className="w-3.5 h-3.5" /> },
  SENT:      { label: 'Sent',      bg: 'bg-blue-100',    text: 'text-blue-700',    icon: <Truck className="w-3.5 h-3.5" /> },
  PARTIAL:   { label: 'Partial',   bg: 'bg-amber-100',   text: 'text-amber-700',   icon: <AlertCircle className="w-3.5 h-3.5" /> },
  RECEIVED:  { label: 'Received',  bg: 'bg-emerald-100', text: 'text-emerald-700', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Cancelled', bg: 'bg-rose-100',    text: 'text-rose-700',    icon: <XCircle className="w-3.5 h-3.5" /> },
}

export default function POPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string>('')
  const [po, setPo] = useState<PO | null>(null)
  const [loading, setLoading] = useState(true)
  const [receivingMode, setReceivingMode] = useState(false)
  const [receiveQty, setReceiveQty] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { params.then((p) => setId(p.id)) }, [params])

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/purchase-orders/${id}`)
      const json = await res.json()
      if (json.success) {
        setPo(json.data)
        // Pre-fill receive form with remaining qty
        const init: Record<string, number> = {}
        json.data.items.forEach((it: POItem) => {
          init[it.id] = it.quantityOrdered - it.quantityReceived
        })
        setReceiveQty(init)
      }
    } catch {} finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  async function changeStatus(status: 'SENT' | 'CANCELLED') {
    try {
      const res = await fetch(`/api/purchase-orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes: po?.notes || undefined }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed'); return }
      toast.success(status === 'SENT' ? 'Marked as sent to vendor' : 'PO cancelled')
      load()
    } catch { toast.error('Network error') }
  }

  async function submitReceive() {
    if (!po) return
    const items = Object.entries(receiveQty)
      .map(([itemId, qty]) => ({ itemId, quantityReceived: qty }))
      .filter((i) => i.quantityReceived > 0)

    if (items.length === 0) { toast.error('Enter quantity received for at least one item'); return }

    setSubmitting(true)
    try {
      const res = await fetch(`/api/purchase-orders/${id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to receive'); return }
      toast.success('Items received and added to inventory')
      setReceivingMode(false)
      load()
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || !po) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
      </div>
    )
  }

  const status = STATUS_CONFIG[po.status]
  const totalOrdered = po.items.reduce((s, i) => s + i.quantityOrdered, 0)
  const totalReceived = po.items.reduce((s, i) => s + i.quantityReceived, 0)
  const canReceive = po.status === 'SENT' || po.status === 'PARTIAL'
  const canEdit = po.status === 'DRAFT'

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <Link href="/purchase-orders" className="text-sm text-gray-500 hover:text-amber-700 inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" />
        Back to POs
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-amber-700 font-bold text-lg">{po.poNumber}</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-0.5">{po.supplier.name}</h1>
          <span className={cn('mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', status.bg, status.text)}>
            {status.icon}
            {status.label}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {canEdit && (
            <Button onClick={() => changeStatus('SENT')} className="gap-1.5 bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4" />
              Mark as Sent
            </Button>
          )}
          {canReceive && !receivingMode && (
            <Button onClick={() => setReceivingMode(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white">
              <PackageCheck className="w-4 h-4" />
              Receive Items
            </Button>
          )}
          {(po.status === 'DRAFT' || po.status === 'SENT') && (
            <Button variant="outline" onClick={() => changeStatus('CANCELLED')} className="gap-1.5 text-rose-600 hover:bg-rose-50">
              <XCircle className="w-4 h-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      {/* Meta info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Meta icon={<Truck className="w-4 h-4" />} label="Vendor" value={po.supplier.name} sub={po.supplier.phone ?? po.supplier.email ?? ''} />
        <Meta icon={<Calendar className="w-4 h-4" />} label="Created" value={formatDateTime(po.createdAt)} sub={`by ${po.createdBy.name}`} />
        <Meta icon={<Package className="w-4 h-4" />} label="Progress" value={`${totalReceived} of ${totalOrdered}`} sub={po.items.length === 1 ? '1 item' : `${po.items.length} items`} />
        <Meta icon={<FileText className="w-4 h-4" />} label="Total" value={formatCurrency(po.total)} sub={po.expectedAt ? `Due ${new Date(po.expectedAt).toLocaleDateString()}` : 'No due date'} />
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900">Items</h3>
          {receivingMode && (
            <button
              onClick={() => setReceivingMode(false)}
              className="text-xs text-gray-500 hover:text-slate-700 hover:underline"
            >
              Cancel receiving
            </button>
          )}
        </div>

        <div className="divide-y divide-gray-100">
          {po.items.map((it) => {
            const remaining = it.quantityOrdered - it.quantityReceived
            const percentReceived = (it.quantityReceived / it.quantityOrdered) * 100
            return (
              <div key={it.id} className="px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {it.product?.images?.[0] ? (
                      <img src={it.product.images[0]} alt={it.productName} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-5 h-5 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 truncate">{it.productName}</p>
                        <p className="text-xs text-gray-500 font-mono">{it.sku}</p>
                      </div>
                      <p className="text-sm font-bold tabular-nums text-slate-700 flex-shrink-0">
                        {formatCurrency(it.total)}
                      </p>
                    </div>

                    <div className="mt-2 flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                      <span><strong>Ordered:</strong> {it.quantityOrdered}</span>
                      <span className="text-emerald-700"><strong>Received:</strong> {it.quantityReceived}</span>
                      {remaining > 0 && <span className="text-amber-700"><strong>Pending:</strong> {remaining}</span>}
                      <span className="text-gray-400">@ {formatCurrency(it.unitCost)}/{it.product?.unit ?? 'pcs'}</span>
                    </div>

                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                      <div
                        className={cn('h-full transition-all', percentReceived === 100 ? 'bg-emerald-500' : percentReceived > 0 ? 'bg-amber-500' : 'bg-gray-300')}
                        style={{ width: `${percentReceived}%` }}
                      />
                    </div>

                    {receivingMode && remaining > 0 && (
                      <div className="mt-3 flex items-center gap-2">
                        <Label className="text-xs">Receive now:</Label>
                        <Input
                          type="number"
                          min={0}
                          max={remaining}
                          value={receiveQty[it.id] ?? 0}
                          onChange={(e) => {
                            const v = Math.min(remaining, Math.max(0, parseInt(e.target.value) || 0))
                            setReceiveQty((prev) => ({ ...prev, [it.id]: v }))
                          }}
                          className="w-24 h-8 text-sm"
                        />
                        <span className="text-xs text-gray-500">of {remaining} remaining</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
          <span className="text-sm text-gray-600">Total</span>
          <span className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(po.total)}</span>
        </div>
      </div>

      {/* Receive action bar */}
      {receivingMode && (
        <div className="sticky bottom-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-2">
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex items-center justify-between gap-3">
            <p className="text-sm text-emerald-800">
              <strong>Receive items:</strong> stock levels will increase automatically.
            </p>
            <Button
              onClick={submitReceive}
              disabled={submitting}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              Confirm Receive
            </Button>
          </div>
        </div>
      )}

      {/* Notes */}
      {po.notes && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
          <p className="font-semibold mb-1">Notes:</p>
          <p>{po.notes}</p>
        </div>
      )}

      {/* Receive history */}
      {po.receivedAt && po.receivedBy && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            <span>Fully received on {formatDateTime(po.receivedAt)} by {po.receivedBy.name}</span>
          </p>
        </div>
      )}
    </div>
  )
}

function Meta({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-3">
      <p className="text-[10px] uppercase tracking-wide text-gray-400 font-semibold flex items-center gap-1">
        {icon}
        {label}
      </p>
      <p className="text-sm font-semibold text-slate-900 mt-1 truncate">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{sub}</p>}
    </div>
  )
}
