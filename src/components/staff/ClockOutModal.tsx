'use client'

import { useEffect, useState } from 'react'
import { Loader2, X, Coins, AlertTriangle, CheckCircle2, ArrowRight, Wallet, ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { formatCurrency, cn } from '@/lib/utils'

interface ShiftSummary {
  shiftId: string
  clockIn: string
  openingCash: number
  totalOrders: number
  totalSales: number
  cashSales: number
  cardSales: number
  jazzCashSales: number
  easyPaisaSales: number
  otherSales: number
  cashRefunds: number
  expectedCash: number
}

interface ClockOutModalProps {
  open: boolean
  onClose: () => void
  onComplete: () => void
}

/** End-of-day modal shown when cashier clicks "Clock Out".
 *
 * Walks through:
 *  1. Auto-fetched shift summary (sales by method, refunds, expected cash)
 *  2. Cashier counts physical drawer cash and enters it
 *  3. System computes variance (over/short)
 *  4. Optional notes if there's a discrepancy
 *  5. Confirm → clock out and save closing cash
 */
export function ClockOutModal({ open, onClose, onComplete }: ClockOutModalProps) {
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [closingCash, setClosingCash] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    setClosingCash('')
    setNotes('')
    fetch('/api/staff/my-shift/summary')
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setSummary(j.data)
      })
      .catch(() => toast.error('Could not load shift summary'))
      .finally(() => setLoading(false))
  }, [open])

  if (!open) return null

  const closingCashNum = parseFloat(closingCash) || 0
  const variance = summary ? closingCashNum - summary.expectedCash : 0
  const varianceState =
    closingCash === '' ? 'none' :
    Math.abs(variance) < 1 ? 'match' :
    variance > 0 ? 'over' :
    'short'

  async function submit() {
    if (!summary) return
    if (closingCash === '') {
      toast.error('Please count and enter your drawer cash first')
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch('/api/staff/clock-out', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closingCash: closingCashNum,
          notes: notes || undefined,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Could not clock out')
        return
      }
      toast.success('Shift ended. Have a good rest!')
      onComplete()
      onClose()
    } catch {
      toast.error('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-3 modal-overlay-anim">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[calc(100dvh-24px)] modal-content-anim">
        {/* Header */}
        <div className="bg-gradient-to-br from-teal-700 to-teal-900 text-white px-6 py-5 relative overflow-hidden flex-shrink-0">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center mb-3 shadow-lg">
              <Coins className="w-6 h-6 text-slate-900" />
            </div>
            <h2 className="text-xl font-bold">End of Shift</h2>
            <p className="text-teal-100 text-sm mt-0.5">
              Drawer count karein aur clock out karein
            </p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">
          {loading || !summary ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
            </div>
          ) : (
            <>
              {/* Sales summary */}
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag className="w-4 h-4 text-slate-600" />
                  <p className="font-semibold text-slate-900 text-sm">Today&apos;s Sales</p>
                  <span className="ml-auto bg-slate-900 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                    {summary.totalOrders} orders
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <SaleRow label="💵 Cash sales" value={summary.cashSales} highlight />
                  <SaleRow label="💳 Card" value={summary.cardSales} />
                  <SaleRow label="📱 JazzCash" value={summary.jazzCashSales} />
                  <SaleRow label="📲 EasyPaisa" value={summary.easyPaisaSales} />
                  {summary.otherSales > 0 && <SaleRow label="Other" value={summary.otherSales} />}
                  {summary.cashRefunds > 0 && (
                    <SaleRow label="↩️ Cash refunds" value={summary.cashRefunds} negative />
                  )}
                </div>
                <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-600">Total sales</span>
                  <span className="text-sm font-bold text-slate-900 tabular-nums">{formatCurrency(summary.totalSales)}</span>
                </div>
              </div>

              {/* Cash drawer math */}
              <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 space-y-2">
                <p className="font-semibold text-slate-900 text-sm flex items-center gap-2 mb-2">
                  <Wallet className="w-4 h-4 text-amber-700" />
                  Drawer cash math
                </p>
                <CashRow label="Opening cash (your float)" value={summary.openingCash} />
                <CashRow label="+ Cash sales" value={summary.cashSales} positive />
                {summary.cashRefunds > 0 && <CashRow label="− Cash refunds" value={summary.cashRefunds} negative />}
                <div className="border-t-2 border-amber-300 pt-2 flex items-center justify-between">
                  <span className="text-sm font-semibold text-amber-900">Expected in drawer</span>
                  <span className="text-lg font-bold text-amber-900 tabular-nums">{formatCurrency(summary.expectedCash)}</span>
                </div>
              </div>

              {/* Counted cash input */}
              <div className="bg-white border-2 border-teal-300 rounded-2xl p-4">
                <Label className="text-sm font-semibold text-slate-900">
                  Count your drawer cash <span className="text-rose-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mt-0.5 mb-2">
                  Physical cash count karein abhi drawer mein
                </p>
                <Input
                  type="number"
                  min={0}
                  step={0.01}
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="e.g. 18500"
                  className="h-12 text-xl font-bold tabular-nums text-center"
                  autoFocus
                />

                {/* Variance feedback */}
                {varianceState !== 'none' && (
                  <div
                    className={cn(
                      'mt-3 rounded-xl p-3 flex items-start gap-2 animate-fade-in',
                      varianceState === 'match' && 'bg-emerald-50 border border-emerald-200',
                      varianceState === 'over' && 'bg-blue-50 border border-blue-200',
                      varianceState === 'short' && 'bg-rose-50 border border-rose-200',
                    )}
                  >
                    {varianceState === 'match' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />}
                    {varianceState !== 'match' && <AlertTriangle className={cn('w-5 h-5 flex-shrink-0', varianceState === 'short' ? 'text-rose-600' : 'text-blue-600')} />}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-sm font-bold',
                        varianceState === 'match' && 'text-emerald-700',
                        varianceState === 'over' && 'text-blue-700',
                        varianceState === 'short' && 'text-rose-700',
                      )}>
                        {varianceState === 'match' && '✓ Drawer matches!'}
                        {varianceState === 'over' && `Over by ${formatCurrency(Math.abs(variance))}`}
                        {varianceState === 'short' && `Short by ${formatCurrency(Math.abs(variance))}`}
                      </p>
                      <p className="text-xs mt-0.5 opacity-80">
                        {varianceState === 'match' && 'Perfect end of day. Saari cash match hui.'}
                        {varianceState === 'over' && 'Drawer mein extra cash hai — koi customer change nahi le ke gaya?'}
                        {varianceState === 'short' && 'Drawer mein cash kam hai — count dobara karein, ya notes mein wajah likh dein.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes (only show if variance) */}
              {varianceState !== 'match' && varianceState !== 'none' && (
                <div>
                  <Label className="text-sm">Notes (optional)</Label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Customer ne change wapas nahi liya, ya cashier ki ghalti…"
                    className="w-full mt-1 border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Actions */}
        <div className="border-t border-gray-100 p-4 flex gap-2 flex-shrink-0">
          <Button variant="outline" onClick={onClose} disabled={submitting} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !summary || closingCash === ''}
            className="flex-1 gap-1.5 bg-teal-700 hover:bg-teal-800"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                Clock Out
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

function SaleRow({ label, value, highlight, negative }: { label: string; value: number; highlight?: boolean; negative?: boolean }) {
  return (
    <div className={cn(
      'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-md',
      highlight ? 'bg-amber-100 text-amber-900 font-semibold' : 'text-slate-700',
    )}>
      <span>{label}</span>
      <span className={cn('tabular-nums font-medium', negative && 'text-rose-700')}>
        {negative ? '-' : ''}{formatCurrency(value)}
      </span>
    </div>
  )
}

function CashRow({ label, value, positive, negative }: { label: string; value: number; positive?: boolean; negative?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-slate-700">{label}</span>
      <span className={cn(
        'font-semibold tabular-nums',
        positive && 'text-emerald-700',
        negative && 'text-rose-700',
        !positive && !negative && 'text-slate-900',
      )}>
        {formatCurrency(value)}
      </span>
    </div>
  )
}
