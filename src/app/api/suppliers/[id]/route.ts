import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

const supplierUpdateSchema = z.object({
  name: z.string().min(1).max(150),
  phone: z.string().max(30).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  notes: z.string().max(1000).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'suppliers.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const supplier = await prisma.supplier.findFirst({
      where: { id, storeId: user.storeId, deletedAt: null },
      include: {
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: { id: true, poNumber: true, status: true, total: true, createdAt: true },
        },
        _count: { select: { purchaseOrders: true } },
      },
    })
    if (!supplier) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: supplier })
  } catch (error) {
    console.error('[SUPPLIER_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'suppliers.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.supplier.findFirst({ where: { id, storeId: user.storeId, deletedAt: null } })
    if (!existing) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })

    const body = await req.json()
    const data = supplierUpdateSchema.parse(body)

    const updated = await prisma.supplier.update({
      where: { id },
      data: {
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        notes: data.notes || null,
        isActive: data.isActive ?? existing.isActive,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Supplier',
      entityId: id,
      oldValues: { name: existing.name },
      newValues: { name: updated.name },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[SUPPLIER_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'suppliers.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.supplier.findFirst({ where: { id, storeId: user.storeId } })
    if (!existing) return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })

    // Soft delete to keep PO history intact
    await prisma.supplier.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    })

    await logAudit({ userId: user.id, action: 'DELETE', entity: 'Supplier', entityId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[SUPPLIER_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
