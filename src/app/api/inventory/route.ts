import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

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
    const status = searchParams.get('status') || 'all'
    const skip = (page - 1) * limit

    const productWhere: any = { storeId, deletedAt: null, trackStock: true }

    if (search) {
      productWhere.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { barcode: { contains: search, mode: 'insensitive' } },
      ]
    }

    const allItems = await prisma.inventoryItem.findMany({
      where: { product: productWhere, variantId: null },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            minStock: true,
            unit: true,
            price: true,
            costPrice: true,
            category: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { quantity: 'asc' },
    })

    // Apply stock status filter
    let filtered = allItems
    if (status === 'out') {
      filtered = allItems.filter((i) => i.quantity <= 0)
    } else if (status === 'low') {
      filtered = allItems.filter((i) => i.quantity > 0 && i.quantity <= (i.product.minStock || 5))
    } else if (status === 'ok') {
      filtered = allItems.filter((i) => i.quantity > (i.product.minStock || 5))
    }

    const total = filtered.length
    const paginated = filtered.slice(skip, skip + limit)

    // Add stock status label
    const data = paginated.map((item) => ({
      ...item,
      stockStatus:
        item.quantity <= 0
          ? 'out'
          : item.quantity <= (item.product.minStock || 5)
          ? 'low'
          : 'ok',
    }))

    return NextResponse.json({
      success: true,
      data,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('[INVENTORY_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
