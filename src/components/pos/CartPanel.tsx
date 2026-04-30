'use client'

import { useState, useRef } from 'react'
import {
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  User,
  Tag,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface CartPanelProps {
  currency?: string
  onCheckout: () => void
  onSelectCustomer: () => void
}

function EditableQty({
  value,
  onChange,
}: {
  value: number
  onChange: (qty: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  const inputRef = useRef<HTMLInputElement>(null)

  function startEdit() {
    setDraft(String(value))
    setEditing(true)
    setTimeout(() => {
      inputRef.current?.focus()
      inputRef.current?.select()
    }, 0)
  }

  function commitEdit() {
    const parsed = parseInt(draft, 10)
    if (!isNaN(parsed) && parsed > 0) {
      onChange(parsed)
    }
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        value={draft}
        min={1}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commitEdit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
          if (e.key === 'Escape') { setEditing(false) }
        }}
        className="w-10 text-center text-sm font-medium border border-amber-400 rounded outline-none focus:ring-2 focus:ring-amber-300 py-0.5"
      />
    )
  }

  return (
    <span
      onClick={startEdit}
      title="Click to edit quantity"
      className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center cursor-pointer hover:bg-amber-50 hover:text-amber-700 rounded transition-colors select-none"
    >
      {value}
    </span>
  )
}

export function CartPanel({ currency = 'PKR', onCheckout, onSelectCustomer }: CartPanelProps) {
  const {
    items,
    customer,
    discountCode,
    discountAmount,
    loyaltyPointsUsed,
    updateQuantity,
    updateItemDiscount,
    removeItem,
    setDiscountCode,
    setLoyaltyPointsUsed,
    setCustomer,
    subtotal,
    taxAmount,
    total,
  } = useCartStore()
  const itemCount = () => items.reduce((s, i) => s + i.quantity, 0)

  const [discountInput, setDiscountInput] = useState(discountCode)
  const [applyingDiscount, setApplyingDiscount] = useState(false)
  const [discountError, setDiscountError] = useState('')

  async function applyDiscount() {
    if (!discountInput.trim()) return
    setApplyingDiscount(true)
    setDiscountError('')
    try {
      const res = await fetch(`/api/discounts/validate?code=${discountInput}&total=${subtotal()}`)
      const data = await res.json()
      if (data.success) {
        setDiscountCode(discountInput)
        useCartStore.getState().setDiscountAmount(data.data.amount)
      } else {
        setDiscountError(data.error || 'Invalid discount code')
      }
    } catch {
      setDiscountError('Failed to apply discount')
    } finally {
      setApplyingDiscount(false)
    }
  }

  const sub = subtotal()
  const tax = taxAmount()
  const tot = total()
  const loyaltyDiscount = loyaltyPointsUsed * 0.01

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-teal-700" />
          <span className="font-semibold text-slate-900">
            Cart ({itemCount()} items)
          </span>
        </div>
        {items.length > 0 && (
          <button
            onClick={() => useCartStore.getState().clearCart()}
            className="text-xs text-red-500 hover:text-red-700 transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Customer selector */}
      <div
        className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onSelectCustomer}
      >
        <User className="w-4 h-4 text-gray-400" />
        {customer ? (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-900 truncate">{customer.name}</p>
              <p className="text-xs text-gray-400">{customer.loyaltyPoints} pts</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                setCustomer(null)
                setLoyaltyPointsUsed(0)
              }}
              className="text-gray-400 hover:text-red-500 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <span className="text-sm text-gray-500">Select customer (optional)</span>
        )}
      </div>

      {/* Scrollable area: cart items + discount + notes + loyalty */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
            <ShoppingCart className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm">Cart is empty</p>
            <p className="text-xs mt-1">Add products from the left panel</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {items.map((item) => {
              const lineSubtotal = item.price * item.quantity
              const lineDiscount = (lineSubtotal * item.discount) / 100
              const lineTotal = lineSubtotal - lineDiscount

              return (
                <div key={`${item.productId}-${item.variantId}`} className="px-4 py-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId, item.variantId)}
                      className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0 mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-2 gap-2">
                    {/* Qty controls */}
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <EditableQty
                        value={item.quantity}
                        onChange={(qty) => updateQuantity(item.productId, item.variantId, qty)}
                      />
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="px-2 py-1 hover:bg-gray-100 transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Discount input */}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder="Disc %"
                        value={item.discount || ''}
                        onChange={(e) =>
                          updateItemDiscount(
                            item.productId,
                            item.variantId,
                            parseFloat(e.target.value) || 0
                          )
                        }
                        className="w-16 h-7 text-xs px-2"
                        min={0}
                        max={100}
                      />
                      <span className="text-xs text-gray-400">%</span>
                    </div>

                    {/* Line total */}
                    <p className="text-sm font-semibold text-slate-900 flex-shrink-0">
                      {formatCurrency(lineTotal)}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Discount code — inside scroll */}
        {items.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input
                  placeholder="Discount code"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="pl-8 h-8 text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                />
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={applyDiscount}
                disabled={applyingDiscount || !discountInput}
                className="h-8 text-xs"
              >
                Apply
              </Button>
            </div>
            {discountError && <p className="text-xs text-red-500 mt-1">{discountError}</p>}
            {discountAmount > 0 && (
              <p className="text-xs text-green-600 mt-1">Discount applied: -{formatCurrency(discountAmount)}</p>
            )}
          </div>
        )}

        {/* Loyalty points — inside scroll */}
        {customer && customer.loyaltyPoints > 0 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600">Loyalty ({customer.loyaltyPoints} pts)</span>
              <Input
                type="number"
                value={loyaltyPointsUsed || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0
                  setLoyaltyPointsUsed(Math.min(val, customer.loyaltyPoints))
                }}
                className="w-20 h-7 text-xs px-2"
                min={0}
                max={customer.loyaltyPoints}
                placeholder="0"
              />
            </div>
            {loyaltyPointsUsed > 0 && (
              <p className="text-xs text-green-600 mt-0.5">-{formatCurrency(loyaltyDiscount)} discount</p>
            )}
          </div>
        )}

        {/* Notes — inside scroll */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <Input placeholder="Order notes..." value={""} onChange={() => {}} className="h-7 text-xs" />
          </div>
        )}
      </div>

      {/* Totals — always visible, never scrolls */}
      <div className="px-4 py-3 border-t border-gray-200 space-y-1.5 flex-shrink-0">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(sub)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Discount</span>
            <span>-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600">
            <span>Loyalty Points</span>
            <span>-{formatCurrency(loyaltyDiscount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span>{formatCurrency(tax)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-bold text-slate-900">
          <span>Total</span>
          <span>{formatCurrency(tot)}</span>
        </div>
      </div>

      {/* Checkout button — always visible */}
      <div className="px-4 pb-4 flex-shrink-0">
        <Button
          className="w-full bg-teal-700 hover:bg-teal-800 text-white h-12 text-base font-semibold"
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          Process Payment — {formatCurrency(tot)}
        </Button>
      </div>
    </div>
  )
}
