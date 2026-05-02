'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Lock, AlertTriangle, Clock, ArrowRight, Mail, MessageCircle, ShoppingBag } from 'lucide-react'

interface SubscriptionLockOverlayProps {
  status: string
  hasPendingProof: boolean
}

/**
 * Full-screen lock that appears when a store's subscription has expired.
 *
 * Cashier/Owner CAN log in (so they can pay), but every page below the
 * /billing/* and /profile section is replaced by this overlay until they
 * either renew or their pending payment proof is approved.
 */
export function SubscriptionLockOverlay({ status, hasPendingProof }: SubscriptionLockOverlayProps) {
  const pathname = usePathname()

  // Allow these paths through — billing, profile, settings (so they can update info before paying)
  const allowedPaths = ['/billing', '/profile', '/contact']
  if (allowedPaths.some((p) => pathname.startsWith(p))) {
    return null
  }

  // Pending payment proof? Show "we're reviewing" instead of locked-out
  if (hasPendingProof) {
    return (
      <div className="fixed inset-0 z-[100] bg-amber-900/40 backdrop-blur-md flex items-center justify-center p-4 modal-overlay-anim">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-7 text-center modal-content-anim">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Payment under review</h2>
          <p className="text-slate-600 mt-2">
            Aap ki payment proof submit ho gayi hai. Hum 24 ghantay ke andar verify karke subscription activate kar denge.
          </p>
          <p className="text-sm text-slate-500 mt-1">Your payment proof is being reviewed. We&apos;ll activate your subscription within 24 hours.</p>

          <div className="bg-amber-50 rounded-xl p-3 mt-5 text-left">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-1">Need help?</p>
            <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-amber-800 hover:text-amber-900">
              <MessageCircle className="w-4 h-4" />
              WhatsApp +92 300 1234567
            </a>
            <a href="mailto:billing@pospro.pk" className="flex items-center gap-2 text-sm text-amber-800 hover:text-amber-900 mt-1">
              <Mail className="w-4 h-4" />
              billing@pospro.pk
            </a>
          </div>

          <Link
            href="/billing/pending"
            className="inline-flex items-center gap-2 h-11 px-5 mt-5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-semibold transition-colors"
          >
            View payment status
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    )
  }

  // Subscription expired — locked out
  return (
    <div className="fixed inset-0 z-[100] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4 modal-overlay-anim">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden modal-content-anim">
        {/* Top hero */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-700 text-white p-6 sm:p-8 text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />

          <div className="relative">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-white/20 backdrop-blur flex items-center justify-center mb-4 shadow-lg">
              <Lock className="w-10 h-10" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Subscription Expired</h2>
            <p className="text-white/90 mt-2 text-sm sm:text-base">
              Aapki subscription expire ho gayi hai
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 sm:p-8 text-center">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5 text-left">
            <p className="text-sm font-semibold text-amber-900 flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4" />
              POS access blocked
            </p>
            <p className="text-xs text-amber-800">
              POS Terminal, products, customers, reports — sab features lock hain. Sirf <strong>Billing page</strong> open hai taake aap renew kar sakein.
            </p>
          </div>

          <h3 className="font-bold text-slate-900 mb-3">Renew karne ke liye:</h3>
          <ol className="text-sm text-slate-600 space-y-2 text-left max-w-sm mx-auto mb-6">
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">1</span>
              <span>Apna package choose karein (1 month / 3 months / 6 months / 1 year)</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">2</span>
              <span>Bank transfer / JazzCash / EasyPaisa se payment karein</span>
            </li>
            <li className="flex gap-2">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-xs font-bold flex items-center justify-center">3</span>
              <span>Payment screenshot upload karein. 24 ghantay mein activate ho jayegi.</span>
            </li>
          </ol>

          <Link
            href="/billing/plans"
            className="inline-flex items-center gap-2 h-12 px-6 rounded-xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 font-bold text-base transition-colors shadow-lg shadow-amber-200 w-full sm:w-auto justify-center"
          >
            <ShoppingBag className="w-5 h-5" />
            View Plans &amp; Pay Now
            <ArrowRight className="w-5 h-5" />
          </Link>

          <div className="mt-5 pt-5 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-2">Need help? Contact us:</p>
            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="https://wa.me/923001234567" target="_blank" rel="noopener noreferrer" className="text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 font-medium">
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </a>
              <a href="tel:+923001234567" className="text-amber-700 hover:text-amber-800 flex items-center gap-1.5 font-medium">
                📞 +92 300 1234567
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
