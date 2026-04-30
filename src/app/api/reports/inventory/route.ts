import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, type UserRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'reports.view')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: { lowStockThreshold: true },
    })
    const threshold = store?.lowStockThreshold ?? 10

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { product: { storeId, deletedAt: null, trackStock: true }, variantId: null },
      include: {
        product: {
          select: { id: true, name: true, sku: true, price: true, costPrice: true, minStock: true, category: { select: { name: true } } },
        },
      },
    })

    const outOfStock = inventoryItems.filter((i) => i.quantity <= 0)
    const lowStock = inventoryItems.filter((i) => i.quantity > 0 && i.quantity <= (i.product.minStock || threshold))
    const inStock = inventoryItems.filter((i) => i.quantity > (i.product.minStock || threshold))

    const totalStockValue = inventoryItems.reduce((sum, i) => sum + i.quantity * i.product.costPrice, 0)
    const totalRetailValue = inventoryItems.reduce((sum, i) => sum + i.quantity * i.product.price, 0)
    const totalUnits = inventoryItems.reduce((sum, i) => sum + i.quantity, 0)

    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalProducts: inventoryItems.length,
          inStockCount: inStock.length,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
          totalStockValue,
          totalRetailValue,
          totalUnits,
        },
        lowStockItems: lowStock.map((i) => ({
          id: i.id,
          productId: i.product.id,
          name: i.product.name,
          sku: i.product.sku,
          category: i.product.category?.name,
          quantity: i.quantity,
          minStock: i.product.minStock,
        })),
        outOfStockItems: outOfStock.map((i) => ({
          id: i.id,
          productId: i.product.id,
          name: i.product.name,
          sku: i.product.sku,
          category: i.product.category?.name,
          quantity: i.quantity,
          minStock: i.product.minStock,
        })),
      },
    })
  } catch (error) {
    console.error('[REPORTS_INVENTORY]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
