import Link from 'next/link'
import { ShoppingBag, Phone, Mail, MapPin } from 'lucide-react'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f8f7f4] flex flex-col">
      {/* ── Header ── */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-md bg-white/90">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
              <ShoppingBag className="w-5 h-5 text-slate-900" />
            </div>
            <div>
              <p className="font-bold text-slate-900 leading-none">POS Pro</p>
              <p className="text-[10px] text-amber-600 leading-none mt-0.5 font-medium uppercase tracking-wide">Pakistan</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="text-slate-600 hover:text-amber-700 transition-colors">Home</Link>
            <Link href="/about" className="text-slate-600 hover:text-amber-700 transition-colors">About</Link>
            <Link href="/faq" className="text-slate-600 hover:text-amber-700 transition-colors">FAQ</Link>
            <Link href="/contact" className="text-slate-600 hover:text-amber-700 transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 text-slate-700 text-sm font-medium items-center transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="h-9 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 text-sm font-semibold flex items-center transition-colors shadow-sm"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1">
        {children}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-900 text-slate-300 mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-slate-900" />
              </div>
              <p className="font-bold text-white">POS Pro</p>
            </Link>
            <p className="text-sm mt-3 text-slate-400 max-w-sm">
              Pakistan&apos;s smartest cloud POS for retail. Manage sales, inventory, customers, and staff — all from one dashboard.
            </p>
            <div className="flex flex-col gap-2 mt-4 text-sm">
              <a href="tel:+923001234567" className="flex items-center gap-2 hover:text-amber-300 transition-colors">
                <Phone className="w-3.5 h-3.5" />
                <span>+92 300 1234567</span>
              </a>
              <a href="mailto:hello@pospro.pk" className="flex items-center gap-2 hover:text-amber-300 transition-colors">
                <Mail className="w-3.5 h-3.5" />
                <span>hello@pospro.pk</span>
              </a>
              <div className="flex items-start gap-2 text-slate-400">
                <MapPin className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Karachi, Pakistan</span>
              </div>
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
