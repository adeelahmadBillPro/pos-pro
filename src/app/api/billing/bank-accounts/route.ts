import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const accounts = await prisma.bankAccount.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      select: {
        id: true,
        bankName: true,
        accountTitle: true,
        iban: true,
        branchCode: true,
      },
    })

    return NextResponse.json({ success: true, data: accounts })
  } catch (error) {
    console.error('[BANK_ACCOUNTS]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
