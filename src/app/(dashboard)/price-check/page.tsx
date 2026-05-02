'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Search, Barcode, Package, CheckCircle2, XCircle,
  ShoppingBag, Loader2, RefreshCw,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface PriceCheckResult {
  id: string
  name: string
  sku: string
  barcode: string | null
  price: number
  costPrice: number
  category: { name: string } | null
  inventory: { quantity: number } | null
  trackStock: boolean
  images: string[]
  unit: string
}

type Status = 'idle' | 'searching' | 'found' | 'not-found'

export default function PriceCheckPage() {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [result, setResult] = useState<PriceCheckResult | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const autoClearTimer = useRef<NodeJS.Timeout | null>(null)

  // Focus the input always (kiosk-style)
  useEffect(() => {
    inputRef.current?.focus()
    const id = setInterval(() => {
      // Re-focus only if no input is currently focused (don't steal from buttons etc)
      if (document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'BUTTON') {
        inputRef.current?.focus()
      }
    }, 2000)
    return () => clearInterval(id)
  }, [])

  // ── Live search as user types (debounced 300ms) ──
  // Note: barcode guns ALSO type into this input then press Enter,
  // so this same code path handles both manual typing AND scanner.
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed) {
      setStatus('idle')
      setResult(null)
      return
    }
    // Debounce 300ms — typing fast won't fire 10 requests
    const timer = setTimeout(() => {
      search(trimmed)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  async function search(q: string) {
    const trimmed = q.trim()
    if (!trimmed) return
    setStatus('searching')
    if (autoClearTimer.current) clearTimeout(autoClearTimer.current)

    try {
      const res = await fetch(`/api/products?search=${encodeURIComponent(trimmed)}&limit=1`)
      const json = await res.json()
      if (!json.success || !json.data?.length) {
        setResult(null)
        setStatus('not-found')
      } else {
        setResult(json.data[0])
        setStatus('found')
      }
    } catch {
      setStatus('not-found')
      setResult(null)
    }

    // Auto-clear after 12 seconds for next customer
    autoClearTimer.current = setTimeout(() => {
      reset()
    }, 12000)
  }

  function reset() {
    setQuery('')
    setResult(null)
    setStatus('idle')
    inputRef.current?.focus()
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    search(query)
  }

  const inStock = result && (!result.trackStock || (result.inventory?.quantity ?? 0) > 0)

  return (
    <div className="-m-4 md:-m-6 min-h-full bg-gradient-to-br from-amber-50 via-white to-teal-50 flex flex-col">

      {/* ── Sticky top: header + search (always visible) ── */}
      <div className="sticky top-0 z-20 bg-gradient-to-b from-amber-50 via-amber-50/95 to-amber-50/0 backdrop-blur-sm pb-3">
        {/* Header */}
        <div className="px-6 pt-6 pb-3 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mb-2 shadow-md">
            <Barcode className="w-6 h-6 text-slate-900" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Price Check</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Scan a barcode or type a product name
          </p>
        </div>

        {/* Search box */}
        <div className="px-4 sm:px-6 max-w-2xl w-full mx-auto">
          <form onSubmit={onSubmit} className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              type="text"
              placeholder="Scan barcode or type product name…"
              autoFocus
              className="w-full h-14 pl-14 pr-32 text-base rounded-2xl border-2 border-amber-300 bg-white focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-200 shadow-sm transition-all placeholder:text-gray-400"
            />
            {query && (
              <button
                type="button"
                onClick={reset}
                className="absolute right-[110px] top-1/2 -translate-y-1/2 w-7 h-7 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                title="Clear"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              disabled={!query.trim() || status === 'searching'}
              className="absolute right-2 top-1.5 bottom-1.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 active:bg-teal-900 disabled:opacity-40 text-white font-semibold transition-colors flex items-center gap-2"
            >
              {status === 'searching' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Check</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* ── Result area: starts BELOW search, scrolls naturally if needed ── */}
      <div className="flex-1 flex items-start justify-center px-4 py-6 min-h-0">
        {status === 'idle' && (
          <div className="text-center max-w-md">
            <div className="w-28 h-28 mx-auto rounded-3xl bg-white border-2 border-dashed border-amber-200 flex items-center justify-center mb-4 float-gentle">
              <Barcode className="w-12 h-12 text-amber-400" />
            </div>
            <p className="text-slate-700 font-semibold text-lg">Ready to scan</p>
            <p className="text-sm text-slate-500 mt-1">Point your barcode scanner at the product</p>
            <p className="text-xs text-slate-400 mt-0.5">…ya search box mein product ka naam likhein</p>

            {/* Two-card tip */}
            <div className="grid grid-cols-2 gap-3 mt-6 text-left">
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Barcode className="w-4 h-4 text-amber-600" />
                  <p className="text-xs font-semibold text-slate-700">Scan barcode</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Point gun at product → it auto-fills + searches
                </p>
              </div>
              <div className="bg-white rounded-xl border border-gray-200 p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Search className="w-4 h-4 text-teal-600" />
                  <p className="text-xs font-semibold text-slate-700">Type name</p>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight">
                  Live search — results appear as you type
                </p>
              </div>
            </div>
          </div>
        )}

        {status === 'searching' && (
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mx-auto mb-3" />
            <p className="text-slate-600">Searching…</p>
          </div>
        )}

        {status === 'not-found' && (
          <div className="text-center max-w-sm modal-content-anim">
            <div className="w-24 h-24 mx-auto rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <XCircle className="w-12 h-12 text-rose-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-1">Product not found</h2>
            <p className="text-slate-500 text-sm mb-1">
              We couldn&apos;t find &ldquo;{query}&rdquo; in our store.
            </p>
            <p className="text-xs text-slate-400 mb-5">
              Yeh product hamare store mein nahi hai. Kisi staff member sy poochiye.
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 h-11 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Another
            </button>
          </div>
        )}

        {status === 'found' && result && (
          <div className="w-full max-w-2xl modal-content-anim">
            <div className="bg-white rounded-3xl shadow-xl border border-amber-200 overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-0">

                {/* Image */}
                <div className="md:col-span-2 aspect-square md:aspect-auto bg-gradient-to-br from-amber-50 to-teal-50 flex items-center justify-center p-6">
                  {result.images?.[0] ? (
                    <img
                      src={result.images[0]}
                      alt={result.name}
                      className="max-w-full max-h-72 object-contain drop-shadow-md"
                    />
                  ) : (
                    <Package className="w-32 h-32 text-amber-300" />
                  )}
                </div>

                {/* Info */}
                <div className="md:col-span-3 p-6 sm:p-8 flex flex-col">
                  {result.category && (
                    <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full self-start mb-3 uppercase tracking-wide">
                      {result.category.name}
                    </span>
                  )}

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 leading-tight mb-1">
                    {result.name}
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mb-5">
                    SKU: {result.sku}
                    {result.barcode && <span> · Barcode: {result.barcode}</span>}
                  </p>

                  {/* Price — the hero */}
                  <div className="bg-gradient-to-br from-amber-100 to-amber-200 border-2 border-amber-300 rounded-2xl p-5 mb-4">
                    <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Price</p>
                    <p className="text-4xl sm:text-5xl font-bold text-amber-900 mt-1 tabular-nums">
                      {formatCurrency(result.price)}
                    </p>
                    <p className="text-xs text-amber-700 mt-1">per {result.unit}</p>
                  </div>

                  {/* Stock indicator */}
                  <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${
                    inStock
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                      : 'bg-rose-50 border border-rose-200 text-rose-700'
                  }`}>
                    {inStock ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium text-sm">
                          In stock
                          {result.trackStock && result.inventory && (
                            <span className="ml-1 opacity-70">({result.inventory.quantity} {result.unit} available)</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        <span className="font-medium text-sm">Out of stock</span>
                      </>
                    )}
                  </div>

                  <button
                    onClick={reset}
                    className="mt-5 inline-flex items-center justify-center gap-2 h-11 rounded-xl border border-gray-200 hover:bg-gray-50 active:bg-gray-100 text-slate-700 font-medium transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Check Another Product
                  </button>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400 mt-4">
              Auto-resets after 8 seconds · Auto reset 8 seconds bad
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
