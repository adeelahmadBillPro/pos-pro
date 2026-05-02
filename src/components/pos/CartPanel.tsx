'use client'

import { useState, useRef, useEffect } from 'react'
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
    orderDiscount,
    loyaltyPointsUsed,
    notes,
    updateQuantity,
    updateItemDiscount,
    removeItem,
    setDiscountCode,
    setOrderDiscount,
    setLoyaltyPointsUsed,
    setCustomer,
    setNotes,
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
  const count = itemCount()

  // ── Animations: track which item keys are entering / exiting ──
  const [removingKeys, setRemovingKeys] = useState<Set<string>>(new Set())
  const [enteringKeys, setEnteringKeys] = useState<Set<string>>(new Set())
  const prevKeysRef = useRef<Set<string>>(new Set())
  const [countPulse, setCountPulse] = useState(false)
  const prevCountRef = useRef(count)

  // Detect newly-added items → mark as entering for one frame
  useEffect(() => {
    const currentKeys = new Set(items.map((i) => `${i.productId}-${i.variantId}`))
    const newKeys = new Set<string>()
    currentKeys.forEach((k) => {
      if (!prevKeysRef.current.has(k)) newKeys.add(k)
    })
    if (newKeys.size > 0) {
      setEnteringKeys((prev) => new Set([...prev, ...newKeys]))
      const timer = setTimeout(() => {
        setEnteringKeys((prev) => {
          const next = new Set(prev)
          newKeys.forEach((k) => next.delete(k))
          return next
        })
      }, 400)
      prevKeysRef.current = currentKeys
      return () => clearTimeout(timer)
    }
    prevKeysRef.current = currentKeys
  }, [items])

  // Pulse cart count when it changes
  useEffect(() => {
    if (count !== prevCountRef.current) {
      setCountPulse(true)
      const t = setTimeout(() => setCountPulse(false), 400)
      prevCountRef.current = count
      return () => clearTimeout(t)
    }
  }, [count])

  // Animated remove: play exit animation, then actually remove from store
  function animatedRemove(productId: string, variantId?: string) {
    const key = `${productId}-${variantId}`
    setRemovingKeys((prev) => new Set([...prev, key]))
    setTimeout(() => {
      removeItem(productId, variantId)
      setRemovingKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }, 250)
  }

  return (
    <div className="flex flex-col bg-white max-h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShoppingCart className={cn('w-4 h-4 text-teal-700 transition-transform flex-shrink-0', countPulse && 'scale-125')} />
          <span className="font-semibold text-slate-900 truncate">
            Cart (<span className={cn('inline-block transition-all', countPulse && 'count-pulse')}>{count}</span>)
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {items.length > 0 && (
            <>
              <button
                onClick={() => {
                  const id = useCartStore.getState().parkCart()
                  if (id) {
                    import('sonner').then(({ toast }) => toast.success('Sale parked. Click "Parked" in top bar to resume.'))
                  }
                }}
                className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded-lg font-medium transition-colors flex items-center gap-1 active:scale-95 transform-gpu"
                title="Park this sale to resume later"
              >
                <Tag className="w-3 h-3" />
                Park
              </button>
              <button
                onClick={() => useCartStore.getState().clearCart()}
                className="text-xs text-red-500 hover:text-red-700 transition-colors hover:underline px-1"
              >
                Clear
              </button>
            </>
          )}
        </div>
      </div>

      {/* Customer selector */}
      <div
        className="px-4 py-2.5 border-b border-gray-100 flex items-center gap-2 cursor-pointer hover:bg-gray-50 transition-colors flex-shrink-0"
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

      {/* Scrollable area: items + discount + notes — natural height up to a max,
          so totals+button sit right below items (no big empty gap) */}
      <div className="overflow-y-auto min-h-0 max-h-[60vh] md:max-h-[55vh]">
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
              const key = `${item.productId}-${item.variantId}`
              const isRemoving = removingKeys.has(key)
              const isEntering = enteringKeys.has(key)

              return (
                <div
                  key={key}
                  className={cn(
                    'px-4 py-3 transition-all duration-250 origin-top',
                    isRemoving && 'opacity-0 -translate-x-4 max-h-0 py-0 overflow-hidden',
                    isEntering && 'cart-bounce',
                  )}
                  style={{
                    transitionProperty: 'opacity, transform, max-height, padding',
                    maxHeight: isRemoving ? 0 : 200,
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(item.price)} / {item.unit}</p>
                    </div>
                    <button
                      onClick={() => animatedRemove(item.productId, item.variantId)}
                      className="text-gray-300 hover:text-red-500 hover:scale-110 active:scale-90 transition-all flex-shrink-0 mt-0.5 p-1"
                      aria-label="Remove item"
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

        {/* Manual order discount — inside scroll */}
        {items.length > 0 && (
          <div className="px-4 py-2 border-t border-gray-100">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-gray-600">Order discount (Rs)</span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    const sub = subtotal()
                    setOrderDiscount(Math.round(sub * 0.05))
                  }}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                  title="5% off subtotal"
                >5%</button>
                <button
                  type="button"
                  onClick={() => {
                    const sub = subtotal()
                    setOrderDiscount(Math.round(sub * 0.1))
                  }}
                  className="text-[10px] px-1.5 py-0.5 border border-gray-200 rounded hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 transition-colors"
                  title="10% off subtotal"
                >10%</button>
                <Input
                  type="number"
                  value={orderDiscount || ''}
                  onChange={(e) => setOrderDiscount(parseFloat(e.target.value) || 0)}
                  className="w-20 h-7 text-xs px-2"
                  min={0}
                  max={subtotal()}
                  placeholder="0"
                />
              </div>
            </div>
            {orderDiscount > 0 && (
              <p className="text-xs text-green-600 mt-0.5 flex items-center justify-between">
                <span>-{formatCurrency(orderDiscount)} off this order</span>
                <button
                  type="button"
                  onClick={() => setOrderDiscount(0)}
                  className="text-rose-500 hover:text-rose-700 hover:underline"
                >clear</button>
              </p>
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
            <Input
              placeholder="Order notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-7 text-xs"
              maxLength={500}
            />
          </div>
        )}
      </div>

      {/* Totals — always visible, never scrolls */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-slate-700 space-y-1.5 flex-shrink-0 bg-gradient-to-b from-white to-amber-50/30 dark:from-slate-900 dark:to-slate-900">
        <div className="flex justify-between text-sm text-gray-600">
          <span>Subtotal</span>
          <span className="font-medium tabular-nums transition-all">{formatCurrency(sub)}</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-sm text-green-600 animate-fade-in">
            <span>Discount Code</span>
            <span className="font-medium tabular-nums">-{formatCurrency(discountAmount)}</span>
          </div>
        )}
        {orderDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600 animate-fade-in">
            <span>Order Discount</span>
            <span className="font-medium tabular-nums">-{formatCurrency(orderDiscount)}</span>
          </div>
        )}
        {loyaltyDiscount > 0 && (
          <div className="flex justify-between text-sm text-green-600 animate-fade-in">
            <span>Loyalty Points</span>
            <span className="font-medium tabular-nums">-{formatCurrency(loyaltyDiscount)}</span>
          </div>
        )}
        {tax > 0 && (
          <div className="flex justify-between text-sm text-gray-600">
            <span>Tax</span>
            <span className="font-medium tabular-nums">{formatCurrency(tax)}</span>
          </div>
        )}
        <Separator />
        <div className="flex justify-between text-base font-bold text-slate-900">
          <span>Total</span>
          <span className={cn('tabular-nums transition-all', countPulse && 'count-pulse')}>{formatCurrency(tot)}</span>
        </div>
      </div>

      {/* Checkout button — always visible, premium style */}
      <div className="px-4 pb-4 flex-shrink-0">
        <button
          className={cn(
            'btn-premium-teal w-full h-12 rounded-xl text-base font-semibold flex items-center justify-center gap-2',
            items.length === 0 && 'opacity-40 cursor-not-allowed shadow-none',
          )}
          disabled={items.length === 0}
          onClick={onCheckout}
        >
          <ShoppingCart className="w-4 h-4" />
          Process Payment — <span className="tabular-nums">{formatCurrency(tot)}</span>
        </button>
      </div>
    </div>
  )
}
