import { auth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { getSubscriptionInfo } from '@/lib/subscription'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) {
      // Super admin or no store
      return NextResponse.json({
        success: true,
        data: {
          status: 'ACTIVE',
          daysRemaining: 999,
          isExpired: false,
          isTrial: false,
          isActive: true,
          hasPendingProof: false,
          planName: 'Super Admin',
          expiryDate: null,
        },
      })
    }

    const info = await getSubscriptionInfo(storeId)

    return NextResponse.json({ success: true, data: info })
  } catch (error) {
    console.error('[BILLING_STATUS]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
