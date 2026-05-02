import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

/** Returns the current user's active shift (if any) — used by POS to enforce
 *  the "clock in before selling" rule. */
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Owners and managers don't need to clock in to use POS — they oversee the store
    const role = (session.user as any).role
    if (role === 'OWNER' || role === 'MANAGER' || role === 'SUPER_ADMIN') {
      return NextResponse.json({
        success: true,
        data: { needsAttendance: false, activeShift: null },
      })
    }

    const activeShift = await prisma.staffShift.findFirst({
      where: { userId, clockOut: null },
      orderBy: { clockIn: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: {
        needsAttendance: !activeShift,
        activeShift,
      },
    })
  } catch (error) {
    console.error('[MY_SHIFT_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
