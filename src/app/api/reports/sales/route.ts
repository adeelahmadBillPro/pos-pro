import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission } from '@/lib/permissions'
import { startOfDay, endOfDay, eachDayOfInterval, format } from 'date-fns'
import type { UserRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'reports.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const { searchParams } = new URL(req.url)

    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const groupBy = searchParams.get('groupBy') || 'day' // day, week, month

    const fromDate = from ? startOfDay(new Date(from)) : startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    const toDate = to ? endOfDay(new Date(to)) : endOfDay(new Date())

    const where = {
      storeId,
      status: 'COMPLETED' as const,
      createdAt: { gte: fromDate, lte: toDate },
    }

    const [orders, paymentBreakdown, topProducts] = await Promise.all([
      // All orders in range
      prisma.order.findMany({
        where,
        select: {
          id: true,
          total: true,
          subtotal: true,
          taxAmount: true,
          discountAmount: true,
          createdAt: true,
          items: {
            select: { quantity: true, total: true, productId: true, name: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      }),

      // Payment method breakdown
      prisma.payment.groupBy({
        by: ['method'],
        where: {
          order: where,
          status: 'COMPLETED',
        },
        _sum: { amount: true },
        _count: true,
      }),

      // Top products
      prisma.orderItem.groupBy({
        by: ['productId', 'name'],
        where: { order: where },
        _sum: { quantity: true, total: true },
        orderBy: { _sum: { total: 'desc' } },
        take: 10,
      }),
    ])

    // Aggregate by day
    const days = eachDayOfInterval({ start: fromDate, end: toDate })
    const dailyData = days.map((day) => {
      const dayOrders = orders.filter((o) => {
        const d = new Date(o.createdAt)
        return format(d, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
      })

      return {
        date: format(day, 'yyyy-MM-dd'),
        label: format(day, 'dd MMM'),
        revenue: dayOrders.reduce((s, o) => s + o.total, 0),
        orders: dayOrders.length,
        avgOrderValue: dayOrders.length > 0
          ? dayOrders.reduce((s, o) => s + o.total, 0) / dayOrders.length
          : 0,
      }
    })

    const totalRevenue = orders.reduce((s, o) => s + o.total, 0)
    const totalOrders = orders.length
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
    const totalTax = orders.reduce((s, o) => s + o.taxAmount, 0)
    const totalDiscount = orders.reduce((s, o) => s + o.discountAmount, 0)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue,
          totalTax,
          totalDiscount,
        },
        dailyData,
        paymentBreakdown: paymentBreakdown.map((p) => ({
          method: p.method,
          total: p._sum.amount || 0,
          count: p._count,
        })),
        topProducts: topProducts.map((p) => ({
          productId: p.productId,
          name: p.name,
          quantity: p._sum.quantity || 0,
          revenue: p._sum.total || 0,
        })),
        dateRange: {
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
        },
      },
    })
  } catch (error) {
    console.error('[REPORTS_SALES]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
