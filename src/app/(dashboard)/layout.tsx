import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getSubscriptionInfo } from '@/lib/subscription'
import { Sidebar } from '@/components/layout/Sidebar'
import { MobileNav } from '@/components/layout/MobileNav'
import { TopBar } from '@/components/layout/TopBar'
import { SubscriptionBanner } from '@/components/layout/SubscriptionBanner'
import { SubscriptionLockOverlay } from '@/components/layout/SubscriptionLockOverlay'

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

  // Check subscription status for the lock overlay
  const subscriptionInfo = storeId ? await getSubscriptionInfo(storeId) : null

  return (
    <div className="h-[100dvh] bg-[#f8f7f4] flex overflow-hidden">
      {/* Desktop Sidebar — fixed, never scrolls with page */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 lg:fixed lg:inset-y-0 lg:z-50 shadow-sm">
        <Sidebar user={session.user as any} />
      </aside>

      {/* Main content column — bounded to viewport */}
      <div className="flex flex-col flex-1 lg:pl-60 min-w-0 h-full">
        {/* Top bar — never scrolls */}
        <TopBar user={session.user as any} />

        {/* Subscription banner — never scrolls */}
        {storeId && <SubscriptionBanner storeId={storeId} />}

        {/* Page content — pages scroll within this main, sidebar+topbar stay put */}
        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6 min-w-0 min-h-0 page-enter">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* Subscription lock overlay — blocks all routes except billing when expired */}
      {subscriptionInfo?.isExpired && (
        <SubscriptionLockOverlay
          status={subscriptionInfo.status}
          hasPendingProof={subscriptionInfo.hasPendingProof}
        />
      )}
    </div>
  )
}
