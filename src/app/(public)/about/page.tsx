import type { Metadata } from 'next'
import Link from 'next/link'
import {
  Heart, Target, Zap, Shield, Users, TrendingUp,
  ShoppingBag, Award, Lightbulb,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'About POS Pro — Pakistan\'s smartest cloud POS',
  description: 'Learn about POS Pro — built for Pakistani retailers, by people who understand local business.',
}

const values = [
  { icon: Heart, title: 'Built with care',  desc: 'Every detail polished for Pakistani retailers — language, currency, payment methods, tax structure.', color: 'rose' },
  { icon: Zap,   title: 'Built for speed',  desc: 'Cashiers ring up sales in under 30 seconds. Barcode scanner, instant search, one-tap checkout.', color: 'amber' },
  { icon: Shield, title: 'Built secure',     desc: 'Bank-grade encryption. Daily backups. Role-based permissions. Audit trail of every action.', color: 'teal' },
  { icon: Users, title: 'Built for teams',   desc: 'Owner sees everything. Manager runs the floor. Cashier works the till. Each role has its own view.', color: 'violet' },
]

const numbers = [
  { value: '7-day', label: 'Free trial' },
  { value: '30 sec', label: 'Per sale' },
  { value: '5+', label: 'Payment methods' },
  { value: '99.9%', label: 'Uptime target' },
]

const colorMap: Record<string, { bg: string; text: string; ring: string }> = {
  rose:   { bg: 'bg-rose-100',   text: 'text-rose-700',   ring: 'ring-rose-200' },
  amber:  { bg: 'bg-amber-100',  text: 'text-amber-700',  ring: 'ring-amber-200' },
  teal:   { bg: 'bg-teal-100',   text: 'text-teal-700',   ring: 'ring-teal-200' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-200' },
}

export default function AboutPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Hero */}
      <header className="text-center mb-12">
        <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <Award className="w-3.5 h-3.5" />
          ABOUT POS PRO
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 leading-tight">
          Pakistan&apos;s retail, <br className="sm:hidden" />
          <span className="bg-gradient-to-r from-amber-500 to-amber-700 bg-clip-text text-transparent">reimagined.</span>
        </h1>
        <p className="text-slate-600 mt-4 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          POS Pro is built by Pakistani developers, for Pakistani shopkeepers. From kirana stores in Karachi to electronics shops in Lahore, we make modern point-of-sale finally accessible.
        </p>
      </header>

      {/* Mission */}
      <section className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-3xl p-8 sm:p-10 mb-12 border border-amber-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-1 flex justify-center">
            <div className="w-24 h-24 rounded-3xl bg-amber-400 flex items-center justify-center shadow-lg">
              <Target className="w-12 h-12 text-slate-900" />
            </div>
          </div>
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-slate-900 mb-3">Our mission</h2>
            <p className="text-slate-700 leading-relaxed">
              Modernize Pakistani retail. Today, most shops still rely on hand-written ledgers, calculator math, and paper receipts. We believe every shopkeeper — small or large, urban or rural — deserves access to the same powerful tools that big chains have. <strong>Affordable, fast, and built for how you actually work.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* Numbers */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        {numbers.map((n) => (
          <div key={n.label} className="bg-white border border-gray-200 rounded-2xl p-5 text-center hover:shadow-md transition-shadow">
            <p className="text-2xl sm:text-3xl font-bold text-amber-600 tabular-nums">{n.value}</p>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wide font-medium">{n.label}</p>
          </div>
        ))}
      </section>

      {/* Values */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 text-center mb-2">What we stand for</h2>
        <p className="text-slate-500 text-center mb-8 text-sm">Four principles that guide every decision we make.</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {values.map((v) => {
            const c = colorMap[v.color]
            return (
              <div key={v.title} className={`bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-all`}>
                <div className={`w-12 h-12 rounded-xl ${c.bg} ${c.text} flex items-center justify-center mb-4 ring-4 ${c.ring}`}>
                  <v.icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{v.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{v.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Why Pakistan-specific */}
      <section className="bg-white rounded-3xl border-2 border-amber-200 p-8 sm:p-10 mb-12">
        <div className="flex items-start gap-4 mb-5">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center flex-shrink-0 text-white text-xl">
            🇵🇰
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Made for Pakistan</h2>
            <p className="text-slate-500 text-sm">Local-first, not retrofitted from foreign software.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-slate-700">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>PKR currency</strong> with proper formatting (Rs 1,23,000)</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>JazzCash &amp; EasyPaisa</strong> built-in payment methods</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>Roman Urdu</strong> support across the app</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>GST tax</strong> compliance ready</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>Bank transfer</strong> subscription payments</span>
          </div>
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span><strong>Local support</strong> in your language &amp; timezone</span>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="text-center bg-slate-900 rounded-3xl p-10 text-white">
        <ShoppingBag className="w-12 h-12 text-amber-400 mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Join the modern retailers</h2>
        <p className="text-slate-300 text-base mb-6 max-w-md mx-auto">
          Try POS Pro free for 7 days. See the difference modern tools make.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="h-12 px-8 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold flex items-center justify-center transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/contact"
            className="h-12 px-8 rounded-xl border border-slate-700 hover:bg-slate-800 text-white font-medium flex items-center justify-center transition-colors"
          >
            Talk to Us
          </Link>
        </div>
      </section>
    </div>
  )
}
