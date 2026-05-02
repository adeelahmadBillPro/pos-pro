'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
  Plus,
  ShoppingCart,
  Sun,
  Sunrise,
  Moon,
  AlertTriangle,
  TrendingUp,
  ClipboardList,
  Calendar,
  Monitor,
  Check,
} from 'lucide-react'
import { useTheme, type Theme } from '@/components/providers/ThemeProvider'
import { cn } from '@/lib/utils'
import { useState, useRef, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import Link from 'next/link'

interface TopBarProps {
  user: {
    id: string
    name?: string | null
    email?: string | null
    role: string
    storeId?: string
    storeName?: string
    avatar?: string
  }
}

const pathLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/pos': 'POS Terminal',
  '/price-check': 'Price Check',
  '/products': 'Products',
  '/categories': 'Categories',
  '/inventory': 'Inventory',
  '/customers': 'Customers',
  '/orders': 'Orders',
  '/returns': 'Returns',
  '/discounts': 'Discounts',
  '/staff': 'Staff',
  '/reports': 'Reports',
  '/settings': 'Store Settings',
  '/profile': 'My Profile',
  '/billing': 'Billing',
  '/super-admin': 'Admin Panel',
  '/audit': 'Audit Log',
}

interface Notification {
  id: string
  type: 'low_stock' | 'pending_order' | 'subscription'
  title: string
  href: string
  count?: number
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5)  return { text: 'Good night',     Icon: Moon }
  if (h < 12) return { text: 'Good morning',   Icon: Sunrise }
  if (h < 17) return { text: 'Good afternoon', Icon: Sun }
  if (h < 21) return { text: 'Good evening',   Icon: Sunrise }
  return        { text: 'Good night',     Icon: Moon }
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [themeOpen, setThemeOpen] = useState(false)
  const [notifs, setNotifs] = useState<Notification[]>([])
  const [today, setToday] = useState({ orders: 0, sales: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const bellRef = useRef<HTMLDivElement>(null)
  const themeRef = useRef<HTMLDivElement>(null)
  const greeting = getGreeting()
  const { theme, resolved, setTheme } = useTheme()

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false)
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Fetch quick stats + low-stock notifications
  useEffect(() => {
    if (!user.storeId) return
    let stop = false

    async function loadStats() {
      try {
        const [salesRes, invRes] = await Promise.all([
          fetch('/api/reports/sales?period=today').catch(() => null),
          fetch('/api/inventory?lowStock=1').catch(() => null),
        ])

        if (stop) return

        if (salesRes?.ok) {
          const sj = await salesRes.json()
          if (sj?.success) {
            setToday({
              orders: sj.data?.totalOrders ?? 0,
              sales: sj.data?.totalSales ?? 0,
            })
          }
        }

        if (invRes?.ok) {
          const ij = await invRes.json()
          if (ij?.success && Array.isArray(ij.data)) {
            const low = ij.data.filter((i: any) => i.quantity <= (i.product?.minStock ?? 5))
            if (low.length > 0) {
              setNotifs([
                {
                  id: 'low-stock',
                  type: 'low_stock',
                  title: `${low.length} product${low.length > 1 ? 's' : ''} running low on stock`,
                  href: '/inventory',
                  count: low.length,
                },
              ])
            } else {
              setNotifs([])
            }
          }
        }
      } catch {}
    }

    loadStats()
    // Refresh every 60s so stats stay live during a shift
    const id = setInterval(loadStats, 60_000)
    return () => { stop = true; clearInterval(id) }
  }, [user.storeId])

  const pageTitle = Object.entries(pathLabels).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] || 'Dashboard'

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  const firstName = user.name?.split(' ')[0] ?? 'there'
  const todayLabel = new Date().toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short',
  })

  const notifCount = notifs.reduce((s, n) => s + (n.count ?? 1), 0)

  // Quick action depends on role + current page
  const role = user.role
  const canAddProduct = role === 'OWNER' || role === 'MANAGER'

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-slate-700 h-16 flex items-center px-4 gap-4 shadow-sm">
      {/* Mobile menu spacer (actual nav is in MobileNav) */}
      <div className="lg:hidden w-8 h-8" />

      {/* ── Left: Page title + greeting ── */}
      <div className="flex-1 min-w-0 flex items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 truncate leading-none">
            {pageTitle}
          </h1>
          <div className="hidden sm:flex items-center gap-1.5 mt-1 text-xs text-slate-500 dark:text-slate-400">
            <greeting.Icon className="w-3 h-3 text-amber-500" />
            <span>{greeting.text},</span>
            <span className="font-medium text-slate-700 dark:text-slate-200">{firstName}!</span>
            <span className="text-gray-300 dark:text-slate-600">·</span>
            <Calendar className="w-3 h-3" />
            <span>{todayLabel}</span>
          </div>
        </div>
      </div>

      {/* ── Center: Today's quick stats (desktop only) ── */}
      {user.storeId && (today.orders > 0 || today.sales > 0) && (
        <div className="hidden xl:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
            <div className="leading-none">
              <p className="text-[10px] font-medium text-emerald-700 uppercase tracking-wide">Today</p>
              <p className="text-sm font-bold text-emerald-800 tabular-nums">
                Rs {today.sales.toLocaleString('en-PK')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-50 border border-violet-100">
            <ClipboardList className="w-3.5 h-3.5 text-violet-600" />
            <div className="leading-none">
              <p className="text-[10px] font-medium text-violet-700 uppercase tracking-wide">Orders</p>
              <p className="text-sm font-bold text-violet-800 tabular-nums">{today.orders}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Right: Actions + Notifications + User ── */}
      <div className="flex items-center gap-1.5 sm:gap-2">

        {/* Quick: New Sale (POS) — visible only when not on POS */}
        {!pathname.startsWith('/pos') && (
          <Link
            href="/pos"
            className="hidden md:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-amber-400 hover:bg-amber-500 active:bg-amber-600 text-slate-900 text-sm font-semibold transition-colors shadow-sm"
            title="Open POS Terminal"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Sale</span>
          </Link>
        )}

        {/* Quick: Add Product (Owner/Manager only) */}
        {canAddProduct && pathname.startsWith('/products') && !pathname.includes('/new') && !pathname.includes('/edit') && (
          <Link
            href="/products/new"
            className="hidden sm:inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-sm font-semibold transition-colors shadow-sm"
            title="Add new product"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </Link>
        )}

        {/* Theme toggle */}
        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen((p) => !p)}
            className="w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center"
            title={`Theme: ${theme}`}
            aria-label="Change theme"
          >
            {resolved === 'dark' ? (
              <Moon className="w-4 h-4 text-amber-300" />
            ) : (
              <Sun className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {themeOpen && (
            <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 modal-content-anim origin-top-right">
              <p className="px-3 py-2 text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Theme</p>
              {(['light', 'dark', 'system'] as Theme[]).map((t) => {
                const Icon = t === 'light' ? Sun : t === 'dark' ? Moon : Monitor
                const selected = theme === t
                return (
                  <button
                    key={t}
                    onClick={() => { setTheme(t); setThemeOpen(false) }}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors',
                      selected
                        ? 'bg-amber-50 text-amber-700 font-semibold'
                        : 'text-slate-700 hover:bg-gray-50',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="capitalize flex-1 text-left">{t}</span>
                    {selected && <Check className="w-3.5 h-3.5" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Notifications bell */}
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((p) => !p)}
            className="relative w-9 h-9 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors flex items-center justify-center"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            {notifCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center heartbeat">
                {notifCount > 9 ? '9+' : notifCount}
              </span>
            )}
          </button>

          {bellOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 modal-content-anim origin-top-right">
              <div className="px-3 py-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {notifs.length > 0 && (
                  <span className="text-xs bg-rose-100 text-rose-700 rounded-full px-2 py-0.5 font-semibold">
                    {notifCount} new
                  </span>
                )}
              </div>

              {notifs.length === 0 ? (
                <div className="px-3 py-6 text-center">
                  <Bell className="w-6 h-6 text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">All caught up — no new alerts</p>
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto">
                  {notifs.map((n) => (
                    <Link
                      key={n.id}
                      href={n.href}
                      onClick={() => setBellOpen(false)}
                      className="flex items-start gap-3 px-3 py-2.5 hover:bg-amber-50 border-b border-gray-50 last:border-0 transition-colors"
                    >
                      <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 leading-tight">{n.title}</p>
                        <p className="text-xs text-amber-700 mt-1 hover:underline">View details →</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-xl px-2 py-1 hover:bg-gray-100 dark:hover:bg-slate-800 active:bg-gray-200 dark:active:bg-slate-700 transition-colors"
          >
            <Avatar className="w-9 h-9 ring-2 ring-amber-300/60">
              <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
              <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-50 leading-none truncate max-w-32">
                {user.name || 'User'}
              </p>
              <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-none mt-0.5 truncate max-w-32 font-semibold">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 modal-content-anim origin-top-right">
              <div className="px-3 py-3 border-b border-gray-100 bg-gradient-to-br from-amber-50 to-teal-50">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
                {user.storeName && (
                  <p className="text-[11px] text-teal-700 mt-1 font-medium truncate">📍 {user.storeName}</p>
                )}
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 transition-colors"
              >
                <User className="w-4 h-4 text-amber-600" />
                My Profile
              </Link>

              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-amber-50 transition-colors"
              >
                <Settings className="w-4 h-4 text-teal-600" />
                Store Settings
              </Link>

              <div className="border-t border-gray-100 my-1" />

              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
