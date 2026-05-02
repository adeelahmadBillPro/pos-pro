import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

/**
 * Receive endpoint — owner/manager marks items as received from supplier.
 *
 * - Accepts an array of { itemId, quantityReceived } updates
 * - Increments inventory by the received quantity
 * - Logs a StockMovement (PURCHASE) per item
 * - Updates PO status: RECEIVED if all items fully received, else PARTIAL
 */

const receiveSchema = z.object({
  items: z.array(z.object({
    itemId: z.string(),
    quantityReceived: z.number().int().min(0),
  })).min(1),
  notes: z.string().max(2000).optional(),
})

export async function POST(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.receive')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const data = receiveSchema.parse(body)

    const po = await prisma.purchaseOrder.findFirst({
      where: { id, storeId, deletedAt: null },
      include: { items: true },
    })
    if (!po) return NextResponse.json({ success: false, error: 'PO not found' }, { status: 404 })

    if (po.status === 'CANCELLED') {
      return NextResponse.json({ success: false, error: 'Cannot receive a cancelled PO' }, { status: 400 })
    }

    if (po.status === 'RECEIVED') {
      return NextResponse.json({ success: false, error: 'PO is already fully received' }, { status: 400 })
    }

    // Validate that received quantity ≤ remaining quantity per item
    const itemMap = new Map(po.items.map((i) => [i.id, i]))
    for (const r of data.items) {
      const item = itemMap.get(r.itemId)
      if (!item) {
        return NextResponse.json({ success: false, error: `Item ${r.itemId} not in this PO` }, { status: 400 })
      }
      const remaining = item.quantityOrdered - item.quantityReceived
      if (r.quantityReceived > remaining) {
        return NextResponse.json(
          { success: false, error: `Cannot receive more than ordered. ${item.productName}: ${remaining} remaining.` },
          { status: 400 },
        )
      }
    }

    // Process all updates in one transaction
    const updatedPO = await prisma.$transaction(async (tx) => {
      for (const r of data.items) {
        if (r.quantityReceived <= 0) continue
        const item = itemMap.get(r.itemId)!
        const newReceivedTotal = item.quantityReceived + r.quantityReceived

        // Update PO item
        await tx.purchaseOrderItem.update({
          where: { id: r.itemId },
          data: { quantityReceived: newReceivedTotal },
        })

        // Find or create inventory item, then increment stock
        const existingInv = await tx.inventoryItem.findFirst({
          where: { productId: item.productId },
        })

        let inventoryItemId: string
        let previousQty: number
        if (existingInv) {
          inventoryItemId = existingInv.id
          previousQty = existingInv.quantity
          await tx.inventoryItem.update({
            where: { id: existingInv.id },
            data: { quantity: { increment: r.quantityReceived } },
          })
        } else {
          const created = await tx.inventoryItem.create({
            data: { productId: item.productId, quantity: r.quantityReceived },
          })
          inventoryItemId = created.id
          previousQty = 0
        }

        // Log stock movement
        await tx.stockMovement.create({
          data: {
            inventoryItemId,
            type: 'PURCHASE',
            quantity: r.quantityReceived,
            previousQty,
            newQty: previousQty + r.quantityReceived,
            reference: po.poNumber,
            notes: `Received from PO ${po.poNumber}`,
            createdById: user.id,
          },
        })
      }

      // Re-read items to determine new status
      const refreshed = await tx.purchaseOrderItem.findMany({
        where: { purchaseOrderId: po.id },
      })
      const allReceived = refreshed.every((i) => i.quantityReceived >= i.quantityOrdered)
      const someReceived = refreshed.some((i) => i.quantityReceived > 0)

      const newStatus = allReceived ? 'RECEIVED' : someReceived ? 'PARTIAL' : po.status

      return tx.purchaseOrder.update({
        where: { id: po.id },
        data: {
          status: newStatus,
          receivedAt: allReceived ? new Date() : po.receivedAt,
          receivedById: allReceived ? user.id : po.receivedById,
          notes: data.notes ?? po.notes,
        },
        include: { items: true, supplier: true },
      })
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: po.id,
      oldValues: { status: po.status },
      newValues: { status: updatedPO.status, action: 'received items' },
    })

    return NextResponse.json({ success: true, data: updatedPO })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[PO_RECEIVE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
