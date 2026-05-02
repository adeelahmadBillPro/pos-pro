'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag, BarChart3, Users, Package, Shield, Zap,
  CheckCircle2, ArrowRight, Smartphone, Printer, QrCode,
  Star, TrendingUp, Clock, ChevronDown,
} from 'lucide-react'
import { Reveal } from '@/components/shared/Reveal'

// ── Animated counter ────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const duration = 1400
        const steps = 60
        const increment = to / steps
        let current = 0
        const timer = setInterval(() => {
          current += increment
          if (current >= to) { setCount(to); clearInterval(timer) }
          else setCount(Math.floor(current))
        }, duration / steps)
      }
    }, { threshold: 0.5 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [to])

  return <span ref={ref}>{count}{suffix}</span>
}

// ── Typewriter effect ────────────────────────────────────────────────────────
function Typewriter({ words }: { words: string[] }) {
  const [wordIdx, setWordIdx] = useState(0)
  const [text, setText] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[wordIdx]
    let timeout: ReturnType<typeof setTimeout>

    if (!deleting && text.length < word.length) {
      timeout = setTimeout(() => setText(word.slice(0, text.length + 1)), 80)
    } else if (!deleting && text.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 2000)
    } else if (deleting && text.length > 0) {
      timeout = setTimeout(() => setText(text.slice(0, -1)), 40)
    } else if (deleting && text.length === 0) {
      setDeleting(false)
      setWordIdx((i) => (i + 1) % words.length)
    }
    return () => clearTimeout(timeout)
  }, [text, deleting, wordIdx, words])

  return (
    <span className="text-amber-400">
      {text}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// ── Floating badge ───────────────────────────────────────────────────────────
function FloatingBadge({ className, children }: { className: string; children: React.ReactNode }) {
  return (
    <div className={`absolute hidden lg:flex items-center gap-2 bg-white/95 backdrop-blur rounded-2xl px-4 py-2.5 shadow-xl border border-white/50 text-slate-800 text-sm font-medium ${className}`}>
      {children}
    </div>
  )
}

const features = [
  { icon: ShoppingBag, title: 'Fast POS Terminal',    desc: 'Barcode scanner, keyboard shortcuts, split payments. Sell faster than ever.' },
  { icon: BarChart3,   title: 'Real-time Reports',    desc: 'Daily sales, top products, payment breakdown — all in one dashboard.' },
  { icon: Package,     title: 'Inventory Tracking',   desc: 'Low stock alerts, bulk import via CSV, adjust stock with full audit trail.' },
  { icon: Users,       title: 'Customer Loyalty',     desc: 'Earn & redeem points, customer history, group-based pricing.' },
  { icon: Shield,      title: 'Multi-role Access',    desc: 'Owner, Manager, Cashier, Viewer — each with their own permissions.' },
  { icon: Zap,         title: 'Multiple Payments',    desc: 'Cash, JazzCash, EasyPaisa, card, split — with change calculator.' },
  { icon: Printer,     title: 'Thermal & A4 Receipt', desc: '80mm thermal receipt or professional A4 invoice — one click print.' },
  { icon: QrCode,      title: 'Barcode Scanner',      desc: 'Plug in any USB/Bluetooth barcode gun — instantly adds to cart.' },
  { icon: Smartphone,  title: 'Works on Mobile',      desc: 'Fully responsive — use on phone, tablet, or desktop.' },
]

const plans = [
  {
    name: 'Starter', price: '2,999', period: '/month',
    features: ['1 POS terminal', 'Unlimited products', 'Basic reports', 'Email support'],
    cta: 'Start Free Trial', highlight: false,
  },
  {
    name: 'Pro', price: '5,999', period: '/month',
    features: ['3 POS terminals', 'Staff management', 'Advanced reports', 'WhatsApp alerts', 'Priority support'],
    cta: 'Start Free Trial', highlight: true,
  },
  {
    name: 'Enterprise', price: 'Custom', period: '',
    features: ['Unlimited terminals', 'Multi-branch', 'Custom integrations', 'Dedicated support'],
    cta: 'Contact Us', highlight: false,
  },
]

const whyItems = [
  { icon: TrendingUp,   text: 'PKR currency with local tax (GST) support' },
  { icon: Zap,          text: 'JazzCash, EasyPaisa, cash — all payment methods' },
  { icon: Clock,        text: 'Works offline — no internet? Still sell' },
  { icon: Smartphone,   text: 'Works on any Android phone, tablet or PC' },
  { icon: Shield,       text: 'Your data stays safe — daily backups' },
  { icon: CheckCircle2, text: 'Urdu-friendly product names supported' },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center animate-pulse">
              <ShoppingBag className="w-4 h-4 text-slate-900" />
            </div>
            <span className="font-bold text-slate-900 text-lg">POS Pro</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 transition-colors">Sign in</Link>
            <Link href="/register" className="text-sm font-semibold bg-amber-400 hover:bg-amber-500 text-slate-900 px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95">
              Free Trial
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 text-white relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Animated background circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-amber-400/10 animate-[pulse_4s_ease-in-out_infinite]" />
        <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-teal-600/30 animate-[pulse_6s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 right-1/3 w-32 h-32 rounded-full bg-white/5 animate-[pulse_5s_ease-in-out_infinite]" />
        <div className="absolute bottom-1/4 right-1/4 w-20 h-20 rounded-full bg-amber-400/10 animate-[pulse_3s_ease-in-out_infinite]" />

        {/* Floating stats badges */}
        <FloatingBadge className="top-24 right-16 animate-[bounce_3s_ease-in-out_infinite]">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          PKR 82,400 today
        </FloatingBadge>
        <FloatingBadge className="bottom-32 right-24 animate-[bounce_4s_ease-in-out_infinite]" >
          <span className="text-teal-600">📦</span> 47 orders
        </FloatingBadge>
        <FloatingBadge className="top-1/2 right-8 animate-[bounce_3.5s_ease-in-out_infinite]">
          <span className="text-amber-500">⭐</span> 500+ stores
        </FloatingBadge>

        <div className="max-w-6xl mx-auto px-4 py-20 relative z-10 w-full">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm text-teal-100 border border-white/10">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              Pakistan&apos;s #1 Cloud POS System
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight">
              <Typewriter words={['Sell Smarter.', 'Grow Faster.', 'Earn More.']} /><br />
              <span className="text-white/90 text-3xl md:text-5xl">for Pakistani Retail</span>
            </h1>

            <p className="text-teal-100 text-lg md:text-xl max-w-xl">
              Complete POS system for Pakistani retail stores. Manage sales, inventory, staff and customers — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-7 py-4 rounded-xl text-base transition-all hover:scale-105 active:scale-95 shadow-lg shadow-amber-400/30">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white font-semibold px-7 py-4 rounded-xl text-base border border-white/20 transition-all hover:scale-105">
                Sign In
              </Link>
            </div>

            <p className="text-sm text-teal-300">
              ✓ No credit card needed &nbsp;·&nbsp; ✓ 14-day free trial &nbsp;·&nbsp; ✓ Cancel anytime
            </p>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40 animate-bounce">
          <span className="text-xs">Scroll</span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="bg-slate-900 py-14">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { to: 500, suffix: '+', label: 'Stores Trust Us' },
            { to: 1,   suffix: 'M+', label: 'Orders Processed' },
            { to: 99,  suffix: '.9%', label: 'Uptime' },
            { to: 1,   suffix: 's', label: 'Receipt Speed' },
          ].map((s, i) => (
            <Reveal key={s.label} direction="up" delay={i * 80}>
              <div className="text-center">
                <p className="text-4xl font-bold text-amber-400">
                  <Counter to={s.to} suffix={s.suffix} />
                </p>
                <p className="text-sm text-slate-400 mt-1.5">{s.label}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 bg-[#f8f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal direction="up" className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Everything your store needs</h2>
            <p className="mt-3 text-slate-500 text-lg max-w-xl mx-auto">From first sale to 1000th order — POS Pro handles it all.</p>
          </Reveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <Reveal
                key={f.title}
                direction={i % 3 === 0 ? 'left' : i % 3 === 2 ? 'right' : 'up'}
                delay={(i % 3) * 80}
              >
                <div className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-teal-300 hover:shadow-lg transition-all duration-300 hover:-translate-y-2 h-full cursor-default">
                  <div className="w-11 h-11 rounded-xl bg-teal-50 group-hover:bg-teal-100 flex items-center justify-center mb-4 transition-colors">
                    <f.icon className="w-5 h-5 text-teal-700" />
                  </div>
                  <h3 className="font-semibold text-slate-900 mb-1.5 group-hover:text-teal-700 transition-colors">{f.title}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Why POS Pro ── */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <Reveal direction="left">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">
                Built for Pakistani<br />retail businesses
              </h2>
              <p className="mt-4 text-slate-500 text-lg">
                Unlike foreign POS systems, POS Pro is designed around how Pakistani stores actually work.
              </p>
              <ul className="mt-8 space-y-3">
                {whyItems.map((item, i) => (
                  <Reveal key={item.text} direction="left" delay={i * 70}>
                    <li className="flex items-center gap-3 p-3 rounded-xl hover:bg-amber-50 transition-colors group">
                      <div className="w-8 h-8 rounded-full bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center flex-shrink-0 transition-colors">
                        <item.icon className="w-4 h-4 text-amber-600" />
                      </div>
                      <span className="text-slate-700 font-medium">{item.text}</span>
                    </li>
                  </Reveal>
                ))}
              </ul>
            </Reveal>

            <Reveal direction="right">
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute -inset-4 bg-teal-400/20 rounded-[36px] blur-2xl" />
                <div className="relative bg-gradient-to-br from-teal-700 to-teal-900 rounded-3xl p-8 text-white shadow-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-3 h-3 rounded-full bg-red-400" />
                    <div className="w-3 h-3 rounded-full bg-amber-400" />
                    <div className="w-3 h-3 rounded-full bg-green-400" />
                    <span className="ml-2 text-teal-300 text-xs">WhatsApp Daily Report</span>
                  </div>
                  <div className="bg-white/10 rounded-2xl p-5 font-mono text-sm space-y-2 border border-white/10">
                    <p className="text-amber-400 font-bold text-base">📊 Ali General Store</p>
                    <p className="text-teal-200 text-xs">📅 7 Apr 2026 — Auto Report</p>
                    <div className="border-t border-white/10 pt-2 mt-2 space-y-1.5">
                      <p>💰 Revenue: <span className="text-white font-bold">PKR 82,400</span></p>
                      <p>🛒 Orders: <span className="text-white font-bold">47</span> <span className="text-green-400 text-xs">(▲ 12% vs kal)</span></p>
                      <p>📦 Avg: <span className="text-white font-bold">PKR 1,753</span></p>
                    </div>
                    <div className="border-t border-white/10 pt-2 space-y-1">
                      <p className="text-teal-200 text-xs font-semibold">🏆 TOP PRODUCTS</p>
                      <p>1. <span className="text-white">Pepsi 500ml × 120</span></p>
                      <p>2. <span className="text-white">Lays 34g × 95</span></p>
                    </div>
                    <p className="text-amber-300 text-xs pt-1">⚠️ Low Stock: Lays 34g (2 left)</p>
                  </div>
                  <p className="mt-3 text-teal-300 text-xs text-center">Auto-sent roz raat 10 baje 🤖</p>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section className="py-24 bg-[#f8f7f4]">
        <div className="max-w-6xl mx-auto px-4">
          <Reveal direction="up" className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900">Simple, honest pricing</h2>
            <p className="mt-3 text-slate-500 text-lg">Start free. Upgrade when you&apos;re ready.</p>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-center">
            {plans.map((plan, i) => (
              <Reveal
                key={plan.name}
                direction={i === 0 ? 'left' : i === 2 ? 'right' : 'up'}
                delay={i * 100}
              >
                <div className={`rounded-2xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${
                  plan.highlight
                    ? 'bg-teal-700 border-teal-600 text-white shadow-2xl md:scale-105'
                    : 'bg-white border-gray-200 hover:border-teal-200'
                }`}>
                  {plan.highlight && (
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>
                  )}
                  <h3 className={`text-lg font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>{plan.name}</h3>
                  <div className="mt-2 mb-5">
                    <span className={`text-4xl font-bold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price === 'Custom' ? 'Custom' : `PKR ${plan.price}`}
                    </span>
                    {plan.period && (
                      <span className={`text-sm ml-1 ${plan.highlight ? 'text-teal-200' : 'text-slate-400'}`}>{plan.period}</span>
                    )}
                  </div>
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${plan.highlight ? 'text-amber-400' : 'text-teal-600'}`} />
                        <span className={plan.highlight ? 'text-teal-100' : 'text-slate-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block text-center py-3 rounded-xl font-semibold text-sm transition-all hover:scale-105 active:scale-95 ${
                    plan.highlight ? 'bg-amber-400 hover:bg-amber-500 text-slate-900 shadow-lg shadow-amber-400/30' : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}>
                    {plan.cta}
                  </Link>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 bg-gradient-to-br from-teal-800 to-teal-900 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-amber-400/10 animate-pulse" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-teal-600/30 animate-pulse" />
        <Reveal direction="up" className="max-w-2xl mx-auto px-4 text-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-400/30">
            <ShoppingBag className="w-8 h-8 text-slate-900" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white">Ready to modernize your store?</h2>
          <p className="mt-4 text-teal-200 text-lg">Join 500+ Pakistani retailers already using POS Pro.</p>
          <Link href="/register" className="inline-flex items-center gap-2 mt-8 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-8 py-4 rounded-xl text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-amber-400/30">
            Start Free Trial — No Card Needed <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-4 text-teal-300 text-sm">✓ Setup in 2 minutes &nbsp;·&nbsp; ✓ Koi technical knowledge nahi chahiye</p>
        </Reveal>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-slate-900" />
              </div>
              <p className="font-bold text-white text-lg">POS Pro</p>
            </Link>
            <p className="text-sm mt-3 text-slate-400 max-w-sm">
              Pakistan&apos;s smartest cloud POS for retail. Manage sales, inventory, customers, and staff — all from one dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-4 text-sm">
              <a href="tel:+923001234567" className="hover:text-amber-300 transition-colors">📞 +92 300 1234567</a>
              <a href="mailto:hello@pospro.pk" className="hover:text-amber-300 transition-colors">✉️ hello@pospro.pk</a>
              <span className="text-slate-400">📍 Karachi, Pakistan</span>
            </div>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Product</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-amber-300 transition-colors">Features</Link></li>
              <li><Link href="/billing/plans" className="hover:text-amber-300 transition-colors">Pricing</Link></li>
              <li><Link href="/faq" className="hover:text-amber-300 transition-colors">FAQ</Link></li>
              <li><Link href="/register" className="hover:text-amber-300 transition-colors">Free Trial</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold text-sm mb-3">Legal</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-amber-300 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-amber-300 transition-colors">Contact</Link></li>
              <li><Link href="/terms" className="hover:text-amber-300 transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy" className="hover:text-amber-300 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/refund" className="hover:text-amber-300 transition-colors">Refund Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <p>© {new Date().getFullYear()} POS Pro Pakistan. All rights reserved.</p>
            <p>Made with care in Pakistan 🇵🇰</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
