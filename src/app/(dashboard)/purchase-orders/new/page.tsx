'use client'

import { Suspense, useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, Plus, Trash2, Search, Package, Truck, Send, Save } from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { formatCurrency, cn } from '@/lib/utils'

interface Supplier {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  sku: string
  costPrice: number
  unit: string
  images: string[]
  inventory: { quantity: number } | null
  minStock: number
}

interface POLine {
  productId: string
  productName: string
  sku: string
  unit: string
  quantityOrdered: number
  unitCost: number
}

export default function NewPOPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="w-6 h-6 animate-spin text-amber-500" /></div>}>
      <NewPOContent />
    </Suspense>
  )
}

function NewPOContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedSupplier = searchParams.get('supplier') ?? ''

  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [supplierId, setSupplierId] = useState(preselectedSupplier)
  const [expectedAt, setExpectedAt] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState<POLine[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/suppliers').then(r => r.json()).then(j => j.success && setSuppliers(j.data))
    fetch('/api/products?limit=500&pos=1').then(r => r.json()).then(j => j.success && setProducts(j.data))
  }, [])

  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 12)
    const q = productSearch.toLowerCase()
    return products
      .filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
      )
      .slice(0, 30)
  }, [products, productSearch])

  function addProduct(p: Product) {
    if (lines.find((l) => l.productId === p.id)) {
      toast.warning('Already added')
      return
    }
    setLines((prev) => [
      ...prev,
      {
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        unit: p.unit,
        quantityOrdered: Math.max(p.minStock, 10),
        unitCost: p.costPrice,
      },
    ])
    setProductSearch('')
  }

  function updateLine(idx: number, patch: Partial<POLine>) {
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)))
  }

  function removeLine(idx: number) {
    setLines((prev) => prev.filter((_, i) => i !== idx))
  }

  const subtotal = lines.reduce((s, l) => s + l.quantityOrdered * l.unitCost, 0)

  async function submit(status: 'DRAFT' | 'SENT') {
    if (!supplierId) { toast.error('Select a vendor'); return }
    if (lines.length === 0) { toast.error('Add at least one product'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/purchase-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierId,
          expectedAt: expectedAt || undefined,
          notes,
          status,
          items: lines.map((l) => ({
            productId: l.productId,
            quantityOrdered: l.quantityOrdered,
            unitCost: l.unitCost,
          })),
        }),
      })
      const json = await res.json()
      if (!json.success) { toast.error(json.error || 'Failed to create PO'); return }
      toast.success(`PO ${status === 'SENT' ? 'sent to vendor' : 'saved as draft'}`)
      router.push(`/purchase-orders/${json.data.id}`)
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      <div className="flex items-center gap-2">
        <Link href="/purchase-orders" className="text-sm text-gray-500 hover:text-amber-700 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to POs
        </Link>
      </div>

      <PageHeader
        title="New Purchase Order"
        description="Order stock from a vendor"
      />

      {/* Vendor + meta */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Vendor *</Label>
            <select
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full mt-1 h-10 border border-gray-200 rounded-lg px-3 text-sm bg-white"
            >
              <option value="">Select vendor…</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {suppliers.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">
                No vendors yet. <Link href="/suppliers" className="underline font-medium">Add a vendor →</Link>
              </p>
            )}
          </div>
          <div>
            <Label>Expected Delivery (optional)</Label>
            <Input
              type="date"
              value={expectedAt}
              onChange={(e) => setExpectedAt(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Add products */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Package className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-slate-900">Add Products</h3>
        </div>

        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search product by name or SKU…"
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {productSearch && filteredProducts.length === 0 && (
          <p className="text-sm text-gray-500 py-3 text-center">No products match &ldquo;{productSearch}&rdquo;</p>
        )}

        {(productSearch || lines.length === 0) && filteredProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
            {filteredProducts.map((p) => {
              const stock = p.inventory?.quantity ?? 0
              const isLow = stock <= p.minStock
              return (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  disabled={lines.some((l) => l.productId === p.id)}
                  className={cn(
                    'flex items-center gap-3 p-2 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50/50 transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white',
                  )}
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <Package className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1.5">
                      <span>{p.sku}</span>
                      <span className="text-gray-300">·</span>
                      <span className={isLow ? 'text-rose-600 font-semibold' : ''}>{stock} in stock</span>
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Order lines */}
      {lines.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-slate-900">Order Items <span className="text-gray-400 font-normal">({lines.length})</span></h3>
          </div>

          <div className="divide-y divide-gray-100">
            {lines.map((l, i) => (
              <div key={l.productId} className="px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900 truncate">{l.productName}</p>
                  <p className="text-xs text-gray-500">{l.sku}</p>
                </div>

                <div className="flex items-center gap-2">
                  <div>
                    <Label className="text-[10px] text-gray-500">Qty</Label>
                    <Input
                      type="number"
                      value={l.quantityOrdered}
                      onChange={(e) => updateLine(i, { quantityOrdered: Math.max(1, parseInt(e.target.value) || 0) })}
                      className="w-20 h-8 text-sm tabular-nums"
                      min={1}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] text-gray-500">Cost (Rs)</Label>
                    <Input
                      type="number"
                      value={l.unitCost}
                      onChange={(e) => updateLine(i, { unitCost: parseFloat(e.target.value) || 0 })}
                      className="w-24 h-8 text-sm tabular-nums"
                      min={0}
                      step={0.01}
                    />
                  </div>
                  <div className="w-24 text-right">
                    <p className="text-[10px] text-gray-500">Total</p>
                    <p className="text-sm font-semibold tabular-nums">{formatCurrency(l.quantityOrdered * l.unitCost)}</p>
                  </div>
                  <button
                    onClick={() => removeLine(i)}
                    className="text-gray-300 hover:text-rose-500 p-1.5 transition-colors flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <span className="text-sm text-gray-600">Subtotal</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <Label>Notes (optional)</Label>
        <Input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Delivery instructions, payment terms, etc."
          className="mt-1"
        />
      </div>

      {/* Actions */}
      <div className="sticky bottom-0 bg-gradient-to-t from-white via-white/95 to-white/0 pt-4 pb-2 flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button
          variant="outline"
          onClick={() => submit('DRAFT')}
          disabled={submitting || lines.length === 0 || !supplierId}
          className="gap-1.5"
        >
          <Save className="w-4 h-4" />
          Save as Draft
        </Button>
        <Button
          onClick={() => submit('SENT')}
          disabled={submitting || lines.length === 0 || !supplierId}
          className="gap-1.5 bg-teal-700 hover:bg-teal-800 text-white"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send to Vendor
        </Button>
      </div>
    </div>
  )
}
