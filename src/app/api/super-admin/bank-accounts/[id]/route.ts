import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bankAccountUpdateSchema = z.object({
  bankName: z.string().min(1).optional(),
  accountTitle: z.string().min(1).optional(),
  iban: z.string().min(1).optional(),
  branchCode: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
})

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await props.params
    const body = await req.json()
    const data = bankAccountUpdateSchema.parse(body)

    const account = await prisma.bankAccount.update({
      where: { id },
      data,
    })

    return NextResponse.json({ success: true, data: account })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[BANK_ACCOUNT_UPDATE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await props.params

    await prisma.bankAccount.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[BANK_ACCOUNT_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
