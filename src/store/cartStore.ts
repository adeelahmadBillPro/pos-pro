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

interface CartStore {
  items: CartItem[]
  customer: Customer | null
  discountCode: string
  discountAmount: number
  loyaltyPointsUsed: number
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
  setLoyaltyPointsUsed: (points: number) => void
  setTaxSettings: (rate: number, enabled: boolean) => void
  clearCart: () => void
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      customer: null,
      discountCode: '',
      discountAmount: 0,
      loyaltyPointsUsed: 0,
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
        return Math.max(0, sub + tax - state.discountAmount - loyalty)
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
      setLoyaltyPointsUsed: (points) => set({ loyaltyPointsUsed: points }),

      setTaxSettings: (rate, enabled) => set({ taxRate: rate, taxEnabled: enabled }),

      clearCart: () =>
        set({
          items: [],
          customer: null,
          discountCode: '',
          discountAmount: 0,
          loyaltyPointsUsed: 0,
        }),
    }),
    {
      name: 'pos-cart',
      partialize: (state) => ({
        items: state.items,
        customer: state.customer,
        discountCode: state.discountCode,
        discountAmount: state.discountAmount,
        loyaltyPointsUsed: state.loyaltyPointsUsed,
      }),
    }
  )
)
