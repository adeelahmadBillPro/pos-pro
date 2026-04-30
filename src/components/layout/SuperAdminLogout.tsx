'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'

export function SuperAdminLogout() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: '/login' })}
      className="flex items-center gap-1.5 text-gray-300 hover:text-white transition-colors border border-slate-700 hover:border-slate-500 rounded-lg px-3 py-1.5 text-sm"
    >
      <LogOut className="w-3.5 h-3.5" />
      <span>Logout</span>
    </button>
  )
}
