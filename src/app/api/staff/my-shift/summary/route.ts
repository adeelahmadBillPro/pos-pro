import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/** Live shift summary for the cashier's currently active shift.
 *  Used by the End-of-Day modal to show expected closing cash + variance. */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const storeId = (session.user as any).storeId as string | undefined

    const activeShift = await prisma.staffShift.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    })

    if (!activeShift) {
      return NextResponse.json({ success: true, data: null })
    }

    // Aggregate cash sales since clock-in
    const orders = await prisma.order.findMany({
      where: {
        cashierId: userId,
        storeId,
        status: 'COMPLETED',
        createdAt: { gte: activeShift.clockIn },
      },
      include: {
        payments: {
          select: { method: true, amount: true },
        },
      },
    })

    let cashSales = 0
    let cardSales = 0
    let jazzCashSales = 0
    let easyPaisaSales = 0
    let otherSales = 0
    let totalSales = 0

    orders.forEach((order) => {
      totalSales += order.total
      order.payments.forEach((p) => {
        if (p.method === 'CASH') cashSales += p.amount
        else if (p.method === 'CARD') cardSales += p.amount
        else if (p.method === 'JAZZCASH') jazzCashSales += p.amount
        else if (p.method === 'EASYPAISA') easyPaisaSales += p.amount
        else otherSales += p.amount
      })
    })

    // Refunds processed during the shift — reduce cash drawer
    const refunds = await prisma.return.findMany({
      where: {
        processedById: userId,
        createdAt: { gte: activeShift.clockIn },
      },
      select: { refundAmount: true, refundMethod: true },
    })

    const cashRefunds = refunds
      .filter((r) => r.refundMethod === 'CASH')
      .reduce((s, r) => s + r.refundAmount, 0)

    const expectedCash = activeShift.openingCash + cashSales - cashRefunds

    return NextResponse.json({
      success: true,
      data: {
        shiftId: activeShift.id,
        clockIn: activeShift.clockIn,
        openingCash: activeShift.openingCash,
        totalOrders: orders.length,
        totalSales,
        cashSales,
        cardSales,
        jazzCashSales,
        easyPaisaSales,
        otherSales,
        cashRefunds,
        expectedCash,
      },
    })
  } catch (error) {
    console.error('[MY_SHIFT_SUMMARY]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
