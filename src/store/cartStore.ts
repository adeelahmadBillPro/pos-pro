'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, PaymentEntry } from '@/types'

type Customer = {
  id: string
  name: string
  phone?: string
  loyaltyPoints: number
}

/** Snapshot of an in-progress sale that the cashier wants to set aside. */
export interface ParkedSale {
  id: string                  // unique id (timestamp-based)
  label: string               // optional custom label ("Customer in red shirt")
  items: CartItem[]
  customer: Customer | null
  discountCode: string
  discountAmount: number
  orderDiscount: number
  loyaltyPointsUsed: number
  notes: string
  parkedAt: string            // ISO date
}

const PARKED_KEY = 'pos-parked-sales'

export function getParkedSales(): ParkedSale[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(PARKED_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function setParkedSales(sales: ParkedSale[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(PARKED_KEY, JSON.stringify(sales))
}

interface CartStore {
  items: CartItem[]
  customer: Customer | null
  discountCode: string
  discountAmount: number
  /** Manual order-level discount entered by cashier (separate from coupon code).
   *  Stored as a flat amount in PKR — converted from % at the input. */
  orderDiscount: number
  loyaltyPointsUsed: number
  notes: string
  taxRate: number
  taxEnabled: boolean

  // Computed
  subtotal: () => number
  taxAmount: () => number
  total: () => number

  // Actions
  addItem: (item: CartItem) => void
  removeItem: (productId: string, variantId?: string) => void
  updateQuantity: (productId: string, variantId: string | undefined, qty: number) => void
  updateItemDiscount: (productId: string, variantId: string | undefined, discount: number) => void
  setCustomer: (customer: Customer | null) => void
  setDiscountCode: (code: string) => void
  setDiscountAmount: (amount: number) => void
  setOrderDiscount: (amount: number) => void
  setLoyaltyPointsUsed: (points: number) => void
  setNotes: (notes: string) => void
  setTaxSettings: (rate: number, enabled: boolean) => void
  clearCart: () => void
  /** Save current cart to localStorage as a parked sale. Returns the new id. */
  parkCart: (label?: string) => string | null
  /** Load a parked sale into the active cart and remove it from parked list. */
  resumeParkedSale: (id: string) => boolean
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discountCode: '',
      discountAmount: 0,
      orderDiscount: 0,
      loyaltyPointsUsed: 0,
      notes: '',
      taxRate: 0,
      taxEnabled: false,

      subtotal: () => {
        return get().items.reduce((sum, item) => {
          const itemSubtotal = item.price * item.quantity
          const discountAmt = (itemSubtotal * item.discount) / 100
          return sum + itemSubtotal - discountAmt
        }, 0)
      },

      taxAmount: () => {
        const state = get()
        if (!state.taxEnabled || state.taxRate === 0) return 0
        const taxableSubtotal = state.items
          .filter(i => i.taxable)
          .reduce((sum, item) => {
            const sub = item.price * item.quantity
            const disc = (sub * item.discount) / 100
            return sum + sub - disc
          }, 0)
        const afterDiscount = taxableSubtotal - state.discountAmount
        return Math.max(0, (afterDiscount * state.taxRate) / 100)
      },

      total: () => {
        const state = get()
        const sub = state.subtotal()
        const tax = state.taxAmount()
        const loyalty = state.loyaltyPointsUsed / 100 // 100 points = Rs 1
        return Math.max(0, sub + tax - state.discountAmount - state.orderDiscount - loyalty)
      },

      addItem: (item) => {
        set(state => {
          const existing = state.items.find(
            i => i.productId === item.productId && i.variantId === item.variantId
          )
          if (existing) {
            return {
              items: state.items.map(i =>
                i.productId === item.productId && i.variantId === item.variantId
                  ? { ...i, quantity: i.quantity + 1 }
                  : i
              ),
            }
          }
          return { items: [...state.items, { ...item, quantity: 1 }] }
        })
      },

      removeItem: (productId, variantId) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.productId === productId && i.variantId === variantId)
          ),
        }))
      },

      updateQuantity: (productId, variantId, qty) => {
        if (qty <= 0) {
          get().removeItem(productId, variantId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, quantity: qty }
              : i
          ),
        }))
      },

      updateItemDiscount: (productId, variantId, discount) => {
        set(state => ({
          items: state.items.map(i =>
            i.productId === productId && i.variantId === variantId
              ? { ...i, discount }
              : i
          ),
        }))
      },

      setCustomer: (customer) => set({ customer }),
      setDiscountCode: (code) => set({ discountCode: code }),
      setDiscountAmount: (amount) => set({ discountAmount: amount }),
      setOrderDiscount: (amount) => set({ orderDiscount: Math.max(0, amount) }),
      setLoyaltyPointsUsed: (points) => set({ loyaltyPointsUsed: points }),
      setNotes: (notes) => set({ notes }),

      setTaxSettings: (rate, enabled) => set({ taxRate: rate, taxEnabled: enabled }),

      clearCart: () =>
        set({
          items: [],
          customer: null,
          discountCode: '',
          discountAmount: 0,
          orderDiscount: 0,
          loyaltyPointsUsed: 0,
          notes: '',
        }),

      parkCart: (label) => {
        const state = get()
        if (state.items.length === 0) return null
        const id = `PARK-${Date.now().toString(36).toUpperCase()}`
        const parked: ParkedSale = {
          id,
          label: label?.trim() || `${state.items.length} item${state.items.length > 1 ? 's' : ''} · Rs ${Math.round(state.subtotal())}`,
          items: state.items,
          customer: state.customer,
          discountCode: state.discountCode,
          discountAmount: state.discountAmount,
          orderDiscount: state.orderDiscount,
          loyaltyPointsUsed: state.loyaltyPointsUsed,
          notes: state.notes,
          parkedAt: new Date().toISOString(),
        }
        const existing = getParkedSales()
        setParkedSales([parked, ...existing].slice(0, 20)) // cap at 20 most recent
        // Clear active cart (the cashier needs an empty cart for the next customer)
        set({
          items: [],
          customer: null,
          discountCode: '',
          discountAmount: 0,
          orderDiscount: 0,
          loyaltyPointsUsed: 0,
          notes: '',
        })
        return id
      },

      resumeParkedSale: (id) => {
        const all = getParkedSales()
        const target = all.find((p) => p.id === id)
        if (!target) return false
        set({
          items: target.items,
          customer: target.customer,
          discountCode: target.discountCode,
          discountAmount: target.discountAmount,
          orderDiscount: target.orderDiscount,
          loyaltyPointsUsed: target.loyaltyPointsUsed,
          notes: target.notes,
        })
        // Remove from parked list
        setParkedSales(all.filter((p) => p.id !== id))
        return true
      },
    }),
    {
      name: 'pos-cart',
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        orderDiscount: state.orderDiscount,
        loyaltyPointsUsed: state.loyaltyPointsUsed,
        notes: state.notes,
      }),
    }
  )
)
