import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { customerSchema } from '@/lib/validations'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const group = searchParams.get('group') || ''
    const skip = (page - 1) * limit

    const where: any = { storeId, deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (group) where.customerGroup = group

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: customers,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[CUSTOMERS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    if (!hasPermission(user.role as UserRole, 'customers.write') && !hasPermission(user.role as UserRole, 'customers.create')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await req.json()
    const data = customerSchema.parse(body)

    // Check phone uniqueness if provided
    if (data.phone) {
      const existing = await prisma.customer.findFirst({
        where: { phone: data.phone, storeId, deletedAt: null },
      })
      if (existing) {
        return NextResponse.json(
          { success: false, error: 'A customer with this phone number already exists' },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.create({
      data: {
        storeId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        notes: data.notes || null,
        customerGroup: data.customerGroup,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'Customer',
      entityId: customer.id,
      newValues: { name: customer.name, phone: customer.phone },
    })

    return NextResponse.json({ success: true, data: customer }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[CUSTOMERS_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
