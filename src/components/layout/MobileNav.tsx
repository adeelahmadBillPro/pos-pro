'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ClipboardList,
  Menu,
  X,
  Tag,
  Warehouse,
  Users,
  RotateCcw,
  Percent,
  UserCheck,
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  Barcode,
  ShieldCheck,
  User,
  LogOut,
  Truck,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import { hasPermission, type UserRole } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
}

// 4 most-used tabs in the bottom bar. Cashier-friendly defaults (POS first, no admin-y items).
const bottomNav: NavItem[] = [
  { label: 'POS',       href: '/pos',        icon: ShoppingCart,    permission: 'pos.use' },
  { label: 'Products',  href: '/products',   icon: Package,         permission: 'products.read' },
  { label: 'Orders',    href: '/orders',     icon: ClipboardList,   permission: 'orders.read' },
  { label: 'Dashboard', href: '/dashboard',  icon: LayoutDashboard, permission: 'dashboard.view' },
]

const allNav: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',   icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'POS Terminal', href: '/pos',         icon: ShoppingCart,    permission: 'pos.use' },
  { label: 'Price Check',  href: '/price-check', icon: Barcode,         permission: 'products.read' },
  { label: 'Products',     href: '/products',    icon: Package,         permission: 'products.read' },
  { label: 'Categories',   href: '/categories',  icon: Tag,             permission: 'categories.read' },
  { label: 'Inventory',    href: '/inventory',   icon: Warehouse,       permission: 'inventory.read' },
  { label: 'Restock Insights', href: '/inventory/insights', icon: BarChart3, permission: 'inventory.read' },
  { label: 'Vendors',      href: '/suppliers',   icon: Truck,           permission: 'suppliers.read' },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText, permission: 'purchase_orders.read' },
  { label: 'Customers',    href: '/customers',   icon: Users,           permission: 'customers.read' },
  { label: 'Orders',       href: '/orders',      icon: ClipboardList,   permission: 'orders.read' },
  { label: 'Returns',      href: '/returns',     icon: RotateCcw,       permission: 'returns.read' },
  { label: 'Discounts',    href: '/discounts',   icon: Percent,         permission: 'discounts.read' },
  { label: 'Staff',        href: '/staff',       icon: UserCheck,       permission: 'staff.read' },
  { label: 'Reports',      href: '/reports',     icon: BarChart3,       permission: 'reports.view' },
  { label: 'Audit Log',    href: '/audit',       icon: ShieldCheck,     permission: 'settings.read' },
  { label: 'Settings',     href: '/settings',    icon: Settings,        permission: 'settings.read' },
  { label: 'Billing',      href: '/billing',     icon: CreditCard,      permission: 'billing.read' },
  { label: 'My Profile',   href: '/profile',     icon: User },
]

export function MobileNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: session, status } = useSession()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const role = (session?.user as any)?.role as UserRole | undefined

  // While session is still loading, show all items optimistically — otherwise the
  // permission filter strips everything out and the menu appears empty until reload.
  const sessionLoading = status === 'loading' || !role
  const visibleBottom = sessionLoading
    ? bottomNav
    : bottomNav.filter((i) => !i.permission || hasPermission(role, i.permission))
  const visibleAll = sessionLoading
    ? allNav
    : allNav.filter((i) => !i.permission || hasPermission(role, i.permission))

  const initials = session?.user?.name
    ? session.user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <>
      {/* ── Bottom Navigation — touch-friendly tabs ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 shadow-lg">
        <div className="flex items-stretch h-16 max-w-md mx-auto">
          {visibleBottom.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors active:scale-95 transform-gpu',
                  active ? 'text-amber-600' : 'text-gray-500 active:text-amber-600',
                )}
              >
                {/* Active indicator pill */}
                {active && (
                  <span className="absolute top-1 inset-x-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-amber-400" />
                )}
                <item.icon className={cn('w-5 h-5 transition-transform', active && 'scale-110')} />
                <span className={cn('font-medium', active && 'font-semibold')}>{item.label}</span>
              </Link>
            )
          })}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              'group relative flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors active:scale-95 transform-gpu',
              sheetOpen ? 'text-amber-600' : 'text-gray-500 active:text-amber-600',
            )}
          >
            <Menu className="w-5 h-5" />
            <span className="font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* ── Sheet overlay ── slides in from right */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex modal-overlay-anim">
          <div
            className="flex-1 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          <div className="w-72 bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col h-full overflow-y-auto sheet-anim shadow-2xl">
            {/* User card at top */}
            <div className="p-4 border-b border-slate-700/50 bg-gradient-to-br from-amber-500/10 to-teal-500/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 flex items-center justify-center text-slate-900 font-bold text-sm">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-semibold truncate">{session?.user?.name || 'User'}</p>
                  <p className="text-amber-300 text-[10px] font-semibold uppercase tracking-wide truncate">{role}</p>
                </div>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/50 transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <nav className="flex-1 py-3 px-3 space-y-0.5">
              {visibleAll.map((item) => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSheetOpen(false)}
                    className={cn(
                      'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all',
                      active
                        ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold shadow-md'
                        : 'text-slate-300 hover:bg-slate-800/70 active:scale-[0.98]',
                    )}
                  >
                    <item.icon className={cn('w-4 h-4 flex-shrink-0 transition-transform', active && 'scale-110')} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}

              {role === 'SUPER_ADMIN' && (
                <Link
                  href="/super-admin"
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mt-3 border-t border-slate-700/50 pt-4',
                    isActive('/super-admin')
                      ? 'bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 font-semibold'
                      : 'text-slate-300 hover:bg-slate-800/70',
                  )}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>

            <div className="p-3 border-t border-slate-700/50">
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl text-rose-300 hover:bg-rose-900/30 active:bg-rose-900/50 text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
