'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Barcode, Loader2, UserPlus, X, Clock, HelpCircle, ShoppingCart } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { CartPanel } from '@/components/pos/CartPanel'
import { PaymentModal } from '@/components/pos/PaymentModal'
import { ReceiptModal } from '@/components/pos/ReceiptModal'
import { useCartStore } from '@/store/cartStore'
import { toast } from 'sonner'
import type { CartItem, PaymentEntry } from '@/types/index'
import { useSession } from 'next-auth/react'

interface Category { id: string; name: string }

interface Product {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  costPrice: number
  taxable: boolean
  unit: string
  images: string[]
  minStock: number
  categoryId: string | null
  inventory: { quantity: number } | null
}

interface StoreSettings {
  taxRate: number
  taxEnabled: boolean
  currency: string
  storeName: string
  storeAddress: string
  storePhone: string
  receiptHeader: string
  receiptFooter: string
}

interface CustomerSearch {
  id: string
  name: string
  phone: string
  loyaltyPoints: number
}

// Products stored in recently used (subset of Product fields)
interface RecentProduct {
  id: string
  name: string
  sku: string
  price: number
  costPrice: number
  unit: string
  taxable: boolean
  images: string[]
  inventory: { quantity: number } | null
}

const RECENT_KEY = 'pos_recent_products'
const RECENT_MAX = 8

