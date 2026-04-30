import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { PageHeader } from '@/components/shared/PageHeader'

export default async function SuperAdminStoresPage() {
  const session = await auth()
  if (!session?.user || (session.user as any).role !== 'SUPER_ADMIN') {
    redirect('/dashboard')
  }

  const stores = await prisma.store.findMany({
    where: { deletedAt: null },
    include: {
      users: { where: { role: 'OWNER', isActive: true }, take: 1 },
      _count: { select: { users: true, orders: true } },
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
        include: { plan: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="All Stores" description={`${stores.length} stores registered`} />
      <div className="mt-6 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3 text-left">Store</th>
              <th className="px-4 py-3 text-left">Owner</th>
              <th className="px-4 py-3 text-left">City</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Plan</th>
              <th className="px-4 py-3 text-left">Expires</th>
              <th className="px-4 py-3 text-right">Users</th>
              <th className="px-4 py-3 text-right">Orders</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stores.map((store) => {
              const owner = store.users[0]
              const sub = store.subscriptions[0]
              return (
                <tr key={store.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{store.name}</div>
                    <div className="text-xs text-gray-400">{store.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    {owner ? (
                      <div>
                        <div className="font-medium">{owner.name}</div>
                        <div className="text-xs text-gray-400">{owner.email}</div>
                      </div>
                    ) : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{store.city ?? '—'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={store.subscriptionStatus.toLowerCase()} />
                  </td>
                  <td className="px-4 py-3">{sub?.plan?.name ?? 'Trial'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {sub?.endDate ? formatDate(sub.endDate) : store.trialEndsAt ? formatDate(store.trialEndsAt) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">{store._count.users}</td>
                  <td className="px-4 py-3 text-right">{store._count.orders}</td>
                </tr>
              )
            })}
            {stores.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">No stores found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
