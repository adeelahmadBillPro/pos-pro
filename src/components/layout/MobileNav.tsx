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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useSession, signOut } from 'next-auth/react'
import { Button } from '@/components/ui/button'

const bottomNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'POS', href: '/pos', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
]

const allNav = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'POS Terminal', href: '/pos', icon: ShoppingCart },
  { label: 'Products', href: '/products', icon: Package },
  { label: 'Categories', href: '/categories', icon: Tag },
  { label: 'Inventory', href: '/inventory', icon: Warehouse },
  { label: 'Customers', href: '/customers', icon: Users },
  { label: 'Orders', href: '/orders', icon: ClipboardList },
  { label: 'Returns', href: '/returns', icon: RotateCcw },
  { label: 'Discounts', href: '/discounts', icon: Percent },
  { label: 'Staff', href: '/staff', icon: UserCheck },
  { label: 'Reports', href: '/reports', icon: BarChart3 },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
]

export function MobileNav() {
  const pathname = usePathname()
  const [sheetOpen, setSheetOpen] = useState(false)
  const { data: session } = useSession()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 safe-area-pb">
        <div className="flex items-stretch h-16">
          {bottomNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-1 text-xs transition-colors',
                isActive(item.href)
                  ? 'text-amber-500'
                  : 'text-gray-500 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          ))}
          <button
            onClick={() => setSheetOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-1 text-xs text-gray-500 hover:text-gray-900 transition-colors"
          >
            <Menu className="w-5 h-5" />
            <span>More</span>
          </button>
        </div>
      </nav>

      {/* Sheet overlay */}
      {sheetOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="w-72 bg-slate-900 flex flex-col h-full overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-slate-700">
              <span className="text-white font-semibold">Navigation</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 py-4 px-3 space-y-0.5">
              {allNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive(item.href)
                      ? 'bg-amber-400 text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                </Link>
              ))}

              {session?.user?.role === 'SUPER_ADMIN' && (
                <Link
                  href="/super-admin"
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                    isActive('/super-admin')
                      ? 'bg-amber-400 text-slate-900'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  )}
                >
                  <Shield className="w-4 h-4 flex-shrink-0" />
                  <span>Admin Panel</span>
                </Link>
              )}
            </nav>

            <div className="p-4 border-t border-slate-700">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                Sign out
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
