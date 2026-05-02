'use client'

import { useEffect, useRef, useState } from 'react'
import { Bookmark, X, ShoppingBag, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getParkedSales, useCartStore, type ParkedSale } from '@/store/cartStore'
import { formatCurrency, cn } from '@/lib/utils'

/** Bookmark-icon button shown next to the Cashier card on the POS top bar.
 *  Opens a dropdown of parked sales the cashier can resume or discard. */
export function ParkedSalesButton() {
  const [open, setOpen] = useState(false)
  const [parked, setParked] = useState<ParkedSale[]>([])
  const ref = useRef<HTMLDivElement>(null)

  function refresh() {
    setParked(getParkedSales())
  }

  // Refresh on open + listen to storage events (parked from another tab)
  useEffect(() => {
    if (!open) return
    refresh()
    function onStorage() { refresh() }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [open])

  // Initial mount also reads (so the count badge is correct before the dropdown opens)
  useEffect(() => { refresh() }, [])

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function handleResume(id: string) {
    const ok = useCartStore.getState().resumeParkedSale(id)
    if (ok) {
      toast.success('Parked sale resumed')
      refresh()
      setOpen(false)
    }
  }

  function handleDiscard(id: string) {
    const all = getParkedSales().filter((p) => p.id !== id)
    if (typeof window !== 'undefined') {
      localStorage.setItem('pos-parked-sales', JSON.stringify(all))
    }
    refresh()
    toast.success('Parked sale removed')
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative inline-flex items-center gap-1.5 h-7 px-2 rounded-lg text-xs font-medium text-amber-100 hover:bg-amber-400/20 transition-colors"
        title="Parked sales — click to resume"
      >
        <Bookmark className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Parked</span>
        {parked.length > 0 && (
          <span className="bg-amber-400 text-slate-900 rounded-full text-[10px] font-bold w-4 h-4 flex items-center justify-center">
            {parked.length}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 modal-content-anim origin-top-right text-slate-900">
          <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm font-semibold">Parked Sales</p>
            <button onClick={() => setOpen(false)}>
              <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
            </button>
          </div>

          {parked.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bookmark className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No parked sales</p>
              <p className="text-xs text-gray-400 mt-0.5">Click <strong>Park</strong> in the cart to set aside the current sale.</p>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {parked.map((p) => {
                const itemCount = p.items.reduce((s, i) => s + i.quantity, 0)
                const subtotal = p.items.reduce((s, i) => {
                  const lineSub = i.price * i.quantity
                  const lineDisc = (lineSub * i.discount) / 100
                  return s + lineSub - lineDisc
                }, 0)
                const elapsed = elapsedTime(p.parkedAt)
                return (
                  <div
                    key={p.id}
                    className="px-3 py-2.5 border-b border-gray-50 last:border-0 hover:bg-amber-50/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <button
                        onClick={() => handleResume(p.id)}
                        className="flex-1 min-w-0 text-left"
                      >
                        <p className="text-sm font-medium text-slate-900 truncate">{p.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {itemCount} item{itemCount !== 1 ? 's' : ''} · {formatCurrency(subtotal)}
                          {p.customer && <> · {p.customer.name}</>}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">{elapsed}</p>
                      </button>
                      <button
                        onClick={() => handleDiscard(p.id)}
                        className="text-gray-300 hover:text-rose-500 p-1 transition-colors flex-shrink-0"
                        title="Discard parked sale"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleResume(p.id)}
                      className="mt-1.5 text-[11px] font-semibold text-amber-700 hover:text-amber-800 hover:underline flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3 h-3" />
                      Resume sale
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function elapsedTime(iso: string): string {
  const then = new Date(iso).getTime()
  const now = Date.now()
  const diff = Math.round((now - then) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}
