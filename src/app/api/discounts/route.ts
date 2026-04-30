import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { discountSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const code = searchParams.get('validateCode') || ''

    // Validate a discount code
    if (code) {
      const total = parseFloat(searchParams.get('total') || '0')
      const discount = await prisma.discount.findFirst({
        where: {
          storeId,
          code: { equals: code, mode: 'insensitive' },
          isActive: true,
          deletedAt: null,
          OR: [{ startDate: null }, { startDate: { lte: new Date() } }],
          AND: [{ OR: [{ endDate: null }, { endDate: { gte: new Date() } }] }],
        },
      })

      if (!discount) {
        return NextResponse.json({ success: false, error: 'Invalid or expired discount code' }, { status: 404 })
      }

      if (discount.maxUses && discount.usedCount >= discount.maxUses) {
        return NextResponse.json({ success: false, error: 'Discount code has reached its usage limit' }, { status: 400 })
      }

      if (discount.minOrderValue && total < discount.minOrderValue) {
        return NextResponse.json(
          { success: false, error: `Minimum order value of ${discount.minOrderValue} required` },
          { status: 400 }
        )
      }

      let amount = 0
      if (discount.type === 'PERCENTAGE') {
        amount = (total * discount.value) / 100
      } else {
        amount = Math.min(discount.value, total)
      }

      return NextResponse.json({ success: true, data: { discount, amount } })
    }

    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [discounts, total] = await Promise.all([
      prisma.discount.findMany({
        where: { storeId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.discount.count({ where: { storeId, deletedAt: null } }),
    ])

    return NextResponse.json({
      success: true,
      data: discounts,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[DISCOUNTS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'discounts.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const data = discountSchema.parse(body)

    // Check code uniqueness if provided
    if (data.code) {
      const existing = await prisma.discount.findFirst({
        where: { code: data.code, storeId, deletedAt: null },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'Discount code already exists' },
          { status: 409 }
        )
      }
    }

    const discount = await prisma.discount.create({
      data: {
        storeId,
        name: data.name,
        code: data.code || null,
        type: data.type as any,
        value: data.value,
        minOrderValue: data.minOrderValue || null,
        maxUses: data.maxUses || null,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
      },
    })

    return NextResponse.json({ success: true, data: discount }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[DISCOUNTS_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
