import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/notifications'
import { addMonths } from 'date-fns'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { proofId, notes } = await req.json()
    if (!proofId) return NextResponse.json({ success: false, error: 'proofId required' }, { status: 400 })

    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: {
        store: { select: { id: true, name: true, email: true, users: { where: { role: 'OWNER' }, select: { email: true, name: true }, take: 1 } } },
        plan: true,
      },
    })

    if (!proof) return NextResponse.json({ success: false, error: 'Proof not found' }, { status: 404 })
    if (proof.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Proof already processed' }, { status: 400 })
    }

    const startDate = new Date()
    const endDate = addMonths(startDate, proof.durationMonths)

    await prisma.$transaction(async (tx) => {
      // Update proof status
      await tx.paymentProof.update({
        where: { id: proofId },
        data: {
          status: 'APPROVED',
          reviewedById: user.id,
          reviewedAt: new Date(),
          notes: notes || null,
        },
      })

      // Create subscription
      await tx.subscription.create({
        data: {
          storeId: proof.storeId,
          planId: proof.planId,
          status: 'ACTIVE',
          startDate,
          endDate,
        },
      })

      // Update store subscription status
      await tx.store.update({
        where: { id: proof.storeId },
        data: { subscriptionStatus: 'ACTIVE' },
      })
    })

    // Notify store owner
    const ownerEmail = proof.store.users[0]?.email || proof.store.email
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: 'Payment Approved — Subscription Activated!',
        html: `
          <h2>Payment Approved! 🎉</h2>
          <p>Dear ${proof.store.users[0]?.name || proof.store.name},</p>
          <p>Your payment of <strong>Rs ${proof.amount}</strong> has been approved.</p>
          <p>Your <strong>${proof.plan.name}</strong> subscription is now active until <strong>${endDate.toLocaleDateString()}</strong>.</p>
          <p>Thank you for using POS SaaS!</p>
        `,
      })
    }

    return NextResponse.json({ success: true, data: { message: 'Payment approved and subscription activated' } })
  } catch (error) {
    console.error('[SA_APPROVE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
