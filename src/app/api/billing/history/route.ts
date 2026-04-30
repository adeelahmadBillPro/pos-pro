import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const proofs = await prisma.paymentProof.findMany({
      where: { storeId },
      include: {
        plan: {
          select: { name: true },
        },
        reviewedBy: {
          select: { name: true },
        },
      },
      orderBy: { submittedAt: 'desc' },
      take: 50,
    })

    const data = proofs.map((p) => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      createdAt: p.submittedAt,
      plan: p.plan,
      durationMonths: p.durationMonths,
      reviewedAt: p.reviewedAt,
      bankName: p.bankName,
      transactionId: p.transactionId,
      rejectionReason: p.rejectionReason,
      screenshotUrl: p.screenshotUrl,
    }))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('[BILLING_HISTORY]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
