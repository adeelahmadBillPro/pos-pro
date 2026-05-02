import type { Metadata } from 'next'
import Link from 'next/link'
import { Phone, Mail, MapPin, MessageCircle, Clock, ShieldCheck, Headphones } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Contact Us — POS Pro',
  description: 'Get in touch with POS Pro support team. WhatsApp, email, and phone.',
}

const supportChannels = [
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    desc: 'Fastest response — average reply within 30 minutes',
    value: '+92 300 1234567',
    href: 'https://wa.me/923001234567',
    accent: 'emerald',
    primary: true,
  },
  {
    icon: Phone,
    title: 'Phone',
    desc: 'Mon–Sat, 9 AM – 9 PM PKT',
    value: '+92 300 1234567',
    href: 'tel:+923001234567',
    accent: 'amber',
  },
  {
    icon: Mail,
    title: 'Email',
    desc: 'For detailed queries and documentation',
    value: 'hello@pospro.pk',
    href: 'mailto:hello@pospro.pk',
    accent: 'teal',
  },
]

const departments = [
  { label: 'General questions', email: 'hello@pospro.pk' },
  { label: 'Sales & demos', email: 'sales@pospro.pk' },
  { label: 'Billing & payments', email: 'billing@pospro.pk' },
  { label: 'Technical support', email: 'support@pospro.pk' },
  { label: 'Privacy & data', email: 'privacy@pospro.pk' },
  { label: 'Legal', email: 'legal@pospro.pk' },
]

const accentMap = {
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', icon: 'bg-emerald-100 text-emerald-700' },
  amber:   { bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700',   icon: 'bg-amber-100 text-amber-700' },
  teal:    { bg: 'bg-teal-50',    border: 'border-teal-200',    text: 'text-teal-700',    icon: 'bg-teal-100 text-teal-700' },
}

export default function ContactPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Hero */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <Headphones className="w-3.5 h-3.5" />
          GET IN TOUCH
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900">We&apos;re here to help</h1>
        <p className="text-slate-600 mt-3 text-base sm:text-lg max-w-xl mx-auto">
          Sales, support, demos, or just a quick question — reach out and we&apos;ll get back fast.
        </p>
      </header>

      {/* Channels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
        {supportChannels.map((c) => {
          const a = accentMap[c.accent as keyof typeof accentMap]
          return (
            <a
              key={c.title}
              href={c.href}
              target={c.href.startsWith('http') ? '_blank' : undefined}
              rel={c.href.startsWith('http') ? 'noopener noreferrer' : undefined}
              className={`group block rounded-2xl border-2 ${a.border} ${a.bg} p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all relative overflow-hidden ${c.primary ? 'ring-2 ring-emerald-300/50' : ''}`}
            >
              {c.primary && (
                <span className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-0.5 rounded-full">
                  Recommended
                </span>
              )}
              <div className={`w-12 h-12 rounded-xl ${a.icon} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <c.icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">{c.title}</h3>
              <p className="text-xs text-slate-600 mb-3 leading-snug">{c.desc}</p>
              <p className={`text-sm font-semibold ${a.text}`}>{c.value}</p>
            </a>
          )
        })}
      </div>

      {/* Office info + Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">Our Office</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                POS Pro Pakistan<br />
                Karachi, Sindh<br />
                Pakistan
              </p>
              <p className="text-xs text-slate-400 mt-2 italic">
                Visits by appointment only — please email first.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-slate-900 mb-2">Support Hours</h3>
              <div className="space-y-1 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Monday – Friday</span>
                  <span className="font-medium text-slate-800">9 AM – 9 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span className="font-medium text-slate-800">10 AM – 6 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span className="text-slate-400">Closed (urgent only)</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-3 italic">All times Pakistan Standard Time (PKT).</p>
            </div>
          </div>
        </div>
      </div>

      {/* Departments */}
      <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-2xl border border-amber-200 p-6 mb-10">
        <div className="flex items-center gap-2 mb-4">
          <ShieldCheck className="w-5 h-5 text-amber-700" />
          <h3 className="font-bold text-slate-900">Direct department contacts</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {departments.map((d) => (
            <a
              key={d.email}
              href={`mailto:${d.email}`}
              className="bg-white rounded-xl px-4 py-3 hover:shadow-sm hover:border-amber-300 border border-amber-100 transition-all flex items-center justify-between gap-2"
            >
              <span className="text-sm text-slate-700 font-medium">{d.label}</span>
              <span className="text-xs text-amber-700 truncate">{d.email}</span>
            </a>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center bg-slate-900 rounded-2xl p-8 text-white">
        <h2 className="text-xl font-bold mb-2">Ready to try POS Pro?</h2>
        <p className="text-slate-300 text-sm mb-5">7-day free trial. No credit card needed.</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="h-11 px-6 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold flex items-center justify-center transition-colors"
          >
            Start Free Trial
          </Link>
          <Link
            href="/billing/plans"
            className="h-11 px-6 rounded-xl border border-slate-700 hover:bg-slate-800 text-white font-medium flex items-center justify-center transition-colors"
          >
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  )
}
