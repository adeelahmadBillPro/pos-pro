import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SuperAdminLogout } from '@/components/layout/SuperAdminLogout'

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) redirect('/login')

  const user = session.user as any
  if (user.role !== 'SUPER_ADMIN') redirect('/dashboard')

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-slate-900 text-white px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-violet-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
            SA
          </div>
          <div>
            <p className="font-semibold text-sm">POS SaaS — Super Admin</p>
            <p className="text-xs text-gray-400">{user.email}</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a href="/super-admin" className="text-gray-300 hover:text-white transition-colors hidden md:inline">Dashboard</a>
          <a href="/super-admin/payments" className="text-gray-300 hover:text-white transition-colors hidden md:inline">Payments</a>
          <a href="/super-admin/stores" className="text-gray-300 hover:text-white transition-colors hidden md:inline">Stores</a>
          <a href="/super-admin/bank-accounts" className="text-gray-300 hover:text-white transition-colors hidden md:inline">Bank Accounts</a>
          <SuperAdminLogout />
        </nav>
      </header>

      <main className="p-6 max-w-7xl mx-auto">
        {children}
      </main>
    </div>
  )
}
