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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const mainNav: NavItem[] = [
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
  { label: 'Audit Log', href: '/audit', icon: ShieldCheck },
  { label: 'Settings', href: '/settings', icon: Settings },
  { label: 'Billing', href: '/billing', icon: CreditCard },
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
    <div className="flex flex-col h-full overflow-hidden bg-white border-r border-gray-100">
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-100">
        <div className="w-9 h-9 rounded-xl bg-teal-700 flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-slate-900 font-bold text-sm truncate">
            {user.storeName || 'POS Pro'}
          </p>
          <p className="text-teal-600 text-xs font-medium truncate">{user.role}</p>
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {mainNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive(item.href)
                ? 'bg-amber-400 text-slate-900 shadow-sm'
                : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
            )}
          >
            <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive(item.href) ? 'text-slate-900' : 'text-slate-400')} />
            <span className="truncate">{item.label}</span>
          </Link>
        ))}

        {user.role === 'SUPER_ADMIN' && (
          <>
            <div className="pt-4 pb-1 px-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Super Admin
              </p>
            </div>
            {superAdminNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  isActive(item.href)
                    ? 'bg-amber-400 text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:bg-gray-50 hover:text-slate-800'
                )}
              >
                <item.icon className={cn('w-4 h-4 flex-shrink-0', isActive(item.href) ? 'text-slate-900' : 'text-slate-400')} />
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* User section */}
      <div className="border-t border-gray-100 p-3">
        <div className="flex items-center gap-3 mb-2 px-1">
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 text-sm font-semibold truncate">{user.name || 'User'}</p>
            <p className="text-slate-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-slate-500 hover:text-red-600 hover:bg-red-50 text-xs rounded-xl"
          onClick={() => signOut({ callbackUrl: '/login' })}
        >
          <LogOut className="w-3.5 h-3.5 mr-2" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
