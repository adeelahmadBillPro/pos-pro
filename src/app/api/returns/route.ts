import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { returnSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { generateReturnNumber } from '@/lib/utils'
import type { UserRole } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'returns.process')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const data = returnSchema.parse(body)

    // Get the original order
    const order = await prisma.order.findFirst({
      where: { id: data.orderId, storeId },
      include: {
        items: {
          include: {
            returnItems: true,
          },
        },
      },
    })

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
    if (order.status === 'CANCELLED' || order.status === 'REFUNDED') {
      return NextResponse.json({ success: false, error: 'Cannot return this order' }, { status: 400 })
    }

    // Validate return items
    let refundAmount = 0
    const returnItems: Array<{
      orderItemId: string
      quantity: number
      refundAmount: number
      inventoryItemId: string
      previousQty: number
    }> = []

    for (const ri of data.items) {
      const orderItem = order.items.find((i) => i.id === ri.orderItemId)
      if (!orderItem) {
        return NextResponse.json(
          { success: false, error: `Order item ${ri.orderItemId} not found` },
          { status: 400 }
        )
      }

      // Check already returned quantity
      const alreadyReturned = orderItem.returnItems.reduce((s: number, ri: any) => s + ri.quantity, 0)
      const availableToReturn = orderItem.quantity - alreadyReturned

      if (ri.quantity > availableToReturn) {
        return NextResponse.json(
          { success: false, error: `Cannot return more than ${availableToReturn} units of ${orderItem.name}` },
          { status: 400 }
        )
      }

      const unitPrice = orderItem.total / orderItem.quantity
      const itemRefund = unitPrice * ri.quantity
      refundAmount += itemRefund

      // Get inventory item
      const invItem = await prisma.inventoryItem.findFirst({
        where: { productId: orderItem.productId, variantId: orderItem.variantId || null },
      })

      returnItems.push({
        orderItemId: ri.orderItemId,
        quantity: ri.quantity,
        refundAmount: itemRefund,
        inventoryItemId: invItem?.id || '',
        previousQty: invItem?.quantity || 0,
      })
    }

    const returnRecord = await prisma.$transaction(async (tx) => {
      const returnNumber = generateReturnNumber()

      const newReturn = await tx.return.create({
        data: {
          returnNumber,
          orderId: data.orderId,
          processedById: user.id,
          reason: data.reason,
          notes: data.notes || null,
          refundAmount,
          refundMethod: data.refundMethod,
          status: 'COMPLETED',
          items: {
            create: returnItems.map((ri) => ({
              orderItemId: ri.orderItemId,
              quantity: ri.quantity,
              refundAmount: ri.refundAmount,
            })),
          },
        },
        include: { items: true },
      })

      // Restore inventory
      for (const ri of returnItems) {
        if (ri.inventoryItemId) {
          await tx.inventoryItem.update({
            where: { id: ri.inventoryItemId },
            data: { quantity: { increment: ri.quantity } },
          })

          await tx.stockMovement.create({
            data: {
              inventoryItemId: ri.inventoryItemId,
              type: 'RETURN',
              quantity: ri.quantity,
              previousQty: ri.previousQty,
              newQty: ri.previousQty + ri.quantity,
              reference: returnNumber,
              notes: `Return: ${returnNumber}`,
              createdById: user.id,
            },
          })
        }
      }

      // Update order status if fully returned
      const allReturnItems = await tx.returnItem.findMany({
        where: { return: { orderId: data.orderId } },
      })

      const totalReturnedByItem = new Map<string, number>()
      for (const ri of allReturnItems) {
        totalReturnedByItem.set(
          ri.orderItemId,
          (totalReturnedByItem.get(ri.orderItemId) || 0) + ri.quantity
        )
      }

      const fullyReturned = order.items.every((item: any) => {
        const returned = totalReturnedByItem.get(item.id) || 0
        return returned >= item.quantity
      })

      if (fullyReturned) {
        await tx.order.update({
          where: { id: data.orderId },
          data: { status: 'REFUNDED' },
        })
      }

      // Update customer loyalty if store credit refund
      if (data.refundMethod === 'STORE_CREDIT' && order.customerId) {
        const creditPoints = Math.floor(refundAmount)
        await tx.customer.update({
          where: { id: order.customerId },
          data: { loyaltyPoints: { increment: creditPoints } },
        })
        await tx.loyaltyTransaction.create({
          data: {
            customerId: order.customerId,
            points: creditPoints,
            type: 'RETURN_CREDIT',
            orderId: data.orderId,
            notes: `Return credit: ${returnNumber}`,
          },
        })
      }

      return newReturn
    })

    await logAudit({
      userId: user.id,
      action: 'RETURN',
      entity: 'Order',
      entityId: data.orderId,
      newValues: { returnId: returnRecord.id, refundAmount },
    })

    return NextResponse.json({ success: true, data: returnRecord }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    if (error instanceof Error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 })
    }
    console.error('[RETURNS_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    const [returns, total] = await Promise.all([
      prisma.return.findMany({
        where: { order: { storeId } },
        include: {
          order: { select: { id: true, orderNumber: true, total: true } },
          processedBy: { select: { name: true } },
          items: {
            include: {
              orderItem: { select: { name: true, quantity: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.return.count({ where: { order: { storeId } } }),
    ])

    return NextResponse.json({
      success: true,
      data: returns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[RETURNS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
