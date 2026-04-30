import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('code')
    const total = parseFloat(searchParams.get('total') || '0')

    if (!code) {
      return NextResponse.json({ success: false, error: 'Code is required' }, { status: 400 })
    }

    const now = new Date()

    const discount = await prisma.discount.findFirst({
      where: {
        storeId,
        code: { equals: code, mode: 'insensitive' },
        isActive: true,
        deletedAt: null,
        OR: [{ startDate: null }, { startDate: { lte: now } }],
        AND: [
          { OR: [{ endDate: null }, { endDate: { gte: now } }] },
        ],
      },
    })

    if (!discount) {
      return NextResponse.json({ success: false, error: 'Invalid or expired discount code' }, { status: 404 })
    }

    // Check usage limit
    if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
      return NextResponse.json({ success: false, error: 'Discount code usage limit reached' }, { status: 400 })
    }

    // Check minimum order amount
    if (discount.minOrderValue && total < discount.minOrderValue) {
      return NextResponse.json(
        {
          success: false,
          error: `Minimum order amount of Rs ${discount.minOrderValue} required`,
        },
        { status: 400 }
      )
    }

    // Calculate discount amount
    let discountAmount = 0
    if (discount.type === 'PERCENTAGE') {
      discountAmount = (total * discount.value) / 100
    } else {
      discountAmount = Math.min(discount.value, total)
    }

    return NextResponse.json({
      success: true,
      data: {
        id: discount.id,
        code: discount.code,
        name: discount.name,
        type: discount.type,
        value: discount.value,
        discountAmount: parseFloat(discountAmount.toFixed(2)),
      },
    })
  } catch (error) {
    console.error('[DISCOUNT_VALIDATE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
