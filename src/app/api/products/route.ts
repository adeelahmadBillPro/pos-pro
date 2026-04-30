import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { productSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import type { UserRole } from '@/lib/permissions'

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
    const categoryId = searchParams.get('categoryId') || ''
    const status = searchParams.get('status') || ''
    const pos = searchParams.get('pos') === '1'
    const skip = (page - 1) * limit

    const where: any = { storeId, deletedAt: null }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }
    if (categoryId) where.categoryId = categoryId
    if (status === 'active') where.isActive = true
    if (status === 'inactive') where.isActive = false

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
          inventory: {
            select: { quantity: true, id: true },
          },
        },
        orderBy: { name: 'asc' },
        skip: pos ? 0 : skip,
        take: pos ? 200 : limit,
      }),
      pos ? 0 : prisma.product.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: products,
      pagination: pos ? undefined : {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('[PRODUCTS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'products.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const body = await req.json()
    const data = productSchema.parse(body)

    // Check for duplicate SKU
    const existing = await prisma.product.findFirst({
      where: { sku: data.sku, storeId, deletedAt: null },
    })
    if (existing) {
      return NextResponse.json(
        { success: false, error: 'A product with this SKU already exists' },
        { status: 409 }
      )
    }

    const product = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: {
          storeId,
          name: data.name,
          sku: data.sku,
          barcode: data.barcode || null,
          price: data.price,
          costPrice: data.costPrice,
          categoryId: data.categoryId || null,
          description: data.description || null,
          taxable: data.taxable,
          trackStock: data.trackStock,
          minStock: data.minStock,
          unit: data.unit,
          images: data.images,
        },
      })

      // Create inventory item
      await tx.inventoryItem.create({
        data: {
          productId: newProduct.id,
          quantity: 0,
        },
      })

      return newProduct
    })

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'Product',
      entityId: product.id,
      newValues: { name: product.name, sku: product.sku },
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[PRODUCTS_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
