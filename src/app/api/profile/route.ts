import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import bcrypt from 'bcryptjs'
import { logAudit } from '@/lib/audit'

const profileUpdateSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email'),
  phone: z.string().optional().or(z.literal('')),
  avatar: z.string().optional().or(z.literal('')),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
})

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        avatar: true,
        createdAt: true,
        store: { select: { name: true } },
      },
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error('[PROFILE_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const existing = await prisma.user.findUnique({ where: { id: userId } })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = profileUpdateSchema.parse(body)

    // If changing email, ensure not taken
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
      avatar: data.avatar || null,
    }

    // Password change — require current password
    if (data.newPassword) {
      if (!data.currentPassword) {
        return NextResponse.json({ success: false, error: 'Current password required' }, { status: 400 })
      }
      const valid = await bcrypt.compare(data.currentPassword, existing.password)
      if (!valid) {
        return NextResponse.json({ success: false, error: 'Current password is incorrect' }, { status: 400 })
      }
      updateData.password = await bcrypt.hash(data.newPassword, 12)
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
    })

    await logAudit({
      userId,
      action: 'UPDATE',
      entity: 'User',
      entityId: userId,
      oldValues: { name: existing.name, email: existing.email },
      newValues: { name: updated.name, email: updated.email },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[PROFILE_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
