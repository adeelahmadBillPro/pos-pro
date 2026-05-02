import type { LucideIcon } from 'lucide-react'
import {
  ShoppingBag, Coffee, UtensilsCrossed, Smartphone, Laptop,
  Shirt, Pill, Cake, Sparkles, Wrench, Gift, Pen, Store,
} from 'lucide-react'

export type StoreType =
  | 'GROCERY'
  | 'COFFEE_SHOP'
  | 'RESTAURANT'
  | 'ELECTRONICS'
  | 'MOBILE_SHOP'
  | 'CLOTHING'
  | 'PHARMACY'
  | 'BAKERY'
  | 'SALON'
  | 'HARDWARE'
  | 'GIFT_SHOP'
  | 'STATIONERY'
  | 'GENERAL'

export interface StoreTypeMeta {
  type: StoreType
  label: string
  labelUrdu: string
  icon: LucideIcon
  description: string
  emoji: string
  starterCategories: string[]
  /** Tailwind hex-ish for the card accent (border + icon-bg gradient base). */
  accent: string
}

export const STORE_TYPE_META: StoreTypeMeta[] = [
  {
    type: 'GROCERY',
    label: 'Grocery / Kiryana',
    labelUrdu: 'Karyana Store',
    icon: ShoppingBag,
    emoji: '🛒',
    description: 'Mixed retail — daily essentials, snacks, beverages',
    starterCategories: ['Beverages', 'Snacks', 'Dairy', 'Bakery', 'Spices', 'Cleaning', 'Personal Care'],
    accent: 'amber',
  },
  {
    type: 'COFFEE_SHOP',
    label: 'Coffee Shop / Cafe',
    labelUrdu: 'Cafe',
    icon: Coffee,
    emoji: '☕',
    description: 'Hot drinks, cold drinks, pastries, snacks',
    starterCategories: ['Hot Drinks', 'Cold Drinks', 'Pastries', 'Sandwiches', 'Snacks', 'Desserts'],
    accent: 'rose',
  },
  {
    type: 'RESTAURANT',
    label: 'Restaurant',
    labelUrdu: 'Restaurant / Dhaba',
    icon: UtensilsCrossed,
    emoji: '🍽️',
    description: 'Full-service food, takeaway, dine-in',
    starterCategories: ['Appetizers', 'Main Course', 'Beverages', 'Desserts', 'Combo Deals'],
    accent: 'orange',
  },
  {
    type: 'ELECTRONICS',
    label: 'Electronics Shop',
    labelUrdu: 'Electronics',
    icon: Laptop,
    emoji: '💻',
    description: 'Phones, laptops, accessories, gadgets',
    starterCategories: ['Phones', 'Laptops', 'Accessories', 'Cables & Chargers', 'Power Banks', 'Audio'],
    accent: 'violet',
  },
  {
    type: 'MOBILE_SHOP',
    label: 'Mobile Shop',
    labelUrdu: 'Mobile Phones',
    icon: Smartphone,
    emoji: '📱',
    description: 'Phones, repairs, accessories, SIMs',
    starterCategories: ['Smartphones', 'Feature Phones', 'Cases & Covers', 'Screen Protectors', 'Chargers', 'Repairs'],
    accent: 'sky',
  },
  {
    type: 'CLOTHING',
    label: 'Clothing / Boutique',
    labelUrdu: 'Kapde / Boutique',
    icon: Shirt,
    emoji: '👕',
    description: 'Garments, fashion, accessories',
    starterCategories: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories', 'Bags'],
    accent: 'pink',
  },
  {
    type: 'PHARMACY',
    label: 'Pharmacy / Medical Store',
    labelUrdu: 'Medical Store',
    icon: Pill,
    emoji: '💊',
    description: 'Medicines, OTC, personal care',
    starterCategories: ['Prescription', 'OTC Medicines', 'Vitamins', 'Personal Care', 'Baby Care', 'First Aid'],
    accent: 'emerald',
  },
  {
    type: 'BAKERY',
    label: 'Bakery / Sweets',
    labelUrdu: 'Bakery',
    icon: Cake,
    emoji: '🎂',
    description: 'Cakes, bread, sweets, mithai',
    starterCategories: ['Cakes', 'Pastries', 'Bread', 'Sweets / Mithai', 'Cookies', 'Beverages'],
    accent: 'fuchsia',
  },
  {
    type: 'SALON',
    label: 'Salon / Beauty',
    labelUrdu: 'Salon',
    icon: Sparkles,
    emoji: '💇',
    description: 'Hair, skin, beauty services & products',
    starterCategories: ['Hair Services', 'Skin Services', 'Nail Services', 'Products', 'Packages'],
    accent: 'rose',
  },
  {
    type: 'HARDWARE',
    label: 'Hardware / Tools',
    labelUrdu: 'Hardware',
    icon: Wrench,
    emoji: '🔧',
    description: 'Tools, building materials, fittings',
    starterCategories: ['Hand Tools', 'Power Tools', 'Plumbing', 'Electrical', 'Paints', 'Hardware'],
    accent: 'slate',
  },
  {
    type: 'GIFT_SHOP',
    label: 'Gift Shop',
    labelUrdu: 'Gift Shop',
    icon: Gift,
    emoji: '🎁',
    description: 'Gifts, decorations, occasion items',
    starterCategories: ['Birthday', 'Wedding', 'Decoration', 'Cards', 'Toys', 'Accessories'],
    accent: 'red',
  },
  {
    type: 'STATIONERY',
    label: 'Stationery / Books',
    labelUrdu: 'Stationery',
    icon: Pen,
    emoji: '📚',
    description: 'Books, stationery, school supplies',
    starterCategories: ['Books', 'Notebooks', 'Pens & Pencils', 'Art Supplies', 'School Bags', 'Office Supplies'],
    accent: 'blue',
  },
  {
    type: 'GENERAL',
    label: 'Other / General',
    labelUrdu: 'Aur Koi Business',
    icon: Store,
    emoji: '🏪',
    description: 'Anything else — fully customizable',
    starterCategories: [],
    accent: 'teal',
  },
]

