'use client'

import { useEffect, useState, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { ShoppingBag } from 'lucide-react'

// ─── Top progress bar ────────────────────────────────────────────────────────
function ProgressBar({ active }: { active: boolean }) {
  const [width, setWidth] = useState(0)
  const [visible, setVisible] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (active) {
      setVisible(true)
      setWidth(0)
      setTimeout(() => setWidth(30), 50)
      setTimeout(() => setWidth(60), 300)
      setTimeout(() => setWidth(80), 700)
      setTimeout(() => setWidth(85), 1200)
    } else {
      setWidth(100)
      timerRef.current = setTimeout(() => {
        setVisible(false)
        setWidth(0)
      }, 400)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [active])

  if (!visible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-amber-400 shadow-[0_0_8px_2px_rgba(251,191,36,0.5)] transition-all"
        style={{
          width: `${width}%`,
          transitionDuration: width === 100 ? '300ms' : '500ms',
          transitionTimingFunction: width === 100 ? 'ease-out' : 'ease-in-out',
        }}
      />
    </div>
  )
}

// ─── Splash loader — only for dashboard routes, not landing/auth pages ───────
const SPLASH_PATHS = ['/dashboard', '/pos', '/products', '/categories', '/inventory',
  '/customers', '/orders', '/returns', '/discounts', '/staff', '/reports',
  '/settings', '/billing', '/super-admin', '/audit']

function SplashLoader({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 z-[9998] bg-[#f8f7f4] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-amber-400 flex items-center justify-center animate-pulse">
          <ShoppingBag className="w-8 h-8 text-slate-900" />
        </div>
        <div className="absolute -inset-2 rounded-[20px] border-2 border-transparent border-t-amber-400 border-r-teal-500 animate-spin" />
      </div>
      <p className="text-sm font-medium text-slate-400 tracking-wide">Loading…</p>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────
export function PageLoader() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [barActive, setBarActive] = useState(false)
  const [splash, setSplash] = useState(false)
  const isFirst = useRef(true)
  const prevPath = useRef(pathname)

  // Show splash only on dashboard routes (not landing page, not login)
  useEffect(() => {
    const isDashboard = SPLASH_PATHS.some((p) => pathname.startsWith(p))
    if (!isDashboard) return

    setSplash(true)
    const t = setTimeout(() => setSplash(false), 600)
    return () => clearTimeout(t)
  }, []) // only on mount

  // Progress bar on route changes
  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false
      prevPath.current = pathname
      return
    }
    if (prevPath.current === pathname) return
    prevPath.current = pathname

    setBarActive(true)
    const t = setTimeout(() => setBarActive(false), 100)
    return () => clearTimeout(t)
  }, [pathname, searchParams])

  return (
    <>
      <SplashLoader visible={splash} />
      <ProgressBar active={barActive} />
    </>
  )
}
