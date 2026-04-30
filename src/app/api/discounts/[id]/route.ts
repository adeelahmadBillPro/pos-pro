import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { discountSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import type { UserRole } from '@/lib/permissions'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const storeId = (session.user as any).storeId as string

    const discount = await prisma.discount.findFirst({
      where: { id, storeId, deletedAt: null },
    })
    if (!discount) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: discount })
  } catch (error) {
    console.error('[DISCOUNT_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'discounts.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.discount.findFirst({ where: { id, storeId, deletedAt: null } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const data = discountSchema.parse(body)

    if (data.code && data.code !== existing.code) {
      const conflict = await prisma.discount.findFirst({
        where: { code: data.code, storeId, deletedAt: null, id: { not: id } },
      })
      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Discount code already exists' },
          { status: 409 }
        )
      }
    }

    const discount = await prisma.discount.update({
      where: { id },
      data: {
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

    return NextResponse.json({ success: true, data: discount })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[DISCOUNT_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'discounts.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.discount.findFirst({ where: { id, storeId, deletedAt: null } })
    if (!existing) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    await prisma.discount.update({ where: { id }, data: { deletedAt: new Date() } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[DISCOUNT_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
