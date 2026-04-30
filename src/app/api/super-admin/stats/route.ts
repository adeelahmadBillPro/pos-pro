import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { startOfMonth, endOfMonth } from 'date-fns'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)

    const [
      totalStores,
      activeStores,
      trialStores,
      totalUsers,
      pendingPayments,
      monthlyRevenue,
      allProofs,
    ] = await Promise.all([
      prisma.store.count({ where: { deletedAt: null } }),
      prisma.store.count({ where: { subscriptionStatus: 'ACTIVE', deletedAt: null } }),
      prisma.store.count({ where: { subscriptionStatus: 'TRIAL', deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.paymentProof.count({ where: { status: 'PENDING' } }),
      prisma.paymentProof.aggregate({
        where: {
          status: 'APPROVED',
          reviewedAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.paymentProof.aggregate({
        where: { status: 'APPROVED' },
        _sum: { amount: true },
      }),
    ])

    return NextResponse.json({
      success: true,
      data: {
        totalStores,
        activeStores,
        trialStores,
        expiredStores: totalStores - activeStores - trialStores,
        totalUsers,
        pendingPayments,
        monthlyRevenue: monthlyRevenue._sum.amount || 0,
        totalRevenue: allProofs._sum.amount || 0,
      },
    })
  } catch (error) {
    console.error('[SA_STATS]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