export function getStoreTypeMeta(type: string): StoreTypeMeta {
  return STORE_TYPE_META.find((s) => s.type === type) ?? STORE_TYPE_META[STORE_TYPE_META.length - 1]
}

/** Personalized welcome message for the dashboard based on business type. */
export function getWelcomeMessage(type: string, name?: string): string {
  const first = (name ?? 'there').split(' ')[0]
  switch (type) {
    case 'COFFEE_SHOP': return `Welcome back, ${first}! Ready to brew? ☕`
    case 'RESTAURANT':  return `Salam ${first}! Aaj ki service start karein? 🍽️`
    case 'ELECTRONICS': return `Welcome ${first}! Let's track your inventory. 💻`
    case 'MOBILE_SHOP': return `Welcome ${first}! Ready for today's sales? 📱`
    case 'PHARMACY':    return `Welcome ${first}! Helping people stay healthy. 💊`
    case 'BAKERY':      return `Welcome ${first}! Sweet success awaits. 🎂`
    case 'GROCERY':     return `Salam ${first}! Aaj ki sale start karein? 🛒`
    case 'CLOTHING':    return `Welcome ${first}! Let's dress today's customers. 👕`
    case 'SALON':       return `Welcome ${first}! Time to make people feel beautiful. 💇`
    case 'HARDWARE':    return `Welcome ${first}! Building today's projects. 🔧`
    case 'GIFT_SHOP':   return `Welcome ${first}! Spreading joy today. 🎁`
    case 'STATIONERY':  return `Welcome ${first}! Equipping minds today. 📚`
    default:            return `Welcome back, ${first}! 🏪`
  }
}

/** Empty state message for POS cart based on business type. */
export function getEmptyCartMessage(type: string): { title: string; subtitle: string } {
  switch (type) {
    case 'COFFEE_SHOP': return { title: 'Cart is empty', subtitle: 'Brew up an order ☕' }
    case 'RESTAURANT':  return { title: 'Cart is empty', subtitle: 'Take a customer order 🍽️' }
    case 'ELECTRONICS': return { title: 'Cart is empty', subtitle: 'Scan a product to begin 📱' }
    case 'MOBILE_SHOP': return { title: 'Cart is empty', subtitle: 'Scan or search for a phone 📲' }
    case 'PHARMACY':    return { title: 'Cart is empty', subtitle: 'Process a prescription or scan 💊' }
    case 'BAKERY':      return { title: 'Cart is empty', subtitle: 'Add fresh treats to the order 🎂' }
    case 'GROCERY':     return { title: 'Cart is empty', subtitle: 'Scan items from the customer 🛒' }
    case 'CLOTHING':    return { title: 'Cart is empty', subtitle: 'Scan or browse to start 👕' }
    case 'SALON':       return { title: 'No services yet', subtitle: 'Add the services rendered 💇' }
    case 'HARDWARE':    return { title: 'Cart is empty', subtitle: 'Scan tools or materials 🔧' }
    case 'GIFT_SHOP':   return { title: 'Cart is empty', subtitle: 'Add gifts to the order 🎁' }
    case 'STATIONERY':  return { title: 'Cart is empty', subtitle: 'Scan books or supplies 📚' }
    default:            return { title: 'Cart is empty', subtitle: 'Add products from the left panel' }
  }
}

