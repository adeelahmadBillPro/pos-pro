import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { startOfDay, endOfDay, subDays, format } from 'date-fns'

// n8n calls this endpoint with ?apiKey=... — no session needed
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const apiKey = searchParams.get('apiKey')
    const storeId = searchParams.get('storeId') // optional: specific store

    // Validate API key
    if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const todayStart = startOfDay(today)
    const todayEnd = endOfDay(today)
    const yesterdayStart = startOfDay(subDays(today, 1))
    const yesterdayEnd = endOfDay(subDays(today, 1))

    // If storeId provided, only that store — else all active stores
    const storeWhere = storeId
      ? { id: storeId }
      : { subscription: { status: 'ACTIVE' } }

    const stores = await prisma.store.findMany({
      where: storeWhere as any,
      select: {
        id: true,
        name: true,
        phone: true,
        email: true,
        currency: true,
        users: {
          where: { role: 'OWNER', isActive: true },
          select: { name: true, email: true, phone: true },
          take: 1,
        },
      },
    })

    const summaries = await Promise.all(
      stores.map(async (store) => {
        const orderWhere = {
          storeId: store.id,
          status: 'COMPLETED' as const,
        }

        const [todayOrders, yesterdayOrders, lowStockProducts, topProducts] = await Promise.all([
          // Today's orders
          prisma.order.findMany({
            where: { ...orderWhere, createdAt: { gte: todayStart, lte: todayEnd } },
            select: { total: true, subtotal: true, discountAmount: true, taxAmount: true },
          }),

          // Yesterday's orders (for comparison)
          prisma.order.findMany({
            where: { ...orderWhere, createdAt: { gte: yesterdayStart, lte: yesterdayEnd } },
            select: { total: true },
          }),

          // Low stock items — fetch tracked products and filter in JS
          prisma.product.findMany({
            where: {
              storeId: store.id,
              trackStock: true,
              isActive: true,
              deletedAt: null,
            },
            select: { name: true, minStock: true, inventory: { select: { quantity: true } } },
          }).then((products) =>
            products
              .filter((p) => (p.inventory?.quantity ?? 0) <= p.minStock)
              .slice(0, 5)
          ),

          // Top 5 products today by revenue
          prisma.orderItem.groupBy({
            by: ['name'],
            where: {
              order: { ...orderWhere, createdAt: { gte: todayStart, lte: todayEnd } },
            },
            _sum: { quantity: true, total: true },
            orderBy: { _sum: { total: 'desc' } },
            take: 5,
          }),
        ])

        const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0)
        const todayOrderCount = todayOrders.length
        const todayDiscount = todayOrders.reduce((s, o) => s + o.discountAmount, 0)
        const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + o.total, 0)

        const revenueChange = yesterdayRevenue > 0
          ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
          : null

        // Format low stock
        const lowStockItems = lowStockProducts.map((p: any) => ({
          name: p.name,
          quantity: p.inventory?.quantity ?? 0,
          minStock: p.minStock,
        }))

        // Format top products
        const topItems = topProducts.map((p) => ({
          name: p.name,
          quantity: p._sum.quantity ?? 0,
          revenue: p._sum.total ?? 0,
        }))

        const owner = store.users[0]

        return {
          storeId: store.id,
          storeName: store.name,
          currency: store.currency,
          ownerName: owner?.name || store.name,
          ownerEmail: owner?.email || store.email,
          ownerPhone: owner?.phone || store.phone,
          date: format(today, 'dd MMM yyyy'),
          today: {
            revenue: todayRevenue,
            orders: todayOrderCount,
            avgOrderValue: todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0,
            discount: todayDiscount,
            revenueChange, // % vs yesterday, null if no yesterday data
          },
          yesterday: {
            revenue: yesterdayRevenue,
            orders: yesterdayOrders.length,
          },
          lowStock: lowStockItems,
          topProducts: topItems,
          // Pre-formatted message (ready to send via WhatsApp/email)
          whatsappMessage: formatWhatsAppMessage({
            storeName: store.name,
            date: format(today, 'dd MMM yyyy'),
            revenue: todayRevenue,
            orders: todayOrderCount,
            avgOrderValue: todayOrderCount > 0 ? Math.round(todayRevenue / todayOrderCount) : 0,
            revenueChange,
            topItems,
            lowStockItems,
            currency: store.currency,
          }),
        }
      })
    )

    return NextResponse.json({
      success: true,
      generatedAt: new Date().toISOString(),
      stores: summaries,
    })
  } catch (error) {
    console.error('[N8N_DAILY_SUMMARY]', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

function formatWhatsAppMessage({
  storeName, date, revenue, orders, avgOrderValue,
  revenueChange, topItems, lowStockItems, currency,
}: {
  storeName: string
  date: string
  revenue: number
  orders: number
  avgOrderValue: number
  revenueChange: number | null
  topItems: { name: string; quantity: number; revenue: number }[]
  lowStockItems: { name: string; quantity: number; minStock: number }[]
  currency: string
}) {
  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`
  const changeText = revenueChange !== null
    ? ` (${revenueChange >= 0 ? '▲' : '▼'} ${Math.abs(revenueChange)}% vs kal)`
    : ''

  let msg = `📊 *${storeName} — Daily Report*\n`
  msg += `📅 ${date}\n\n`

  msg += `💰 *Aaj ki Sales*\n`
  msg += `Revenue: *${fmt(revenue)}*${changeText}\n`
  msg += `Orders: *${orders}*\n`
  msg += `Avg Order: *${fmt(avgOrderValue)}*\n\n`

  if (topItems.length > 0) {
    msg += `🏆 *Top Products*\n`
    topItems.slice(0, 5).forEach((p, i) => {
      msg += `${i + 1}. ${p.name} — ${p.quantity} sold (${fmt(p.revenue)})\n`
    })
    msg += '\n'
  }

  if (lowStockItems.length > 0) {
    msg += `⚠️ *Low Stock Alert*\n`
    lowStockItems.forEach((p) => {
      msg += `• ${p.name}: *${p.quantity}* left (min: ${p.minStock})\n`
    })
    msg += '\n'
  }

  if (orders === 0) {
    msg += `😴 Aaj koi sale nahi hui.\n`
  }

  msg += `\n_POS Pro — Automated Report_`
  return msg
}
