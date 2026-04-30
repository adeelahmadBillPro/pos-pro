import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { customerSchema } from '@/lib/validations'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string

    const customer = await prisma.customer.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        orders: {
          select: {
            id: true,
            orderNumber: true,
            total: true,
            status: true,
            createdAt: true,
            _count: { select: { items: true } },
            payments: { select: { method: true, amount: true } },
          },
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
        loyaltyTransactions: {
          orderBy: { createdAt: 'desc' },
          take: 50,
        },
      },
    })

    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    console.error('[CUSTOMER_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'customers.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.customer.findFirst({ where: { id, storeId, deletedAt: null } })
    if (!existing) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })

    const body = await req.json()
    const data = customerSchema.parse(body)

    // Check phone uniqueness (excluding current customer)
    if (data.phone) {
      const conflict = await prisma.customer.findFirst({
        where: { phone: data.phone, storeId, deletedAt: null, id: { not: id } },
      })
      if (conflict) {
        return NextResponse.json(
          { success: false, error: 'Another customer has this phone number' },
          { status: 409 }
        )
      }
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
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
      action: 'UPDATE',
      entity: 'Customer',
      entityId: id,
      oldValues: { name: existing.name, phone: existing.phone },
      newValues: { name: customer.name, phone: customer.phone },
    })

    return NextResponse.json({ success: true, data: customer })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[CUSTOMER_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'customers.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const customer = await prisma.customer.findFirst({ where: { id, storeId, deletedAt: null } })
    if (!customer) return NextResponse.json({ success: false, error: 'Customer not found' }, { status: 404 })

    await prisma.customer.update({ where: { id }, data: { deletedAt: new Date() } })

    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entity: 'Customer',
      entityId: id,
      oldValues: { name: customer.name },
    })

    return NextResponse.json({ success: true, message: 'Customer deleted' })
  } catch (error) {
    console.error('[CUSTOMER_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
