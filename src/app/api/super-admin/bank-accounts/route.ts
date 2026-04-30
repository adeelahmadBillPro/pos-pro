import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const bankAccountSchema = z.object({
  bankName: z.string().min(1, 'Bank name is required'),
  accountTitle: z.string().min(1, 'Account title is required'),
  iban: z.string().min(1, 'IBAN is required'),
  branchCode: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().int().default(0),
})

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const accounts = await prisma.bankAccount.findMany({
      orderBy: { sortOrder: 'asc' },
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    console.error('[BANK_ACCOUNTS_LIST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    if ((session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = bankAccountSchema.parse(body)

    const account = await prisma.bankAccount.create({ data })

    return NextResponse.json({ success: true, data: account }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[BANK_ACCOUNT_CREATE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
