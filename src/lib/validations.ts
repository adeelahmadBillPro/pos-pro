import { z } from 'zod'

const pkPhoneRegex = /^(\+92|0092|0)?3[0-9]{9}$/

export const loginSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Min 6 characters'),
})

export const STORE_TYPES = [
  'GROCERY',
  'COFFEE_SHOP',
  'RESTAURANT',
  'ELECTRONICS',
  'MOBILE_SHOP',
  'CLOTHING',
  'PHARMACY',
  'BAKERY',
  'SALON',
  'HARDWARE',
  'GIFT_SHOP',
  'STATIONERY',
  'GENERAL',
] as const

export type StoreType = (typeof STORE_TYPES)[number]

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50),
  email: z.string().email('Valid email required'),
  password: z.string()
    .min(8, 'Min 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase')
    .regex(/[0-9]/, 'Must contain number'),
  confirmPassword: z.string(),
  storeName: z.string().min(2, 'Store name required').max(100),
  storeType: z.enum(STORE_TYPES).default('GENERAL'),
  phone: z.string().regex(pkPhoneRegex, 'Valid Pakistani number required'),
  city: z.string().min(2, 'City required'),
  terms: z.literal(true).refine((v) => v === true, { message: 'You must accept terms' }),
}).refine(d => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export const productSchema = z.object({
  name: z.string().min(1, 'Product name required').max(200),
  sku: z.string().min(1, 'SKU required').max(50),
  barcode: z.string().max(50).optional(),
  price: z.number().min(0.01, 'Price must be greater than 0').max(9999999),
  costPrice: z.number().min(0, 'Cost cannot be negative').max(9999999),
  categoryId: z.string().optional(),
  description: z.string().max(1000).optional(),
  taxable: z.boolean().default(true),
  trackStock: z.boolean().default(true),
  minStock: z.number().int().min(0).default(5),
  initialStock: z.number().int().min(0).default(0),
  unit: z.string().default('pcs'),
  images: z.array(z.string()).default([]),
})

export const categorySchema = z.object({
  name: z.string().min(1, 'Category name required').max(100),
  parentId: z.string().optional(),
  image: z.string().optional(),
  sortOrder: z.number().int().min(0).default(0),
})

export const customerSchema = z.object({
  name: z.string().min(2, 'Name required').max(100),
  phone: z.string().regex(pkPhoneRegex, 'Valid Pakistani number required').optional().or(z.literal('')),
  email: z.string().email('Valid email').optional().or(z.literal('')),
  address: z.string().max(300).optional(),
  city: z.string().max(100).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  notes: z.string().max(500).optional(),
  customerGroup: z.enum(['RETAIL', 'WHOLESALE', 'VIP']).default('RETAIL'),
})

export const orderSchema = z.object({
  customerId: z.string().optional(),
  items: z.array(z.object({
    productId: z.string(),
    variantId: z.string().optional(),
    quantity: z.number().int().min(1),
    unitPrice: z.number().min(0),
    discount: z.number().min(0).max(100).default(0),
  })).min(1, 'At least one item required'),
  payments: z.array(z.object({
    method: z.enum(['CASH', 'CARD', 'JAZZCASH', 'EASYPAISA', 'BANK_TRANSFER', 'STORE_CREDIT']),
    amount: z.number().min(0.01),
    reference: z.string().optional(),
  })).min(1, 'Payment required'),
  discountCode: z.string().optional(),
  /** Manual cashier-applied flat discount on the whole order (in PKR). */
  orderDiscount: z.number().min(0).default(0),
  loyaltyPointsUsed: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
})

export const inventoryAdjustSchema = z.object({
  productId: z.string(),
  variantId: z.string().optional(),
  type: z.enum(['ADD', 'SUBTRACT', 'SET']),
  quantity: z.number().int().min(0),
  notes: z.string().min(1, 'Reason required').max(300),
})

export const discountSchema = z.object({
  name: z.string().min(1).max(100),
  code: z.string().max(20).optional(),
  type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT']),
  value: z.number().min(0.01),
  minOrderValue: z.number().min(0).optional(),
  maxUses: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
}).refine(d => {
  if (d.type === 'PERCENTAGE') return d.value <= 100
  return true
}, { message: 'Percentage cannot exceed 100%', path: ['value'] })

export const staffSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(pkPhoneRegex).optional().or(z.literal('')),
  role: z.enum(['MANAGER', 'CASHIER', 'VIEWER']),
  pin: z.string().length(4).regex(/^\d{4}$/, '4 digit PIN required').optional().or(z.literal('')),
  password: z.string().min(8).optional(),
})

export const paymentProofSchema = z.object({
  planId: z.string().min(1, 'Plan required'),
  amount: z.number().min(1),
  durationMonths: z.number().int().min(1).max(12),
  transactionId: z.string().max(100).optional(),
  bankName: z.string().min(1, 'Bank name required').max(100),
  senderName: z.string().min(2, 'Sender name required').max(100),
  senderPhone: z.string().regex(pkPhoneRegex).optional().or(z.literal('')),
  screenshotUrl: z.string().min(1, 'Screenshot required'),
  notes: z.string().max(300).optional(),
})

export const settingsSchema = z.object({
  name: z.string().min(2).max(100),
  address: z.string().max(300).optional(),
  phone: z.string().regex(pkPhoneRegex).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  city: z.string().max(100).optional(),
  currency: z.string().default('PKR'),
  taxRate: z.number().min(0).max(100).default(0),
  taxName: z.string().default('GST'),
  taxEnabled: z.boolean().default(false),
  requireCustomer: z.boolean().default(false),
  allowNegativeStock: z.boolean().default(false),
  autoApplyTax: z.boolean().default(true),
  lowStockThreshold: z.number().int().min(0).default(10),
  receiptHeader: z.string().max(200).optional(),
  receiptFooter: z.string().max(200).optional(),
  receiptShowLogo: z.boolean().default(true),
  logo: z.string().optional(),
})

export const returnSchema = z.object({
  orderId: z.string().min(1),
  items: z.array(z.object({
    orderItemId: z.string(),
    quantity: z.number().int().min(1),
  })).min(1, 'At least one item required'),
  reason: z.enum(['DEFECTIVE', 'WRONG_ITEM', 'CUSTOMER_CHANGED_MIND', 'DAMAGED_IN_DELIVERY', 'OTHER']),
  notes: z.string().max(500).optional(),
  refundMethod: z.enum(['ORIGINAL_PAYMENT', 'CASH', 'STORE_CREDIT']),
})

export type LoginInput = z.infer<typeof loginSchema>
export type RegisterInput = z.infer<typeof registerSchema>
export type ProductInput = z.output<typeof productSchema>
export type CategoryInput = z.output<typeof categorySchema>
export type CustomerInput = z.output<typeof customerSchema>
export type OrderInput = z.output<typeof orderSchema>
export type DiscountInput = z.output<typeof discountSchema>
export type StaffInput = z.output<typeof staffSchema>
export type SettingsInput = z.output<typeof settingsSchema>
export type ReturnInput = z.output<typeof returnSchema>
