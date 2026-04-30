import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { staffSchema } from '@/lib/validations'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string

    const staffMember = await prisma.user.findFirst({
      where: { id, storeId, deletedAt: null, role: { not: 'SUPER_ADMIN' } },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        avatar: true,
        createdAt: true,
        shifts: {
          orderBy: { clockIn: 'desc' },
          take: 10,
          select: { id: true, clockIn: true, clockOut: true, openingCash: true, closingCash: true, totalSales: true, totalOrders: true },
        },
      },
    })

    if (!staffMember) return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: staffMember })
  } catch (error) {
    console.error('[STAFF_GET_ID]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.user.findFirst({
      where: { id, storeId, deletedAt: null, role: { not: 'SUPER_ADMIN' } },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 })

    const body = await req.json()
    const data = staffSchema.parse(body)

    // Check email uniqueness if changed
    if (data.email !== existing.email) {
      const conflict = await prisma.user.findUnique({ where: { email: data.email } })
      if (conflict) {
        return NextResponse.json({ success: false, error: 'Email already in use' }, { status: 409 })
      }
    }

    const updateData: any = {
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      role: data.role as any,
    }

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 12)
    }
    if (data.pin) {
      updateData.pin = await bcrypt.hash(data.pin, 10)
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'User',
      entityId: id,
      oldValues: { name: existing.name, role: existing.role },
      newValues: { name: updated.name, role: updated.role },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[STAFF_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Cannot deactivate yourself
    if (id === user.id) {
      return NextResponse.json({ success: false, error: 'Cannot deactivate your own account' }, { status: 400 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.user.findFirst({
      where: { id, storeId, role: { not: 'SUPER_ADMIN' } },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 })

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    })

    await logAudit({
      userId: user.id,
      action: 'DEACTIVATE',
      entity: 'User',
      entityId: id,
      oldValues: { isActive: existing.isActive },
      newValues: { isActive: false },
    })

    return NextResponse.json({ success: true, message: 'Staff member deactivated' })
  } catch (error) {
    console.error('[STAFF_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const existing = await prisma.user.findFirst({
      where: { id, storeId, deletedAt: null, role: { not: 'SUPER_ADMIN' } },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'Staff member not found' }, { status: 404 })

    const body = await req.json()
    const updated = await prisma.user.update({
      where: { id },
      data: { isActive: body.isActive },
      select: { id: true, isActive: true },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('[STAFF_PATCH]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
