import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'SENT', 'CANCELLED']),
  notes: z.string().max(2000).optional(),
})

export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, storeId: user.storeId, deletedAt: null },
      include: {
        supplier: true,
        createdBy: { select: { id: true, name: true, email: true } },
        receivedBy: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true, images: true, unit: true } } } },
      },
    })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: po })
  } catch (error) {
    console.error('[PO_GET_ID]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.purchaseOrder.findFirst({
      where: { id, storeId: user.storeId, deletedAt: null },
    })
    if (!existing) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })

    if (existing.status === 'RECEIVED' || existing.status === 'PARTIAL') {
      return NextResponse.json(
        { success: false, error: 'Cannot edit a received PO' },
        { status: 400 },
      )
    }

    const body = await req.json()
    const data = updateStatusSchema.parse(body)

    const updated = await prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: data.status,
        notes: data.notes ?? existing.notes,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: id,
      oldValues: { status: existing.status },
      newValues: { status: updated.status },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[PO_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const existing = await prisma.purchaseOrder.findFirst({ where: { id, storeId: user.storeId } })
    if (!existing) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })

    if (existing.status === 'RECEIVED' || existing.status === 'PARTIAL') {
      return NextResponse.json(
        { success: false, error: 'Cannot delete a received PO. Mark CANCELLED instead via edit.' },
        { status: 400 },
      )
    }

    await prisma.purchaseOrder.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    })

    await logAudit({ userId: user.id, action: 'DELETE', entity: 'PurchaseOrder', entityId: id })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PO_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
