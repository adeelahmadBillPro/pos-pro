import 'next-auth'

declare module 'next-auth' {
  interface User {
    id: string
    role: string
    storeId?: string
    storeName?: string
    avatar?: string
  }
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role: string
      storeId?: string
      storeName?: string
      avatar?: string
    }
  }
}


export type CartItem = {
  productId: string
  variantId?: string
  name: string
  sku: string
  price: number
  costPrice: number
  quantity: number
  discount: number
  taxable: boolean
  unit: string
  image?: string
}

export type PaymentEntry = {
  method: 'CASH' | 'CARD' | 'JAZZCASH' | 'EASYPAISA' | 'BANK_TRANSFER' | 'STORE_CREDIT'
  amount: number
  reference?: string
}

export type OrderSummary = {
  subtotal: number
  discountAmount: number
  taxAmount: number
  total: number
}
