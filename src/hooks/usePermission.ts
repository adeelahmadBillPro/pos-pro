'use client'
import { useSession } from 'next-auth/react'
import { hasPermission, getMaxDiscount, type UserRole } from '@/lib/permissions'

export function usePermission() {
  const { data: session } = useSession()
  const role = (session?.user as any)?.role as UserRole | undefined

  return {
    role,
    can: (permission: string) => role ? hasPermission(role, permission) : false,
    maxDiscount: role ? getMaxDiscount(role) : 0,
    isOwner: role === 'OWNER',
    isManager: role === 'MANAGER',
    isCashier: role === 'CASHIER',
    isSuperAdmin: role === 'SUPER_ADMIN',
  }
}
