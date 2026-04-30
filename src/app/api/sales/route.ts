import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { orderSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import { generateOrderNumber } from '@/lib/utils'
import type { UserRole } from '@/lib/permissions'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'orders.create') && !hasPermission(user.role as UserRole, 'orders.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store associated' }, { status: 400 })

    const body = await req.json()
    const data = orderSchema.parse(body)

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        taxRate: true,
        taxEnabled: true,
        allowNegativeStock: true,
        currency: true,
      },
    })

    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 })

    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = generateOrderNumber()

      // Process each item
      let subtotal = 0
      let totalTax = 0
      const processedItems: Array<{
        productId: string
        variantId?: string
        name: string
        sku: string
        quantity: number
        unitPrice: number
        costPrice: number
        discount: number
        taxAmount: number
        total: number
        inventoryItemId: string
        currentStock: number
      }> = []

      for (const item of data.items) {
        const product = await tx.product.findFirst({
          where: { id: item.productId, storeId, deletedAt: null },
          include: {
            inventory: true,
          },
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        const inventoryItem = product.inventory
        if (!inventoryItem) {
          throw new Error(`Inventory not found for product ${product.name}`)
        }

        if (product.trackStock && !store.allowNegativeStock) {
          if (inventoryItem.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${product.name}. Available: ${inventoryItem.quantity}`)
          }
        }

        const lineSubtotal = item.unitPrice * item.quantity
        const lineDiscount = (lineSubtotal * item.discount) / 100
        const lineAfterDiscount = lineSubtotal - lineDiscount
        const lineTax = store.taxEnabled && product.taxable
          ? (lineAfterDiscount * store.taxRate) / 100
          : 0
        const lineTotal = lineAfterDiscount + lineTax

        subtotal += lineSubtotal - lineDiscount
        totalTax += lineTax

        processedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          name: product.name,
          sku: product.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: product.costPrice,
          discount: item.discount,
          taxAmount: lineTax,
          total: lineTotal,
          inventoryItemId: inventoryItem.id,
          currentStock: inventoryItem.quantity,
        })
      }

      // Apply discount code
      let discountAmount = 0
      if (data.discountCode) {
        const discount = await tx.discount.findFirst({
          where: {
            storeId,
            code: data.discountCode,
            isActive: true,
            deletedAt: null,
            OR: [
              { startDate: null },
              { startDate: { lte: new Date() } },
            ],
            AND: [
              {
                OR: [
                  { endDate: null },
                  { endDate: { gte: new Date() } },
                ],
              },
            ],
          },
        })

        if (discount) {
          if (!discount.maxUses || discount.usedCount < discount.maxUses) {
            if (!discount.minOrderValue || subtotal >= discount.minOrderValue) {
              if (discount.type === 'PERCENTAGE') {
                discountAmount = (subtotal * discount.value) / 100
              } else {
                discountAmount = Math.min(discount.value, subtotal)
              }
              await tx.discount.update({
                where: { id: discount.id },
                data: { usedCount: { increment: 1 } },
              })
            }
          }
        }
      }

      // Apply loyalty points
      let loyaltyDiscount = 0
      if (data.loyaltyPointsUsed > 0 && data.customerId) {
        const customer = await tx.customer.findFirst({
          where: { id: data.customerId, storeId },
        })
        if (customer && customer.loyaltyPoints >= data.loyaltyPointsUsed) {
          loyaltyDiscount = data.loyaltyPointsUsed * 0.01 // 1 point = Rs 0.01
        }
      }

      const totalDiscount = discountAmount + loyaltyDiscount
      const grandTotal = Math.max(0, subtotal - totalDiscount + totalTax)

      // Validate total payments
      const totalPaid = data.payments.reduce((s, p) => s + p.amount, 0)
      if (Math.abs(totalPaid - grandTotal) > 1) {
        // Allow small rounding difference
        if (totalPaid < grandTotal - 1) {
          throw new Error(`Insufficient payment. Required: ${grandTotal.toFixed(2)}, Paid: ${totalPaid.toFixed(2)}`)
        }
      }

      const cashPayment = data.payments.find((p) => p.method === 'CASH')
      const change = cashPayment && totalPaid > grandTotal ? totalPaid - grandTotal : 0

      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          storeId,
          customerId: data.customerId || null,
          cashierId: user.id,
          status: 'COMPLETED',
          subtotal,
          discountAmount: totalDiscount,
          discountCode: data.discountCode || null,
          taxAmount: totalTax,
          total: grandTotal,
          notes: data.notes || null,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId || null,
              name: item.name,
              sku: item.sku,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPrice: item.costPrice,
              discount: item.discount,
              taxAmount: item.taxAmount,
              total: item.total,
            })),
          },
          payments: {
            create: data.payments.map((p) => ({
              method: p.method as any,
              amount: p.amount,
              change: p.method === 'CASH' ? change : 0,
              reference: p.reference || null,
              status: 'COMPLETED',
            })),
          },
        },
        include: {
          items: true,
          payments: true,
          customer: { select: { id: true, name: true, phone: true } },
          cashier: { select: { id: true, name: true } },
        },
      })

      // Deduct inventory & create stock movements
      for (const item of processedItems) {
        await tx.inventoryItem.update({
          where: { id: item.inventoryItemId },
          data: { quantity: { decrement: item.quantity } },
        })

        await tx.stockMovement.create({
          data: {
            inventoryItemId: item.inventoryItemId,
            type: 'SALE',
            quantity: -item.quantity,
            previousQty: item.currentStock,
            newQty: item.currentStock - item.quantity,
            reference: orderNumber,
            notes: `Sale: ${orderNumber}`,
            createdById: user.id,
          },
        })
      }

      // Update customer stats & loyalty
      if (data.customerId) {
        const earnedPoints = Math.floor(grandTotal / 100)

        await tx.customer.update({
          where: { id: data.customerId },
          data: {
            totalSpent: { increment: grandTotal },
            totalOrders: { increment: 1 },
            loyaltyPoints: {
              increment: earnedPoints - (data.loyaltyPointsUsed || 0),
            },
          },
        })

        if (earnedPoints > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: data.customerId,
              points: earnedPoints,
              type: 'EARNED',
              orderId: newOrder.id,
              notes: `Earned from order ${orderNumber}`,
            },
          })
        }

        if (data.loyaltyPointsUsed > 0) {
          await tx.loyaltyTransaction.create({
            data: {
              customerId: data.customerId,
              points: -data.loyaltyPointsUsed,
              type: 'REDEEMED',
              orderId: newOrder.id,
              notes: `Redeemed for order ${orderNumber}`,
            },
          })
        }
      }

      return newOrder
    })

    await logAudit({
      userId: (session.user as any).id,
      action: 'CREATE',
      entity: 'Order',
      entityId: order.id,
      newValues: { orderNumber: order.orderNumber, total: order.total },
    })

    return NextResponse.json({ success: true, data: order }, { status: 201 })
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
    console.error('[SALES_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

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
    const status = searchParams.get('status') || ''
    const from = searchParams.get('from') || ''
    const to = searchParams.get('to') || ''
    const skip = (page - 1) * limit

    const where: any = { storeId }

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customer: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }
    if (status) where.status = status
    if (from || to) {
      where.createdAt = {}
      if (from) where.createdAt.gte = new Date(from)
      if (to) where.createdAt.lte = new Date(to)
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true } },
          cashier: { select: { id: true, name: true } },
          items: { select: { id: true, quantity: true } },
          payments: { select: { method: true, amount: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[SALES_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
