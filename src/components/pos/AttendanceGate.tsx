'use client'

import { useEffect, useState } from 'react'
import { ClipboardCheck, Loader2, LogIn, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface AttendanceGateProps {
  /** Called once the cashier has successfully clocked in. */
  onCleared: () => void
}

/**
 * Modal that blocks the POS Terminal until the cashier marks attendance.
 *
 * - Owner / Manager / Super Admin skip this entirely (server says needsAttendance: false)
 * - Cashier sees a one-step "Clock In" with optional opening cash float
 * - Cannot dismiss the modal — POS is unusable without clocking in
 */
export function AttendanceGate({ onCleared }: AttendanceGateProps) {
  const [checking, setChecking] = useState(true)
  const [needsAttendance, setNeedsAttendance] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Check if attendance is needed
  useEffect(() => {
    let stop = false
    async function check() {
      try {
        const res = await fetch('/api/staff/my-shift', { cache: 'no-store' })
        const json = await res.json()
        if (stop) return
        if (json.success) {
          setNeedsAttendance(json.data.needsAttendance)
          if (!json.data.needsAttendance) onCleared()
        }
      } catch {} finally {
        if (!stop) setChecking(false)
      }
    }
    check()
    return () => { stop = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function clockIn() {
    setSubmitting(true)
    try {
      const res = await fetch('/api/staff/clock-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openingCash: parseFloat(openingCash) || 0,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        toast.error(json.error || 'Could not clock in')
        return
      }
      toast.success('Clocked in. Have a great shift!')
      setNeedsAttendance(false)
      onCleared()
    } catch {
      toast.error('Network error — try again')
    } finally {
      setSubmitting(false)
    }
  }

  if (checking) {
    return (
      <div className="fixed inset-0 z-[90] bg-slate-900/70 backdrop-blur flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    )
  }

  if (!needsAttendance) return null

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4 modal-overlay-anim">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden modal-content-anim">
        {/* Hero */}
        <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-900 p-6 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl" />
          <div className="relative">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-white/30 backdrop-blur flex items-center justify-center mb-3 shadow-lg">
              <ClipboardCheck className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold">Mark attendance first</h2>
            <p className="text-slate-800/80 mt-1 text-sm">
              POS use karne se pehle clock in karein
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-slate-600 text-center mb-5">
            Clock in karte hi aap ki shift start ho jayegi. <strong className="text-slate-800">Saari sales aap ke account mein record hongi.</strong>
          </p>

          <div className="space-y-2">
            <Label htmlFor="opening-cash">
              Opening Cash <span className="text-xs text-gray-500 font-normal">(optional — for change)</span>
            </Label>
            <Input
              id="opening-cash"
              type="number"
              min={0}
              placeholder="e.g. 5000"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              className="h-11 text-lg tabular-nums"
            />
            <p className="text-xs text-gray-400">
              Drawer mein abhi kitni cash float ke liye rakhi hai? End-of-day variance check ke liye yeh save hogi.
            </p>
          </div>

          <Button
            onClick={clockIn}
            disabled={submitting}
            className="w-full h-12 mt-5 gap-2 text-base font-bold bg-teal-700 hover:bg-teal-800 active:bg-teal-900"
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Clock In &amp; Start Shift
              </>
            )}
          </Button>

          <p className="text-[11px] text-gray-400 text-center mt-3">
            Forgot to clock in? Just enter your opening cash above and click the button.
          </p>
        </div>
      </div>
    </div>
  )
}