function loadRecentProducts(): RecentProduct[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveRecentProduct(p: RecentProduct) {
  const current = loadRecentProducts()
  const filtered = current.filter((x) => x.id !== p.id)
  const updated = [p, ...filtered].slice(0, RECENT_MAX)
  try {
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
  } catch {}
  return updated
}

export default function POSPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [settings, setSettings] = useState<StoreSettings | null>(null)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [receiptOpen, setReceiptOpen] = useState(false)
  const [completedOrder, setCompletedOrder] = useState<any>(null)
  const [customerSearch, setCustomerSearch] = useState('')
  const [customerResults, setCustomerResults] = useState<CustomerSearch[]>([])
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false)
  const [searchingCustomers, setSearchingCustomers] = useState(false)
  const [scannerActive, setScannerActive] = useState(false)
  const [lastScanned, setLastScanned] = useState('')

  // New state
  const [currentTime, setCurrentTime] = useState('')
  const [searchDropdownOpen, setSearchDropdownOpen] = useState(false)
  const [recentProducts, setRecentProducts] = useState<RecentProduct[]>([])
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)
  const [mobileTab, setMobileTab] = useState<'products' | 'cart'>('products')

  // Barcode scanner state
  const barcodeBuffer = useRef('')
  const barcodeTimer = useRef<NodeJS.Timeout | null>(null)
  const allProducts = useRef<Product[]>([])
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const cart = useCartStore()

  // Clock
  useEffect(() => {
    function tick() {
      const now = new Date()
      setCurrentTime(
        now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Load recent products from localStorage
  useEffect(() => {
    setRecentProducts(loadRecentProducts())
  }, [])

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const s = res.data
          setSettings({
            taxRate: s.taxRate ?? 0,
            taxEnabled: s.taxEnabled ?? false,
            currency: s.currency ?? 'PKR',
            storeName: s.name ?? '',
            storeAddress: s.address ?? '',
            storePhone: s.phone ?? '',
            receiptHeader: s.receiptHeader ?? '',
            receiptFooter: s.receiptFooter ?? '',
          })
          cart.setTaxSettings(s.taxRate ?? 0, s.taxEnabled ?? false)
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((res) => { if (res.success) setCategories(res.data) })
      .catch(() => {})
  }, [])

  // Load ALL products once (for barcode lookup + instant search)
  useEffect(() => {
    fetch('/api/products?limit=500&pos=1')
      .then((r) => r.json())
      .then((res) => { if (res.success) allProducts.current = res.data })
      .catch(() => {})
  }, [])

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (selectedCategory !== 'all') params.set('categoryId', selectedCategory)
      params.set('limit', '100')
      params.set('pos', '1')
      const res = await fetch(`/api/products?${params}`)
      const data = await res.json()
      if (data.success) setProducts(data.data)
    } catch {
      toast.error('Failed to load products')
    } finally {
      setLoadingProducts(false)
    }
  }, [search, selectedCategory])

  useEffect(() => {
    const timer = setTimeout(loadProducts, 300)
    return () => clearTimeout(timer)
  }, [loadProducts])

  // Close search dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setSearchDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // ── Global Keyboard Shortcuts ──────────────────────────────────────────────
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const isSearchBox = target === searchInputRef.current
      const isInput = (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') && !isSearchBox

      // F2 → focus search
      if (e.key === 'F2') {
        e.preventDefault()
        searchInputRef.current?.focus()
        searchInputRef.current?.select()
        return
      }

      // F4 → open payment (only if cart has items)
      if (e.key === 'F4') {
        e.preventDefault()
        if (cart.items.length > 0) {
          setPaymentOpen(true)
        } else {
          toast.info('Add items to cart first')
        }
        return
      }

      // F6 → open customer search
      if (e.key === 'F6') {
        e.preventDefault()
        setCustomerSearchOpen(true)
        return
      }

      // F9 → clear cart confirmation
      if (e.key === 'F9') {
        e.preventDefault()
        if (cart.items.length > 0) {
          setClearConfirmOpen(true)
        }
        return
      }

      // Escape → clear search OR close dialogs
      if (e.key === 'Escape') {
        if (shortcutsOpen) { setShortcutsOpen(false); return }
        if (clearConfirmOpen) { setClearConfirmOpen(false); return }
        if (customerSearchOpen) { setCustomerSearchOpen(false); return }
        if (searchDropdownOpen) { setSearchDropdownOpen(false); return }
        if (search) { setSearch(''); return }
        return
      }

      // --- Barcode scanner logic ---
      // Skip ALL input fields including the search box — scanner only works
      // when no input is focused (gun sends to window, not to a field)
      if (isInput || isSearchBox) return

      if (e.key === 'Enter') {
        const code = barcodeBuffer.current.trim()
        barcodeBuffer.current = ''
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        setScannerActive(false)
        if (code.length >= 3) {
          handleBarcodeScanned(code)
        }
        return
      }

      if (e.key.length === 1) {
        barcodeBuffer.current += e.key
        setScannerActive(true)

        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => {
          // Timeout without Enter = slow typing, not a scanner — discard
          barcodeBuffer.current = ''
          setScannerActive(false)
        }, 80)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [search, searchDropdownOpen, shortcutsOpen, clearConfirmOpen, customerSearchOpen, cart.items.length])

  function handleBarcodeScanned(code: string) {
    setScannerActive(false)
    setLastScanned(code)

    const matched = allProducts.current.find(
      (p) =>
        p.barcode?.toLowerCase() === code.toLowerCase() ||
        p.sku?.toLowerCase() === code.toLowerCase()
    )

    if (!matched) {
      toast.error(`No product found for: ${code}`, { duration: 2000 })
      return
    }

    if (matched.inventory && matched.inventory.quantity <= 0) {
      toast.warning(`${matched.name} is out of stock`)
      return
    }

    addProductToCart(matched)
    toast.success(`✓ ${matched.name}`, { duration: 1500 })
    setTimeout(() => setLastScanned(''), 2000)
  }

  function addProductToCart(p: Product | RecentProduct) {
    const item: CartItem = {
      productId: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      costPrice: p.costPrice,
      quantity: 1,
      discount: 0,
      taxable: p.taxable,
      unit: p.unit,
      image: p.images?.[0],
    }
    cart.addItem(item)

    // Save to recently used
    const recent: RecentProduct = {
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      costPrice: p.costPrice,
      unit: p.unit,
      taxable: p.taxable,
      images: p.images ?? [],
      inventory: p.inventory ?? null,
    }
    const updated = saveRecentProduct(recent)
    setRecentProducts(updated)
  }

  async function handlePaymentConfirm(payments: PaymentEntry[], cashReceived: number) {
    const payload = {
      customerId: cart.customer?.id,
      items: cart.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.price,
        discount: item.discount,
      })),
      payments,
      discountCode: cart.discountCode || undefined,
      loyaltyPointsUsed: cart.loyaltyPointsUsed,
      notes: undefined,
    }

    const res = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!data.success) {
      toast.error(data.error || 'Failed to process sale')
      throw new Error(data.error)
    }

    setCompletedOrder(data.data)
    cart.clearCart()
    setPaymentOpen(false)
    setReceiptOpen(true)
    toast.success('Sale completed!')
  }

  function handleAddToCart(item: CartItem) {
    cart.addItem(item)

    // Find product in allProducts to save to recently used
    const prod = allProducts.current.find((p) => p.id === item.productId)
    if (prod) {
      const recent: RecentProduct = {
        id: prod.id,
        name: prod.name,
        sku: prod.sku,
        price: prod.price,
        costPrice: prod.costPrice,
        unit: prod.unit,
        taxable: prod.taxable,
        images: prod.images ?? [],
        inventory: prod.inventory ?? null,
      }
      const updated = saveRecentProduct(recent)
      setRecentProducts(updated)
    }

    toast.success(`${item.name} added`, { duration: 1000 })
  }

  function handleSelectCustomer(c: CustomerSearch) {
    cart.setCustomer({ id: c.id, name: c.name, phone: c.phone, loyaltyPoints: c.loyaltyPoints })
    setCustomerSearchOpen(false)
    setCustomerSearch('')
    toast.success(`Customer: ${c.name}`)
  }

  useEffect(() => {
    if (!customerSearch || customerSearch.length < 2) {
      setCustomerResults([])
      return
    }
    setSearchingCustomers(true)
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/customers?search=${customerSearch}&limit=5`)
        const data = await res.json()
        if (data.success) setCustomerResults(data.data)
      } catch { } finally {
        setSearchingCustomers(false)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [customerSearch])

  // Instant search results from allProducts ref (no API call)
  const instantResults: Product[] = search.length >= 1
    ? allProducts.current
        .filter((p) => {
          const q = search.toLowerCase()
          return (
            p.name.toLowerCase().includes(q) ||
            p.sku?.toLowerCase().includes(q) ||
            (p.barcode && p.barcode.toLowerCase().includes(q))
          )
        })
        .slice(0, 8)
    : []

  const cartItemCount = cart.items.reduce((s, i) => s + i.quantity, 0)
  const loyaltyEarned = completedOrder ? Math.floor(completedOrder.total / 100) : 0
  const cashierName = session?.user?.name ?? 'Cashier'

  return (
    <div className="flex flex-col flex-1 -m-4 md:-m-6 overflow-hidden min-h-0">

      {/* ── POS Header Bar ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-teal-700 text-white text-xs flex-shrink-0">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 opacity-80" />
          <span className="font-mono font-medium tracking-wide">{currentTime}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="opacity-80">Cashier: <span className="font-semibold opacity-100">{cashierName}</span></span>
          <div className="flex items-center gap-1.5 bg-amber-400 text-slate-900 rounded-full px-2.5 py-0.5 font-semibold">
            <ShoppingCart className="w-3 h-3" />
            <span>{cartItemCount}</span>
          </div>
        </div>
      </div>

      {/* ── Main Content ─────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Products */}
        <div className={`flex-col min-w-0 border-r border-gray-200 bg-gray-50 flex-1 ${
          mobileTab === 'cart' ? 'hidden md:flex' : 'flex'
        }`}>
          {/* Search + scanner indicator */}
          <div className="p-3 border-b border-gray-200 bg-white space-y-2">
            <div className="flex gap-2">
              {/* Search with instant dropdown */}
              <div className="relative flex-1" ref={searchContainerRef}>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
                <Input
                  ref={searchInputRef}
                  placeholder="Search by name, SKU or barcode… (F2)"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setSearchDropdownOpen(e.target.value.length > 0)
                  }}
                  onFocus={() => {
                    if (search.length > 0) setSearchDropdownOpen(true)
                  }}
                  className="pl-9 pr-9"
                />
                {search && (
                  <button
                    onClick={() => { setSearch(''); setSearchDropdownOpen(false) }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Instant Search Dropdown */}
                {searchDropdownOpen && instantResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
                    {instantResults.map((p) => {
                      const outOfStock = p.inventory !== null && p.inventory.quantity <= 0
                      return (
                        <button
                          key={p.id}
                          disabled={outOfStock}
                          onClick={() => {
                            if (outOfStock) return
                            addProductToCart(p)
                            setSearch('')
                            setSearchDropdownOpen(false)
                            toast.success(`${p.name} added`, { duration: 1000 })
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-gray-50 last:border-b-0 ${
                            outOfStock ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-amber-50'
                          }`}
                        >
                          {/* Product image */}
                          <div className="w-10 h-10 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
                            {p.images?.[0] ? (
                              <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-300 text-lg font-bold">
                                {p.name[0]}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="text-sm font-semibold text-teal-700">
                              {settings?.currency ?? 'PKR'} {p.price.toLocaleString()}
                            </span>
                            {outOfStock ? (
                              <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">
                                Out of stock
                              </span>
                            ) : (
                              <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">
                                {p.inventory?.quantity ?? '∞'} in stock
                              </span>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}

                {searchDropdownOpen && search.length >= 1 && instantResults.length === 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-4 text-center text-sm text-gray-400">
                    No products match &quot;{search}&quot;
                  </div>
                )}
              </div>

              {/* Scanner status indicator */}
              <div className={`flex items-center gap-1.5 px-3 rounded-lg border text-xs font-medium flex-shrink-0 transition-colors ${
                scannerActive
                  ? 'bg-amber-50 border-amber-300 text-amber-700'
                  : lastScanned
                  ? 'bg-green-50 border-green-300 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-400'
              }`}>
                <Barcode className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {scannerActive ? 'Scanning…' : lastScanned ? lastScanned : 'Scanner ready'}
                </span>
              </div>
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-amber-400 text-slate-900'
                    : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    selectedCategory === cat.id
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* ── Recently Used Bar ─────────────────────────────────────────── */}
          {recentProducts.length > 0 && (
            <div className="px-3 pt-3 pb-0 bg-white border-b border-gray-100">
              <div className="flex items-center gap-1.5 mb-2">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recently Used</span>
              </div>
              <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar">
                {recentProducts.map((p) => {
                  const outOfStock = p.inventory !== null && p.inventory.quantity <= 0
                  return (
                    <button
                      key={p.id}
                      disabled={outOfStock}
                      onClick={() => {
                        if (outOfStock) { toast.warning(`${p.name} is out of stock`); return }
                        addProductToCart(p)
                        toast.success(`${p.name} added`, { duration: 1000 })
                      }}
                      className={`flex-shrink-0 flex flex-col items-center gap-1 p-2 rounded-xl border transition-all w-20 text-center ${
                        outOfStock
                          ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                          : 'border-amber-100 bg-amber-50 hover:bg-amber-100 hover:border-amber-300'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-lg bg-white border border-gray-100 overflow-hidden flex items-center justify-center text-gray-300 text-sm font-bold flex-shrink-0">
                        {p.images?.[0] ? (
                          <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <span>{p.name[0]}</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-tight line-clamp-2 w-full">{p.name}</p>
                      <p className="text-xs text-teal-700 font-semibold">{p.price.toLocaleString()}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Product grid */}
          <div className="flex-1 overflow-y-auto p-3">
            {loadingProducts ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
              </div>
            ) : (
              <ProductGrid products={products} onAdd={handleAddToCart} />
            )}
          </div>
        </div>

        {/* Right Panel - Cart */}
        <div className={`flex-shrink-0 flex flex-col bg-white ${
          mobileTab === 'products'
            ? 'hidden md:flex md:w-80 lg:w-96'
            : 'flex w-full md:w-80 lg:w-96'
        }`}>
          <CartPanel
            currency={settings?.currency}
            onCheckout={() => setPaymentOpen(true)}
            onSelectCustomer={() => setCustomerSearchOpen(true)}
          />
        </div>
      </div>

      {/* ── Mobile Tab Bar ───────────────────────────────────────────────── */}
      <div className="md:hidden flex border-t border-gray-200 bg-white flex-shrink-0">
        <button
          onClick={() => setMobileTab('products')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            mobileTab === 'products'
              ? 'text-teal-700 border-t-2 border-teal-600 -mt-px'
              : 'text-gray-500'
          }`}
        >
          <Search className="w-4 h-4" />
          Products
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-colors ${
            mobileTab === 'cart'
              ? 'text-teal-700 border-t-2 border-teal-600 -mt-px'
              : 'text-gray-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          Cart
          {cartItemCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Floating Shortcuts Button ─────────────────────────────────────── */}
      <button
        onClick={() => setShortcutsOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-10 h-10 rounded-full bg-teal-700 text-white shadow-lg hover:bg-teal-800 transition-colors flex items-center justify-center"
        title="Keyboard shortcuts"
      >
        <HelpCircle className="w-5 h-5" />
      </button>

      {/* ── Shortcuts Help Dialog ─────────────────────────────────────────── */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50" onClick={() => setShortcutsOpen(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate-900">Keyboard Shortcuts</h3>
              <button onClick={() => setShortcutsOpen(false)}>
                <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <div className="space-y-2">
              {[
                ['F2', 'Focus Search'],
                ['F4', 'Process Payment'],
                ['F6', 'Select Customer'],
                ['F9', 'Clear Cart'],
                ['⌫', 'Barcode Scanner (auto)'],
                ['Esc', 'Close / Clear'],
              ].map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{label}</span>
                  <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs font-mono text-slate-700 font-semibold">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4 text-center">Press Esc to close</p>
          </div>
        </div>
      )}

      {/* ── Clear Cart Confirmation ───────────────────────────────────────── */}
      {clearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-5">
            <h3 className="font-bold text-slate-900 mb-2">Clear Cart?</h3>
            <p className="text-sm text-gray-500 mb-4">
              This will remove all {cart.items.length} item(s) from the cart.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setClearConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                onClick={() => {
                  cart.clearCart()
                  setClearConfirmOpen(false)
                  toast.success('Cart cleared')
                }}
              >
                Clear Cart
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Search Dialog */}
      {customerSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-900">Select Customer <kbd className="text-xs bg-gray-100 border border-gray-200 px-1 rounded font-mono ml-1">F6</kbd></h3>
                <button onClick={() => setCustomerSearchOpen(false)}>
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </div>
              <Input
                autoFocus
                placeholder="Search by name or phone..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
              />
            </div>
            <div className="max-h-64 overflow-y-auto">
              {searchingCustomers && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-600" />
                </div>
              )}
              {customerResults.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCustomer(c)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-sm font-semibold">
                    {c.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.phone} · {c.loyaltyPoints} pts</p>
                  </div>
                </button>
              ))}
              {customerSearch.length >= 2 && customerResults.length === 0 && !searchingCustomers && (
                <p className="text-center text-gray-400 text-sm py-4">No customers found</p>
              )}
            </div>
            <div className="p-3 border-t border-gray-100 flex gap-2">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setCustomerSearchOpen(false)}>
                Cancel
              </Button>
              <Button size="sm" className="flex-1 bg-teal-700 hover:bg-teal-800 text-white"
                onClick={() => window.open('/customers', '_blank')}>
                <UserPlus className="w-3.5 h-3.5 mr-1.5" />
                New Customer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={cart.total()}
        currency={settings?.currency}
        onConfirm={handlePaymentConfirm}
      />

      {/* Receipt Modal */}
      {completedOrder && (
        <ReceiptModal
          open={receiptOpen}
          onClose={() => { setReceiptOpen(false); setCompletedOrder(null) }}
          order={completedOrder}
          storeName={settings?.storeName}
          storeAddress={settings?.storeAddress}
          storePhone={settings?.storePhone}
          receiptHeader={settings?.receiptHeader}
          receiptFooter={settings?.receiptFooter}
          loyaltyPointsEarned={loyaltyEarned}
        />
      )}
    </div>
  )
}
