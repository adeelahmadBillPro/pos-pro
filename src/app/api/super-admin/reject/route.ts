import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { proofId, reason } = await req.json()
    if (!proofId || !reason) {
      return NextResponse.json({ success: false, error: 'proofId and reason required' }, { status: 400 })
    }

    const proof = await prisma.paymentProof.findUnique({
      where: { id: proofId },
      include: {
        store: {
          select: {
            id: true,
            name: true,
            email: true,
            users: { where: { role: 'OWNER' }, select: { email: true, name: true }, take: 1 },
          },
        },
        plan: { select: { name: true } },
      },
    })

    if (!proof) return NextResponse.json({ success: false, error: 'Proof not found' }, { status: 404 })
    if (proof.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: 'Proof already processed' }, { status: 400 })
    }

    await prisma.paymentProof.update({
      where: { id: proofId },
      data: {
        status: 'REJECTED',
        reviewedById: user.id,
        reviewedAt: new Date(),
        rejectionReason: reason,
      },
    })

    // Notify store owner
    const ownerEmail = proof.store.users[0]?.email || proof.store.email
    if (ownerEmail) {
      await sendEmail({
        to: ownerEmail,
        subject: 'Payment Proof Rejected',
        html: `
          <h2>Payment Proof Rejected</h2>
          <p>Dear ${proof.store.users[0]?.name || proof.store.name},</p>
          <p>Unfortunately, your payment proof has been rejected.</p>
          <p><strong>Reason:</strong> ${reason}</p>
          <p>Please submit a new payment proof or contact support.</p>
          <p><a href="${process.env.NEXTAUTH_URL}/billing/pay">Submit New Proof</a></p>
        `,
      })
    }

    return NextResponse.json({ success: true, data: { message: 'Payment proof rejected' } })
  } catch (error) {
    console.error('[SA_REJECT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
