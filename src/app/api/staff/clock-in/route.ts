import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const body = await req.json()
    const { openingCash = 0, notes } = body

    // Check if already clocked in (no clock-out)
    const activeShift = await prisma.staffShift.findFirst({
      where: { userId: user.id, clockOut: null },
    })

    if (activeShift) {
      return NextResponse.json(
        { success: false, error: 'You are already clocked in. Please clock out first.' },
        { status: 400 }
      )
    }

    const shift = await prisma.staffShift.create({
      data: {
        userId: user.id,
        openingCash: parseFloat(openingCash) || 0,
        notes: notes || null,
      },
    })

    return NextResponse.json({ success: true, data: shift }, { status: 201 })
  } catch (error) {
    console.error('[CLOCK_IN]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
