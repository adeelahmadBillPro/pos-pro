import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatCard } from '@/components/dashboard/StatCard'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Package,
  Lightbulb,
} from 'lucide-react'
import Link from 'next/link'
import { startOfDay, endOfDay } from 'date-fns'
import { getWelcomeMessage, getIndustryTip } from '@/lib/storeTypes'

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const storeId = (session.user as any).storeId as string
  if (!storeId) redirect('/super-admin')

  // Fetch store metadata for personalized greeting + industry tips
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    select: { name: true, storeType: true },
  })
  const storeType = store?.storeType ?? 'GENERAL'
  const welcomeMsg = getWelcomeMessage(storeType, session.user.name ?? undefined)
  const tip = getIndustryTip(storeType)

  const todayStart = startOfDay(new Date())
  const todayEnd = endOfDay(new Date())

  const [todaySales, todayOrders, totalCustomers, lowStockItems, recentOrders] =
    await Promise.all([
      // Today's total sales
      prisma.order.aggregate({
        where: {
          storeId,
          status: 'COMPLETED',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { total: true },
      }),
      // Today's order count
      prisma.order.count({
        where: {
          storeId,
          status: 'COMPLETED',
          createdAt: { gte: todayStart, lte: todayEnd },
        },
      }),
      // Total customers
      prisma.customer.count({
        where: { storeId, deletedAt: null },
      }),
      // Low stock items
      prisma.inventoryItem.findMany({
        where: {
          product: {
            storeId,
            deletedAt: null,
            trackStock: true,
          },
          quantity: { lte: prisma.inventoryItem.fields.quantity },
        },
        include: {
          product: { select: { name: true, sku: true, minStock: true } },
        },
        take: 10,
        orderBy: { quantity: 'asc' },
      }),
      // Recent orders
      prisma.order.findMany({
        where: { storeId },
        include: {
          customer: { select: { name: true } },
          cashier: { select: { name: true } },
          items: { select: { id: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ])

  // Get actual low stock (where qty <= minStock)
  const allInventory = await prisma.inventoryItem.findMany({
    where: {
      product: {
        storeId,
        deletedAt: null,
        trackStock: true,
      },
    },
    include: {
      product: { select: { name: true, sku: true, minStock: true } },
    },
    orderBy: { quantity: 'asc' },
    take: 20,
  })

  const lowStock = allInventory.filter(
    (item) => item.quantity <= (item.product.minStock ?? 5)
  ).slice(0, 8)

  const statusColors: Record<string, string> = {
    COMPLETED: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    CANCELLED: 'bg-red-100 text-red-700',
    REFUNDED: 'bg-purple-100 text-purple-700',
    PROCESSING: 'bg-violet-100 text-violet-700',
  }

  return (
    <div className="space-y-6">
      {/* ── Personalized welcome banner ── */}
      <div className="rounded-2xl bg-gradient-to-r from-amber-100 via-amber-50 to-teal-50 border border-amber-200 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-slide-up">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{welcomeMsg}</h2>
          {store?.name && (
            <p className="text-xs text-slate-500 mt-0.5">{store.name}</p>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs sm:text-sm text-amber-800 bg-white/70 backdrop-blur rounded-xl px-3 py-2 border border-amber-200">
          <Lightbulb className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
          <span className="leading-snug">{tip.replace(/^💡\s*/, '')}</span>
        </div>
      </div>

      {/* Stats — animated count-up + gradient cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Today's Sales"
          value={Number(todaySales._sum.total ?? 0)}
          iconName="trendingUp"
          variant="emerald"
          prefix="Rs "
          decimals={0}
          delay={0}
        />
        <StatCard
          title="Today's Orders"
          value={todayOrders}
          iconName="shoppingBag"
          variant="violet"
          delay={80}
        />
        <StatCard
          title="Total Customers"
          value={totalCustomers}
          iconName="users"
          variant="teal"
          delay={160}
        />
        <StatCard
          title="Low Stock Items"
          value={lowStock.length}
          iconName="alertTriangle"
          variant="rose"
          delay={240}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Orders</CardTitle>
                <Link href="/orders" className="text-sm text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {recentOrders.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  No orders yet. Start selling from POS Terminal.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500">Order</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden sm:table-cell">Customer</th>
                        <th className="text-left px-4 py-2.5 text-xs font-medium text-gray-500 hidden md:table-cell">Items</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Total</th>
                        <th className="text-right px-4 py-2.5 text-xs font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {recentOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <Link href={`/orders/${order.id}`} className="font-medium text-violet-600 hover:text-violet-700">
                              {order.orderNumber}
                            </Link>
                            <p className="text-xs text-gray-400 mt-0.5">{formatDateTime(order.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell text-gray-600">
                            {order.customer?.name || 'Walk-in'}
                          </td>
                          <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-900">
                            {formatCurrency(order.total)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Low Stock Alert */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Low Stock Alert</CardTitle>
                <Link href="/inventory" className="text-sm text-violet-600 hover:text-violet-700">
                  View all
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {lowStock.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500 text-sm">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  All stock levels are healthy
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {lowStock.map((item) => (
                    <div key={item.id} className="px-4 py-3 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {item.product.name}
                        </p>
                        <p className="text-xs text-gray-400">{item.product.sku}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${item.quantity === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                          {item.quantity}
                        </p>
                        <p className="text-xs text-gray-400">Min: {item.product.minStock}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
