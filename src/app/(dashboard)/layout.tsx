import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSubscriptionInfo } from '@/lib/subscription'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { TopBar } from '@/components/layout/TopBar'
import { SubscriptionBanner } from '@/components/layout/SubscriptionBanner'

// Pages expired stores can still access
const EXEMPT_PATHS = ['/billing', '/settings']

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params?: unknown
}) {
  const session = await auth()
  if (!session?.user) {
    redirect('/login')
  }

  const storeId = (session.user as any).storeId
  const role = (session.user as any).role

  // Super admin should not access dashboard — redirect to super-admin panel
  if (role === 'SUPER_ADMIN') {
    redirect('/super-admin')
  }

  return (
    <div className="min-h-screen bg-[#f8f7f4] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-50 shadow-sm">
        <Sidebar user={session.user as any} />
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-60 min-w-0">
        {/* Top bar */}
        <TopBar user={session.user as any} />

        {/* Subscription banner */}
        {storeId && <SubscriptionBanner storeId={storeId} />}

        {/* Page content */}
        <main className="flex-1 flex flex-col p-4 md:p-6 pb-20 lg:pb-6 min-w-0 min-h-0">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />
    </div>
  )
}
