import type { Metadata } from 'next'
import Link from 'next/link'
import { RefreshCw, Mail, CheckCircle2, XCircle, Clock } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Refund Policy — POS Pro',
  description: 'Refund Policy for POS Pro subscriptions.',
}

export default function RefundPage() {
  return (
    <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10 pb-6 border-b border-gray-200">
        <div className="inline-flex items-center gap-2 text-rose-700 bg-rose-50 px-3 py-1 rounded-full text-xs font-semibold mb-3">
          <RefreshCw className="w-3.5 h-3.5" />
          REFUND
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Refund Policy</h1>
        <p className="text-sm text-slate-500 mt-2">Last updated: {new Date().toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </header>

      <div className="prose prose-slate max-w-none space-y-6 text-slate-700 leading-relaxed text-[15px]">

        {/* Highlight box */}
        <div className="bg-gradient-to-br from-amber-50 to-teal-50 border-2 border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Risk-free 7-day free trial
          </p>
          <p className="text-sm text-slate-600">
            Try POS Pro <strong>completely free for 7 days</strong>. No credit card needed. No charges until you decide to subscribe.
          </p>
        </div>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">1. 7-Day Free Trial</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Every new account gets <strong>full access</strong> to POS Pro for 7 days, completely free.</li>
            <li>No payment is collected during trial.</li>
            <li>No automatic charges. You only pay when you choose a plan.</li>
            <li>Cancel anytime during trial — no obligation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">2. Refund Eligibility</h2>
          <p>You may request a refund if:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>You request within <strong>7 days</strong> of your first paid subscription.</li>
            <li>You cancelled before the renewal date but were charged due to a billing error.</li>
            <li>The service was unavailable for more than 48 consecutive hours due to our fault.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">3. Non-Refundable</h2>
          <p>The following are not eligible for refund:</p>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>Subscriptions used for more than 7 days after first payment.</li>
            <li>Renewal payments where you continued using the service.</li>
            <li>Plan downgrades — credit will be applied to your next billing cycle instead.</li>
            <li>Custom development, training, or migration services already delivered.</li>
            <li>Charges resulting from misuse, fraudulent activity, or violation of Terms.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">4. How to Request a Refund</h2>
          <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">1</div>
              <p className="text-sm">Email <a href="mailto:billing@pospro.pk" className="text-amber-700 font-medium hover:underline">billing@pospro.pk</a> with your account email and reason for refund.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">2</div>
              <p className="text-sm">Our team reviews requests within <strong>3 business days</strong>.</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">3</div>
              <p className="text-sm">If approved, refund is processed within <strong>7-14 business days</strong> via the original payment method (or bank transfer if that&apos;s impractical).</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">5. Cancellation (without refund)</h2>
          <p>
            You can cancel your subscription anytime from <strong>Settings → Billing</strong>. Your account remains active until the end of the current paid period, then it stops billing. No refund is given for the unused portion of the period, but you keep all paid features until expiry.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">6. Plan Changes</h2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li><strong>Upgrade:</strong> Effective immediately. Difference is prorated and charged.</li>
            <li><strong>Downgrade:</strong> Effective at the end of current billing cycle. No refund for unused portion.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">7. Service Outage Compensation</h2>
          <p>
            If POS Pro is unavailable for more than 48 consecutive hours due to our fault, you are entitled to a credit equal to one full day of your monthly subscription per 24 hours of downtime. This is applied to your next bill — no cash refund unless you choose to cancel.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">8. Disputes</h2>
          <p>
            If a refund is denied and you disagree, you may escalate by emailing <a href="mailto:disputes@pospro.pk" className="text-amber-700 hover:underline">disputes@pospro.pk</a>. Disputes that cannot be resolved are subject to the Terms of Service&apos;s governing law clause (Pakistan / Karachi courts).
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mt-6 mb-2">9. Contact</h2>
          <div className="mt-3 p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-2">
            <p className="flex items-center gap-2 text-sm">
              <Mail className="w-4 h-4 text-rose-700" />
              <a href="mailto:billing@pospro.pk" className="text-rose-700 hover:underline font-medium">billing@pospro.pk</a>
            </p>
            <p className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-rose-700" />
              <span>Response time: 1-3 business days</span>
            </p>
          </div>
        </section>

      </div>

      <div className="mt-12 pt-6 border-t border-gray-200 flex justify-between items-center text-sm">
        <Link href="/privacy" className="text-amber-600 hover:text-amber-700 hover:underline">← Privacy Policy</Link>
        <Link href="/contact" className="text-amber-600 hover:text-amber-700 hover:underline">Contact Us →</Link>
      </div>
    </article>
  )
}
