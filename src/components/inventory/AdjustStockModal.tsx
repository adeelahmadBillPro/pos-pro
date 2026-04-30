'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface Product {
  id: string
  name: string
  sku: string
  unit: string
}

interface AdjustStockModalProps {
  open: boolean
  onClose: () => void
  product: Product & { currentStock: number }
  onSuccess?: () => void
}

type AdjustType = 'ADD' | 'SUBTRACT' | 'SET'

const REASONS = [
  'Stock received',
  'Inventory count correction',
  'Damaged goods',
  'Theft/Loss',
  'Return to supplier',
  'Sample/Display',
  'Other',
]

export function AdjustStockModal({ open, onClose, product, onSuccess }: AdjustStockModalProps) {
  const [type, setType] = useState<AdjustType>('ADD')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(false)

  function getPreviewQty() {
    const qty = parseInt(quantity) || 0
    if (type === 'ADD') return product.currentStock + qty
    if (type === 'SUBTRACT') return Math.max(0, product.currentStock - qty)
    if (type === 'SET') return qty
    return product.currentStock
  }

  function handleClose() {
    setType('ADD')
    setQuantity('')
    setReason('')
    setCustomReason('')
    onClose()
  }

  async function handleSubmit() {
    const qty = parseInt(quantity)
    if (!qty || qty < 0) { toast.error('Enter a valid quantity'); return }

    const finalReason = reason === 'Other' ? customReason : reason
    if (!finalReason.trim()) { toast.error('Reason is required'); return }

    setLoading(true)
    try {
      const res = await fetch('/api/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          type,
          quantity: qty,
          notes: finalReason,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Adjustment failed')
        return
      }
      toast.success(`Stock updated: ${product.currentStock} → ${json.data.newQty} ${product.unit}`)
      handleClose()
      onSuccess?.()
    } catch {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const previewQty = getPreviewQty()

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adjust Stock</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Product info */}
          <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{product.name}</p>
              <p className="text-xs text-gray-500">SKU: {product.sku}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-slate-900">{product.currentStock}</p>
              <p className="text-xs text-gray-500">{product.unit}</p>
            </div>
          </div>

          {/* Adjustment type */}
          <div className="space-y-1.5">
            <Label>Adjustment Type</Label>
            <div className="grid grid-cols-3 gap-2">
              {([['ADD', 'Add', 'bg-emerald-50 border-emerald-200 text-emerald-700'], ['SUBTRACT', 'Subtract', 'bg-red-50 border-red-200 text-red-700'], ['SET', 'Set to', 'bg-violet-50 border-blue-200 text-violet-700']] as const).map(([val, label, cls]) => (
                <button
                  key={val}
                  onClick={() => setType(val)}
                  className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                    type === val
                      ? cls + ' border-2'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-1.5">
            <Label>Quantity</Label>
            <Input
              type="number"
              min={0}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
            />
          </div>

          {/* Preview */}
          {quantity && (
            <div className="flex items-center justify-between bg-violet-50 border border-blue-200 rounded-lg px-4 py-3">
              <span className="text-sm text-violet-700">New stock will be</span>
              <span className={`text-xl font-bold ${previewQty <= 0 ? 'text-red-600' : previewQty <= 5 ? 'text-amber-600' : 'text-emerald-700'}`}>
                {previewQty} {product.unit}
              </span>
            </div>
          )}

          {/* Reason */}
          <div className="space-y-1.5">
            <Label>Reason *</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select reason" />
              </SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {reason === 'Other' && (
              <Input
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Describe reason..."
                className="mt-2"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} disabled={loading}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={loading || !quantity || !reason}>
              {loading ? 'Saving...' : 'Adjust Stock'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
