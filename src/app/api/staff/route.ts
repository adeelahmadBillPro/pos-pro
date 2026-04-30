import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { staffSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import type { UserRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const staff = await prisma.user.findMany({
      where: { storeId, deletedAt: null, role: { not: 'SUPER_ADMIN' } },
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
          take: 1,
          select: { clockIn: true, clockOut: true },
        },
      },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json({ success: true, data: staff })
  } catch (error) {
    console.error('[STAFF_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'staff.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const data = staffSchema.parse(body)

    // Check email uniqueness
    const existing = await prisma.user.findUnique({ where: { email: data.email } })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Email already in use' },
        { status: 409 }
      )
    }

    const password = data.password || `TempPass${Math.floor(1000 + Math.random() * 9000)}!`
    const hashedPassword = await bcrypt.hash(password, 12)
    const hashedPin = data.pin ? await bcrypt.hash(data.pin, 10) : null

    const newUser = await prisma.user.create({
      data: {
        storeId,
        name: data.name,
        email: data.email,
        phone: data.phone || null,
        password: hashedPassword,
        pin: hashedPin,
        role: data.role as any,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'User',
      entityId: newUser.id,
      newValues: { name: newUser.name, email: newUser.email, role: newUser.role },
    })

    return NextResponse.json(
      { success: true, data: newUser, tempPassword: !data.password ? password : undefined },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[STAFF_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
