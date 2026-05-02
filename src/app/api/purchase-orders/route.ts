import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'

const createPOSchema = z.object({
  supplierId: z.string().min(1, 'Supplier required'),
  expectedAt: z.string().optional(),
  notes: z.string().max(2000).optional(),
  items: z.array(z.object({
    productId: z.string(),
    quantityOrdered: z.number().int().min(1),
    unitCost: z.number().min(0),
  })).min(1, 'At least one item required'),
  status: z.enum(['DRAFT', 'SENT']).default('DRAFT'),
})

function generatePoNumber() {
  const date = new Date()
  const yymmdd = `${date.getFullYear().toString().slice(-2)}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `PO-${yymmdd}-${rand}`
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') ?? ''
    const supplierId = searchParams.get('supplierId') ?? ''
    const search = searchParams.get('search') ?? ''

    const where: any = { storeId, deletedAt: null }
    if (status) where.status = status
    if (supplierId) where.supplierId = supplierId
    if (search) {
      where.OR = [
        { poNumber: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const orders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        supplier: { select: { id: true, name: true } },
        createdBy: { select: { id: true, name: true } },
        _count: { select: { items: true } },
      },
    })

    return NextResponse.json({ success: true, data: orders })
  } catch (error) {
    console.error('[PO_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'purchase_orders.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const data = createPOSchema.parse(body)

    // Validate supplier belongs to this store
    const supplier = await prisma.supplier.findFirst({
      where: { id: data.supplierId, storeId, deletedAt: null },
    })
    if (!supplier) {
      return NextResponse.json({ success: false, error: 'Supplier not found' }, { status: 404 })
    }

    // Pull product details for snapshots
    const productIds = data.items.map((i) => i.productId)
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId, deletedAt: null },
      select: { id: true, name: true, sku: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))

    // Validate every product
    for (const item of data.items) {
      if (!productMap.has(item.productId)) {
        return NextResponse.json(
          { success: false, error: `Product not found: ${item.productId}` },
          { status: 404 },
        )
      }
    }

    const itemsData = data.items.map((item) => {
      const prod = productMap.get(item.productId)!
      const lineTotal = item.quantityOrdered * item.unitCost
      return {
        productId: item.productId,
        productName: prod.name,
        sku: prod.sku,
        quantityOrdered: item.quantityOrdered,
        unitCost: item.unitCost,
        total: lineTotal,
      }
    })

    const subtotal = itemsData.reduce((s, i) => s + i.total, 0)

    const po = await prisma.purchaseOrder.create({
      data: {
        poNumber: generatePoNumber(),
        storeId,
        supplierId: data.supplierId,
        status: data.status,
        subtotal,
        taxAmount: 0,
        total: subtotal,
        notes: data.notes || null,
        expectedAt: data.expectedAt ? new Date(data.expectedAt) : null,
        createdById: user.id,
        items: { create: itemsData },
      },
      include: {
        supplier: { select: { name: true } },
        items: true,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: po.id,
      newValues: { poNumber: po.poNumber, supplier: supplier.name, total: subtotal },
    })

    return NextResponse.json({ success: true, data: po }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 },
      )
    }
    console.error('[PO_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
