import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { inventoryAdjustSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import type { UserRole } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'inventory.adjust')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string

    const body = await req.json()
    const data = inventoryAdjustSchema.parse(body)

    // Verify product belongs to store
    const product = await prisma.product.findFirst({
      where: { id: data.productId, storeId, deletedAt: null },
    })
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const inventoryItem = await prisma.inventoryItem.findFirst({
      where: {
        productId: data.productId,
        variantId: data.variantId || null,
      },
    })
    if (!inventoryItem) {
      return NextResponse.json({ success: false, error: 'Inventory item not found' }, { status: 404 })
    }

    let newQty = inventoryItem.quantity
    if (data.type === 'ADD') {
      newQty = inventoryItem.quantity + data.quantity
    } else if (data.type === 'SUBTRACT') {
      newQty = Math.max(0, inventoryItem.quantity - data.quantity)
    } else if (data.type === 'SET') {
      newQty = data.quantity
    }

    await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { quantity: newQty },
      })

      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: 'ADJUSTMENT',
          quantity: newQty - inventoryItem.quantity,
          previousQty: inventoryItem.quantity,
          newQty,
          notes: data.notes,
          createdById: user.id,
        },
      })
    })

    await logAudit({
      userId: user.id,
      action: 'ADJUST',
      entity: 'Inventory',
      entityId: inventoryItem.id,
      oldValues: { quantity: inventoryItem.quantity },
      newValues: { quantity: newQty, type: data.type, notes: data.notes },
    })

    return NextResponse.json({
      success: true,
      data: { previousQty: inventoryItem.quantity, newQty, type: data.type },
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[INVENTORY_ADJUST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
