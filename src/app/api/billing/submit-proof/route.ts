import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { paymentProofSchema } from '@/lib/validations'
import { sendEmail } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const body = await req.json()
    const data = paymentProofSchema.parse(body)

    // Check if already has pending proof
    const pendingProof = await prisma.paymentProof.findFirst({
      where: { storeId, status: 'PENDING' },
    })
    if (pendingProof) {
      return NextResponse.json(
        { success: false, error: 'You already have a pending payment proof' },
        { status: 400 }
      )
    }

    const plan = await prisma.plan.findUnique({ where: { id: data.planId } })
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Invalid plan' }, { status: 404 })
    }

    const proof = await prisma.paymentProof.create({
      data: {
        storeId,
        planId: data.planId,
        amount: data.amount,
        durationMonths: data.durationMonths,
        transactionId: data.transactionId || null,
        bankName: data.bankName,
        senderName: data.senderName,
        senderPhone: data.senderPhone || null,
        screenshotUrl: data.screenshotUrl,
        notes: data.notes || null,
        status: 'PENDING',
      },
    })

    // Notify super admins
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' },
      select: { email: true, name: true },
    })

    const store = await prisma.store.findUnique({ where: { id: storeId } })

    for (const admin of admins) {
      await sendEmail({
        to: admin.email,
        subject: 'New Payment Proof Submitted',
        html: `
          <h2>New Payment Proof</h2>
          <p>Store: <strong>${store?.name}</strong></p>
          <p>Plan: <strong>${plan.name}</strong></p>
          <p>Amount: <strong>Rs ${data.amount}</strong></p>
          <p>Duration: <strong>${data.durationMonths} month(s)</strong></p>
          <p>Bank: ${data.bankName}</p>
          <p>Sender: ${data.senderName} (${data.senderPhone || 'N/A'})</p>
          <p>Transaction ID: ${data.transactionId || 'N/A'}</p>
          <p><a href="${process.env.NEXTAUTH_URL}/super-admin/payments">Review Now</a></p>
        `,
      })
    }

    return NextResponse.json({ success: true, data: proof }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[SUBMIT_PROOF]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
