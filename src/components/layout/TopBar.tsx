'use client'

import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  LogOut,
  Settings,
} from 'lucide-react'
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
}

export function TopBar({ user }: TopBarProps) {
  const pathname = usePathname()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const pageTitle = Object.entries(pathLabels).find(([key]) =>
    pathname === key || (key !== '/dashboard' && pathname.startsWith(key))
  )?.[1] || 'Dashboard'

  const initials = user.name
    ? user.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U'

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 h-16 flex items-center px-4 gap-4">
      {/* Mobile menu trigger (just for spacing, actual nav is in MobileNav) */}
      <div className="lg:hidden w-8 h-8" />

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-lg font-semibold text-slate-900 truncate">{pageTitle}</h1>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        {/* User dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
          >
            <Avatar className="w-8 h-8">
              <AvatarImage src={user.avatar || ''} alt={user.name || ''} />
              <AvatarFallback className="bg-teal-100 text-teal-700 text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-sm font-medium text-slate-900 leading-none truncate max-w-32">
                {user.name || 'User'}
              </p>
              <p className="text-xs text-slate-500 leading-none mt-0.5 truncate max-w-32">
                {user.role}
              </p>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <div className="px-3 py-2 border-b border-gray-100">
                <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
                <p className="text-xs text-slate-500 truncate">{user.email}</p>
              </div>

              <Link
                href="/profile"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <User className="w-4 h-4" />
                My Profile
              </Link>

              <Link
                href="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-gray-50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Store Settings
              </Link>

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