/** Smart placeholder for the "Product name" input. */
export function getProductNamePlaceholder(type: string): string {
  switch (type) {
    case 'COFFEE_SHOP': return 'e.g. Cappuccino, Cold Brew, Croissant'
    case 'RESTAURANT':  return 'e.g. Chicken Karahi, Biryani, Naan'
    case 'ELECTRONICS': return 'e.g. iPhone 15 Pro, Power Bank 10000mAh'
    case 'MOBILE_SHOP': return 'e.g. Samsung Galaxy A54, Screen Protector'
    case 'PHARMACY':    return 'e.g. Panadol Extra, Cough Syrup 100ml'
    case 'BAKERY':      return 'e.g. Chocolate Cake, Donut, Bread Loaf'
    case 'GROCERY':     return 'e.g. Pepsi 500ml, Lays Chips, Surf Excel'
    case 'CLOTHING':    return 'e.g. Men Cotton Shirt L, Ladies Kurti'
    case 'SALON':       return 'e.g. Haircut, Hair Color, Facial'
    case 'HARDWARE':    return 'e.g. Hammer 500g, PVC Pipe 1ft'
    case 'GIFT_SHOP':   return 'e.g. Birthday Card, Gift Wrap, Teddy Bear'
    case 'STATIONERY':  return 'e.g. Geometry Box, A4 Notebook, Pen Pack'
    default:            return 'e.g. Product name'
  }
}

/** Default unit-of-measure suggested when adding a product for this business. */
export function getDefaultUnit(type: string): string {
  switch (type) {
    case 'COFFEE_SHOP': return 'cup'
    case 'RESTAURANT':  return 'plate'
    case 'BAKERY':      return 'pcs'
    case 'PHARMACY':    return 'pack'
    case 'SALON':       return 'service'
    case 'HARDWARE':    return 'pcs'
    default:            return 'pcs'
  }
}

/** A short industry tip shown subtly on the dashboard. */
export function getIndustryTip(type: string): string {
  switch (type) {
    case 'COFFEE_SHOP': return '💡 Track milk and beans daily to avoid stockouts'
    case 'RESTAURANT':  return '💡 Use combo deals to increase average ticket size'
    case 'ELECTRONICS': return '💡 Add IMEI/serial in product notes for warranty claims'
    case 'MOBILE_SHOP': return '💡 Track repair status in customer notes'
    case 'PHARMACY':    return '💡 Check inventory expiry dates regularly'
    case 'BAKERY':      return '💡 Bake-fresh items shouldn\'t track stock — toggle off in product'
    case 'GROCERY':     return '💡 Use bulk import to add 100+ products from Excel quickly'
    case 'CLOTHING':    return '💡 Use SKU to encode size + color (e.g. SHIRT-L-RED)'
    case 'SALON':       return '💡 Mark services with trackStock=off so they don\'t deplete'
    case 'HARDWARE':    return '💡 Use unit "ft" or "kg" for materials sold by length/weight'
    case 'GIFT_SHOP':   return '💡 Use loyalty points to encourage repeat customers'
    case 'STATIONERY':  return '💡 Tag school-season products for back-to-school promos'
    default:            return '💡 Use bulk import to add products quickly from Excel'
  }
}

/** Tailwind class lookup for the card accent — used in the registration grid. */
export const STORE_TYPE_ACCENT_CLASSES: Record<string, { bg: string; ring: string; text: string; gradient: string }> = {
  amber:    { bg: 'bg-amber-50',    ring: 'ring-amber-300',    text: 'text-amber-700',    gradient: 'from-amber-400 to-amber-600' },
  rose:     { bg: 'bg-rose-50',     ring: 'ring-rose-300',     text: 'text-rose-700',     gradient: 'from-rose-400 to-rose-600' },
  orange:   { bg: 'bg-orange-50',   ring: 'ring-orange-300',   text: 'text-orange-700',   gradient: 'from-orange-400 to-orange-600' },
  violet:   { bg: 'bg-violet-50',   ring: 'ring-violet-300',   text: 'text-violet-700',   gradient: 'from-violet-400 to-violet-600' },
  sky:      { bg: 'bg-sky-50',      ring: 'ring-sky-300',      text: 'text-sky-700',      gradient: 'from-sky-400 to-sky-600' },
  pink:     { bg: 'bg-pink-50',     ring: 'ring-pink-300',     text: 'text-pink-700',     gradient: 'from-pink-400 to-pink-600' },
  emerald:  { bg: 'bg-emerald-50',  ring: 'ring-emerald-300',  text: 'text-emerald-700',  gradient: 'from-emerald-400 to-emerald-600' },
  fuchsia:  { bg: 'bg-fuchsia-50',  ring: 'ring-fuchsia-300',  text: 'text-fuchsia-700',  gradient: 'from-fuchsia-400 to-fuchsia-600' },
  slate:    { bg: 'bg-slate-50',    ring: 'ring-slate-300',    text: 'text-slate-700',    gradient: 'from-slate-400 to-slate-600' },
  red:      { bg: 'bg-red-50',      ring: 'ring-red-300',      text: 'text-red-700',      gradient: 'from-red-400 to-red-600' },
  blue:     { bg: 'bg-blue-50',     ring: 'ring-blue-300',     text: 'text-blue-700',     gradient: 'from-blue-400 to-blue-600' },
  teal:     { bg: 'bg-teal-50',     ring: 'ring-teal-300',     text: 'text-teal-700',     gradient: 'from-teal-400 to-teal-600' },
}
