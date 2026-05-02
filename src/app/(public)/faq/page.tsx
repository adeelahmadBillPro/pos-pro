'use client'

import Link from 'next/link'
import { useState } from 'react'
import { HelpCircle, ChevronDown, MessageCircle } from 'lucide-react'

// (Note: metadata can't be exported from a 'use client' file — title set via parent layout)

const faqs: { q: string; a: string }[] = [
  {
    q: 'What is POS Pro?',
    a: 'POS Pro is a cloud-based point-of-sale system designed for Pakistani retailers. It handles sales, inventory, customers, staff, and reporting — all from one dashboard accessible on any device with a browser.',
  },
  {
    q: 'How does the 7-day free trial work?',
    a: 'Sign up with your email and store name — no credit card required. You get full access to all features for 7 days. After that, you can subscribe to a plan or your account pauses (your data stays safe for 30 days).',
  },
  {
    q: 'Which businesses can use POS Pro?',
    a: 'Almost any retail business: grocery stores, electronics shops, clothing boutiques, mobile shops, pharmacies, salons, gift shops, bakeries, coffee shops, hardware stores, etc. The system is generic — you create your own categories and products to fit your business.',
  },
  {
    q: 'How do I pay for the subscription?',
    a: 'After choosing a plan, you transfer the amount to our bank account (HBL, Meezan, UBL, or others displayed at checkout) via internet banking, JazzCash, or EasyPaisa. Upload the payment screenshot and our team activates your subscription within 24 hours.',
  },
  {
    q: 'Do I need a barcode scanner?',
    a: 'No, but it makes things faster. Any USB barcode scanner ("gun") works plug-and-play — no drivers needed. POS Pro auto-detects scanned barcodes and adds products to the cart instantly. You can also search products manually by name or SKU.',
  },
  {
    q: 'Can multiple cashiers use the system at the same time?',
    a: 'Yes. Each cashier gets their own login. They clock in with opening cash, ring up sales independently, and clock out with their own end-of-shift summary (sales, expected cash, actual cash, variance). Owners and managers see everyone\'s reports.',
  },
  {
    q: 'Does it work on mobile / tablet?',
    a: 'Yes. POS Pro is fully responsive — works on any phone, tablet, laptop, or desktop with an internet connection. We recommend a tablet (10"+) for the cashier counter and a phone for management on the go.',
  },
  {
    q: 'What if my internet goes down?',
    a: 'Currently POS Pro requires an internet connection. Offline mode is on our roadmap. We recommend a backup internet (4G/5G hotspot) for critical hours. Once internet returns, all data syncs automatically.',
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Data is stored on encrypted cloud servers with daily automated backups. Passwords are bcrypt-hashed (we never see plain passwords). All connections use SSL/TLS encryption. Each store\'s data is fully isolated — no other store can ever see yours.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel anytime from Settings → Billing. Service continues until the end of your current paid period. No cancellation fees, no questions asked. You can export all your data before leaving.',
  },
  {
    q: 'Can I import my existing products from Excel?',
    a: 'Yes. Go to Products → Import → upload a CSV/Excel file or paste from spreadsheet. We provide a template with proper columns (name, SKU, price, category, etc.). Duplicate SKUs are automatically skipped. Image URLs work too if you host images publicly (imgur, Cloudinary, etc.).',
  },
  {
    q: 'Does it integrate with FBR for tax filing?',
    a: 'GST calculation is built-in (configurable percentage). Direct FBR API integration is on our roadmap and will be available as a paid add-on. For now, you can export your sales data and submit it to FBR via your accountant.',
  },
  {
    q: 'How many products can I have?',
    a: 'Depends on plan. Starter plan supports 500 products. Pro plan supports 5,000+ products. Enterprise plan is unlimited. See pricing page for details.',
  },
  {
    q: 'Can I print receipts?',
    a: 'Yes. POS Pro generates a printable receipt after every sale. Works with any thermal receipt printer (USB-connected) or you can print to A4 on a regular printer. Customer can also receive receipt via WhatsApp/email (coming soon).',
  },
  {
    q: 'What about returns and refunds?',
    a: 'Cashiers can process customer returns through Returns page — selects the original order, picks items being returned, system reverses inventory and refund. Manager/Owner approval may be required depending on your settings.',
  },
  {
    q: 'Can I have multiple stores under one account?',
    a: 'Currently each subscription covers one store. If you have multiple branches, create a separate account for each. Multi-store/branch consolidation is on our roadmap as a Pro feature.',
  },
  {
    q: 'Is there training or setup help?',
    a: 'Yes. We offer free onboarding via WhatsApp/Zoom for the first 30 minutes. After that, our help docs (coming soon) and WhatsApp support handle most questions. Custom on-site training is available on request (paid).',
  },
  {
    q: 'How do I contact support?',
    a: 'Fastest: WhatsApp +92 300 1234567 (avg reply 30 min). Email: support@pospro.pk. Phone: +92 300 1234567 (Mon-Sat 9 AM-9 PM PKT).',
  },
]

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">

      {/* Header */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center gap-2 text-amber-700 bg-amber-50 px-3 py-1 rounded-full text-xs font-semibold mb-4">
          <HelpCircle className="w-3.5 h-3.5" />
          FAQ
        </div>
        <h1 className="text-3xl sm:text-5xl font-bold text-slate-900">Frequently asked questions</h1>
        <p className="text-slate-600 mt-3 text-base">Quick answers to common questions about POS Pro.</p>
      </header>

      {/* Accordion */}
      <div className="space-y-3 mb-10">
        {faqs.map((f, i) => {
          const open = openIdx === i
          return (
            <div
              key={i}
              className={`bg-white rounded-xl border transition-all ${open ? 'border-amber-300 shadow-md' : 'border-gray-200 hover:border-gray-300'}`}
            >
              <button
                onClick={() => setOpenIdx(open ? null : i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                aria-expanded={open}
              >
                <span className={`font-semibold ${open ? 'text-amber-700' : 'text-slate-800'}`}>
                  {f.q}
                </span>
                <ChevronDown
                  className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180 text-amber-600' : 'text-gray-400'}`}
                />
              </button>
              <div
                className={`grid transition-all duration-200 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
              >
                <div className="overflow-hidden">
                  <div className="px-5 pb-4 text-sm text-slate-600 leading-relaxed">
                    {f.a}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-br from-amber-50 to-teal-50 rounded-2xl border border-amber-200 p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-amber-400 mx-auto flex items-center justify-center mb-3">
          <MessageCircle className="w-6 h-6 text-slate-900" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1">Still have questions?</h3>
        <p className="text-sm text-slate-600 mb-4">
          Our team replies within 30 minutes on WhatsApp.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <a
            href="https://wa.me/923001234567"
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp Us
          </a>
          <Link
            href="/contact"
            className="h-11 px-6 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-700 text-sm font-semibold flex items-center justify-center transition-colors"
          >
            All Contact Options
          </Link>
        </div>
      </div>
    </div>
  )
}
