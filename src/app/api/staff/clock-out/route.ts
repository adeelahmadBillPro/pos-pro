import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const body = await req.json()
    const { closingCash, notes } = body

    // Find active shift
    const activeShift = await prisma.staffShift.findFirst({
      where: { userId: user.id, clockOut: null },
    })

    if (!activeShift) {
      return NextResponse.json(
        { success: false, error: 'No active shift found. Please clock in first.' },
        { status: 400 }
      )
    }

    // Calculate shift stats
    const shiftOrders = await prisma.order.aggregate({
      where: {
        cashierId: user.id,
        createdAt: { gte: activeShift.clockIn },
        status: 'COMPLETED',
      },
      _sum: { total: true },
      _count: true,
    })

    const shift = await prisma.staffShift.update({
      where: { id: activeShift.id },
      data: {
        clockOut: new Date(),
        closingCash: closingCash ? parseFloat(closingCash) : null,
        totalSales: shiftOrders._sum.total || 0,
        totalOrders: shiftOrders._count,
        notes: notes || activeShift.notes,
      },
    })

    return NextResponse.json({ success: true, data: shift })
  } catch (error) {
    console.error('[CLOCK_OUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
