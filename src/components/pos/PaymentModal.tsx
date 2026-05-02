'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Check, Loader2, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { PaymentEntry } from '@/types/index'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  total: number
  currency?: string
  onConfirm: (payments: PaymentEntry[], cashReceived: number) => Promise<void>
}

const NUMPAD = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫']

export function PaymentModal({ open, onClose, total, currency = 'PKR', onConfirm }: PaymentModalProps) {
  const [activeMethod, setActiveMethod] = useState<PaymentEntry['method'] | 'SPLIT'>('CASH')
  const [cashReceived, setCashReceived] = useState('')
  const [cardRef, setCardRef] = useState('')
  const [jazzRef, setJazzRef] = useState('')
  const [easyRef, setEasyRef] = useState('')
  const [splitPayments, setSplitPayments] = useState<PaymentEntry[]>([])
  const [splitMethod, setSplitMethod] = useState<PaymentEntry['method']>('CASH')
  const [splitAmount, setSplitAmount] = useState('')
  const [splitRef, setSplitRef] = useState('')
  const [loading, setLoading] = useState(false)

  // Reset all state when the modal closes — otherwise old "Cash Received" value
  // and split payments leak into the next customer's transaction.
  useEffect(() => {
    if (!open) {
      setActiveMethod('CASH')
      setCashReceived('')
      setCardRef('')
      setJazzRef('')
      setEasyRef('')
      setSplitPayments([])
      setSplitMethod('CASH')
      setSplitAmount('')
      setSplitRef('')
      setLoading(false)
    }
  }, [open])

  const cashReceivedNum = parseFloat(cashReceived) || 0
  const change = Math.max(0, cashReceivedNum - total)
  const splitTotal = splitPayments.reduce((s, p) => s + p.amount, 0)
  const splitRemaining = Math.max(0, total - splitTotal)

  function handleNumpad(key: string) {
    if (key === '⌫') {
      setCashReceived((prev) => prev.slice(0, -1))
    } else if (key === '.') {
      if (!cashReceived.includes('.')) setCashReceived((prev) => prev + '.')
    } else {
      setCashReceived((prev) => {
        const next = prev + key
        return parseFloat(next) > 9999999 ? prev : next
      })
    }
  }

  /** Add the given note value to the current cash received — matches how cashiers
   *  count notes physically: each tap = "I just put one of these in the drawer".
   *  e.g. bill Rs 16,000, customer hands four 5K notes → tap 5K four times → 20,000. */
  function addNote(v: number) {
    setCashReceived((prev) => {
      const current = parseFloat(prev) || 0
      const next = current + v
      return next > 9999999 ? prev : String(Math.round(next * 100) / 100)
    })
  }

  /** Quick "exact change" — fills in the exact bill total. */
  function setExactAmount() {
    setCashReceived(String(Math.round(total * 100) / 100))
  }

  function addSplitPayment() {
    const amount = parseFloat(splitAmount)
    if (!amount || amount <= 0) return
    setSplitPayments((prev) => [...prev, { method: splitMethod, amount, reference: splitRef || undefined }])
    setSplitAmount('')
    setSplitRef('')
  }

  function removeSplitPayment(index: number) {
    setSplitPayments((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleConfirm() {
    let payments: PaymentEntry[] = []
    if (activeMethod === 'CASH') {
      if (cashReceivedNum < total) return
      payments = [{ method: 'CASH', amount: total }]
    } else if (activeMethod === 'CARD') {
      payments = [{ method: 'CARD', amount: total, reference: cardRef || undefined }]
    } else if (activeMethod === 'JAZZCASH') {
      payments = [{ method: 'JAZZCASH', amount: total, reference: jazzRef || undefined }]
    } else if (activeMethod === 'EASYPAISA') {
      payments = [{ method: 'EASYPAISA', amount: total, reference: easyRef || undefined }]
    } else if (activeMethod === 'SPLIT') {
      if (Math.abs(splitTotal - total) > 1) return
      payments = splitPayments
    }
    setLoading(true)
    try {
      await onConfirm(payments, cashReceivedNum)
    } finally {
      setLoading(false)
    }
  }

  const canConfirm = (() => {
    if (activeMethod === 'CASH') return cashReceivedNum >= total
    if (activeMethod === 'SPLIT') return Math.abs(splitTotal - total) <= 1 && splitPayments.length > 0
    return true
  })()

  if (!open) return null

  const METHODS = [
    { value: 'CASH', label: 'Cash' },
    { value: 'CARD', label: 'Card' },
    { value: 'JAZZCASH', label: 'Jazz' },
    { value: 'EASYPAISA', label: 'Easy' },
    { value: 'SPLIT', label: 'Split' },
  ] as const

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 modal-overlay-anim">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden max-h-[calc(100dvh-24px)] modal-content-anim">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-bold text-slate-900 text-base">Payment</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Due — compact */}
        <div className="flex-shrink-0 px-4 pt-3">
          <div className="bg-slate-900 text-white rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs opacity-60">Amount Due</span>
            <span className="text-2xl font-bold">{formatCurrency(total)}</span>
          </div>
        </div>

        {/* Method tabs */}
        <div className="flex-shrink-0 px-4 pt-2">
          <div className="grid grid-cols-5 gap-1 bg-gray-100 rounded-lg p-1">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setActiveMethod(m.value)}
                className={cn(
                  'py-1.5 rounded-md text-xs font-medium transition-colors',
                  activeMethod === m.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-gray-500 hover:text-slate-700'
                )}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">

          {/* ── Cash ── */}
          {activeMethod === 'CASH' && (
            <div className="flex flex-col gap-2 h-full">
              {/* Cash received display */}
              <div className="bg-gray-50 rounded-xl px-4 py-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">Cash Received</span>
                <div className="text-right">
                  <span className="text-xl font-bold text-slate-900">
                    {cashReceived ? formatCurrency(cashReceivedNum) : '—'}
                  </span>
                  {cashReceivedNum >= total && cashReceivedNum > 0 && (
                    <p className="text-xs text-green-600 font-medium">Change: {formatCurrency(change)}</p>
                  )}
                </div>
              </div>

              {/* Note denominations — each tap ADDS one note (matches cash counting) */}
              <div>
                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide flex items-center justify-between">
                  <span>Tap notes added by customer</span>
                  <button
                    type="button"
                    onClick={setExactAmount}
                    className="text-[10px] text-amber-700 font-semibold hover:underline normal-case tracking-normal"
                  >
                    Exact change
                  </button>
                </p>
                <div className="grid grid-cols-4 gap-1.5">
                  {[100, 500, 1000, 5000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => addNote(v)}
                      className="border border-gray-200 rounded-lg py-1.5 text-xs font-semibold hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 active:bg-amber-100 transition-colors active:scale-95 transform-gpu"
                      title={`Add Rs ${v}`}
                    >
                      +{v >= 1000 ? `${v / 1000}K` : v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Numpad — fixed height rows, no aspect-square */}
              <div className="grid grid-cols-3 gap-1.5">
                {NUMPAD.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleNumpad(key)}
                    className={cn(
                      'h-12 flex items-center justify-center rounded-xl text-lg font-semibold transition-colors active:scale-95',
                      key === '⌫'
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 active:bg-red-200'
                        : 'bg-gray-100 text-slate-900 hover:bg-gray-200 active:bg-gray-300'
                    )}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Card ── */}
          {activeMethod === 'CARD' && (
            <div className="space-y-3">
              <div className="bg-violet-50 rounded-xl p-4 text-center">
                <p className="text-sm text-violet-700 font-medium">Card Payment</p>
                <p className="text-2xl font-bold text-violet-900 mt-1">{formatCurrency(total)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Transaction Reference (optional)</label>
                <input
                  placeholder="e.g. TXN123456"
                  value={cardRef}
                  onChange={(e) => setCardRef(e.target.value)}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* ── JazzCash ── */}
          {activeMethod === 'JAZZCASH' && (
            <div className="space-y-3">
              <div className="bg-red-50 rounded-xl p-4 text-center">
                <p className="text-sm text-red-700 font-medium">JazzCash Payment</p>
                <p className="text-2xl font-bold text-red-900 mt-1">{formatCurrency(total)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Transaction ID (optional)</label>
                <input
                  placeholder="e.g. JC123456"
                  value={jazzRef}
                  onChange={(e) => setJazzRef(e.target.value)}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* ── EasyPaisa ── */}
          {activeMethod === 'EASYPAISA' && (
            <div className="space-y-3">
              <div className="bg-green-50 rounded-xl p-4 text-center">
                <p className="text-sm text-green-700 font-medium">EasyPaisa Payment</p>
                <p className="text-2xl font-bold text-green-900 mt-1">{formatCurrency(total)}</p>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Transaction ID (optional)</label>
                <input
                  placeholder="e.g. EP123456"
                  value={easyRef}
                  onChange={(e) => setEasyRef(e.target.value)}
                  className="w-full h-10 border border-gray-200 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
          )}

          {/* ── Split ── */}
          {activeMethod === 'SPLIT' && (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total: {formatCurrency(total)}</span>
                <span className={cn('font-medium', splitRemaining > 0 ? 'text-amber-600' : 'text-green-600')}>
                  Remaining: {formatCurrency(splitRemaining)}
                </span>
              </div>

              {splitPayments.map((p, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2 text-sm">
                  <span className="flex-1 font-medium">{p.method}</span>
                  <span>{formatCurrency(p.amount)}</span>
                  {p.reference && <span className="text-gray-400 text-xs">{p.reference}</span>}
                  <button onClick={() => removeSplitPayment(i)} className="text-red-400 hover:text-red-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={splitMethod}
                    onChange={(e) => setSplitMethod(e.target.value as PaymentEntry['method'])}
                    className="border border-gray-200 rounded-lg px-2 py-2 text-sm bg-white"
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="JAZZCASH">JazzCash</option>
                    <option value="EASYPAISA">EasyPaisa</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Amount"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                    min={0.01}
                  />
                </div>
                <input
                  placeholder="Reference (optional)"
                  value={splitRef}
                  onChange={(e) => setSplitRef(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  onClick={addSplitPayment}
                  disabled={!splitAmount || parseFloat(splitAmount) <= 0}
                  className="w-full h-9 border border-gray-200 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Payment
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Confirm button */}
        <div className="px-4 pb-4 pt-2 flex-shrink-0">
          <button
            disabled={!canConfirm || loading}
            onClick={handleConfirm}
            className="w-full h-12 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white text-base font-semibold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Check className="w-5 h-5" />
                Confirm Payment
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
