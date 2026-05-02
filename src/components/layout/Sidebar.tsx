'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Warehouse,
  Users,
  ClipboardList,
  RotateCcw,
  Percent,
  UserCheck,
  BarChart3,
  Settings,
  CreditCard,
  Shield,
  LogOut,
  ShieldCheck,
  Barcode,
  Truck,
  FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { hasPermission, type UserRole } from '@/lib/permissions'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  /** Required permission — item is hidden if user lacks it. Empty = always visible. */
  permission?: string
}

const mainNav: NavItem[] = [
  { label: 'Dashboard',    href: '/dashboard',  icon: LayoutDashboard, permission: 'dashboard.view' },
  { label: 'POS Terminal', href: '/pos',        icon: ShoppingCart,    permission: 'pos.use' },
  { label: 'Price Check',  href: '/price-check', icon: Barcode,         permission: 'products.read' },
  { label: 'Products',     href: '/products',   icon: Package,         permission: 'products.read' },
  { label: 'Categories',   href: '/categories', icon: Tag,             permission: 'categories.read' },
  { label: 'Inventory',    href: '/inventory',  icon: Warehouse,       permission: 'inventory.read' },
  { label: 'Restock Insights', href: '/inventory/insights', icon: BarChart3, permission: 'inventory.read' },
  { label: 'Vendors',      href: '/suppliers',  icon: Truck,           permission: 'suppliers.read' },
  { label: 'Purchase Orders', href: '/purchase-orders', icon: FileText, permission: 'purchase_orders.read' },
  { label: 'Customers',    href: '/customers',  icon: Users,           permission: 'customers.read' },
  { label: 'Orders',       href: '/orders',     icon: ClipboardList,   permission: 'orders.read' },
  { label: 'Returns',      href: '/returns',    icon: RotateCcw,       permission: 'returns.read' },
  { label: 'Discounts',    href: '/discounts',  icon: Percent,         permission: 'discounts.read' },
  { label: 'Staff',        href: '/staff',      icon: UserCheck,       permission: 'staff.read' },
  { label: 'Reports',      href: '/reports',    icon: BarChart3,       permission: 'reports.view' },
  { label: 'Audit Log',    href: '/audit',      icon: ShieldCheck,     permission: 'settings.read' },
  { label: 'Settings',     href: '/settings',   icon: Settings,        permission: 'settings.read' },
  { label: 'Billing',      href: '/billing',    icon: CreditCard,      permission: 'billing.read' },
]

const superAdminNav: NavItem[] = [
  { label: 'Admin Panel', href: '/super-admin', icon: Shield },
]

interface SidebarProps {
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

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname.startsWith(href)
  }

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white dark:bg-slate-950 border-r border-gray-100 dark:border-slate-800">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100 dark:border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-amber-400 dark:bg-amber-400 flex items-center justify-center flex-shrink-0 shadow-sm">
          <ShoppingCart className="w-5 h-5 text-slate-900" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-900 dark:text-slate-50 font-bold text-sm truncate">
            {user.storeName || 'POS Pro'}
          </p>
          <p className="text-teal-600 dark:text-teal-400 text-xs font-medium truncate">{user.role}</p>
        </div>
      </div>

      {/* Nav links — filtered by user's role permissions */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {mainNav
          .filter((item) => !item.permission || hasPermission(user.role as UserRole, item.permission))
          .map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 overflow-hidden',
                active
                  ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 shadow-md shadow-amber-200'
                  : 'text-slate-500 hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent hover:text-slate-900'
              )}
            >
              {/* Animated left bar — visible on active or hover */}
              <span
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300',
                  active ? 'h-7 bg-teal-700' : 'h-0 bg-amber-400 group-hover:h-5',
                )}
              />
              <item.icon
                className={cn(
                  'w-4 h-4 flex-shrink-0 transition-transform duration-200',
                  active
                    ? 'text-slate-900 scale-110'
                    : 'text-slate-400 group-hover:text-amber-600 group-hover:scale-110',
                )}
              />
              <span className="truncate">{item.label}</span>
              {/* Subtle dot indicator on hover (non-active) */}
              {!active && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              )}
            </Link>
          )
        })}

        {user.role === 'SUPER_ADMIN' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Super Admin
              </p>
            </div>
            {superAdminNav.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                    active
                      ? 'bg-gradient-to-r from-amber-300 to-amber-400 text-slate-900 shadow-md shadow-amber-200'
                      : 'text-slate-500 hover:bg-gradient-to-r hover:from-amber-50 hover:to-transparent hover:text-slate-900',
                  )}
                >
                  <span
                    className={cn(
                      'absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300',
                      active ? 'h-7 bg-teal-700' : 'h-0 bg-amber-400 group-hover:h-5',
                    )}
                  />
                  <item.icon className={cn('w-4 h-4 flex-shrink-0 transition-transform duration-200', active ? 'text-slate-900 scale-110' : 'text-slate-400 group-hover:text-amber-600 group-hover:scale-110')} />
                  <span className="truncate">{item.label}</span>
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 dark:border-slate-800 p-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
            <AvatarFallback className="bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-200 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 dark:text-slate-100 text-sm font-semibold truncate">{user.name || 'User'}</p>
            <p className="text-slate-400 dark:text-slate-500 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500 dark:text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-xs rounded-xl"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
