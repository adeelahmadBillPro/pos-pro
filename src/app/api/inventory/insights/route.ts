import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { hasPermission, type UserRole } from '@/lib/permissions'

/**
 * Inventory Insights API
 *
 * Computes per-product sales velocity over the last 30 days, then categorizes
 * each product into:
 *   - URGENT     — out of stock, OR days-left ≤ 7 at current velocity
 *   - LOW        — days-left between 7 and 14
 *   - HEALTHY    — days-left > 14
 *   - DEAD STOCK — has stock but no sales in last 30 days
 *
 * Returns sections for the morning-briefing dashboard so the owner can act
 * before walking the floor.
 */

const DAYS_WINDOW = 30

export async function GET(_req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    const storeId = user.storeId as string
    const role = user.role as UserRole

    if (!hasPermission(role, 'inventory.read')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    if (!storeId) {
      return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })
    }

    const since = new Date()
    since.setDate(since.getDate() - DAYS_WINDOW)

    // Pull every active product with stock + category
    const products = await prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        isActive: true,
        trackStock: true,
      },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        costPrice: true,
        minStock: true,
        unit: true,
        images: true,
        category: { select: { id: true, name: true } },
        inventory: { select: { quantity: true } },
      },
    })

    // Pull all sold quantities per product in last 30 days from completed orders
    const sold = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          storeId,
          status: 'COMPLETED',
          createdAt: { gte: since },
        },
      },
      _sum: { quantity: true },
    })

    const soldMap = new Map<string, number>()
    sold.forEach((s) => soldMap.set(s.productId, s._sum.quantity ?? 0))

    type Bucket = 'URGENT' | 'LOW' | 'HEALTHY' | 'DEAD' | 'NEW'

    interface InsightProduct {
      id: string
      name: string
      sku: string
      image: string | null
      category: { id: string; name: string } | null
      stock: number
      minStock: number
      unit: string
      price: number
      costPrice: number
      stockValueCost: number
      stockValueRetail: number
      sold30d: number
      avgPerDay: number
      daysLeft: number | null    // null = never sold (no velocity)
      bucket: Bucket
      recommendedOrderQty: number // suggested quantity to reorder
    }

    const enriched: InsightProduct[] = products.map((p) => {
      const stock = p.inventory?.quantity ?? 0
      const sold30 = soldMap.get(p.id) ?? 0
      const avgPerDay = sold30 / DAYS_WINDOW
      const daysLeft = avgPerDay > 0 ? Math.floor(stock / avgPerDay) : null

      let bucket: Bucket
      if (stock <= 0) {
        bucket = 'URGENT'
      } else if (avgPerDay === 0) {
        // Has stock but no sales in 30 days → could be dead OR newly added
        bucket = 'DEAD'
      } else if (daysLeft !== null && daysLeft <= 7) {
        bucket = 'URGENT'
      } else if (daysLeft !== null && daysLeft <= 14) {
        bucket = 'LOW'
      } else {
        bucket = 'HEALTHY'
      }

      // Recommended order qty: enough for next 30 days + safety buffer (min 5)
      const recommended = avgPerDay > 0
        ? Math.max(5, Math.ceil(avgPerDay * 30) - stock)
        : 0

      return {
        id: p.id,
        name: p.name,
        sku: p.sku,
        image: p.images?.[0] ?? null,
        category: p.category,
        stock,
        minStock: p.minStock,
        unit: p.unit,
        price: p.price,
        costPrice: p.costPrice,
        stockValueCost: stock * p.costPrice,
        stockValueRetail: stock * p.price,
        sold30d: sold30,
        avgPerDay: Math.round(avgPerDay * 100) / 100,
        daysLeft,
        bucket,
        recommendedOrderQty: recommended,
      }
    })

    // Group by bucket
    const urgent = enriched
      .filter((p) => p.bucket === 'URGENT')
      .sort((a, b) => (a.daysLeft ?? -1) - (b.daysLeft ?? -1))

    const low = enriched
      .filter((p) => p.bucket === 'LOW')
      .sort((a, b) => (a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))

    const fastMovers = enriched
      .filter((p) => p.avgPerDay > 0)
      .sort((a, b) => b.avgPerDay - a.avgPerDay)
      .slice(0, 10)

    const deadStock = enriched
      .filter((p) => p.bucket === 'DEAD' && p.stock > 0)
      .sort((a, b) => b.stockValueCost - a.stockValueCost)
      .slice(0, 20)

    // Per-category summary
    const categoryMap = new Map<string, { id: string; name: string; sold: number; stockValue: number; products: number }>()
    enriched.forEach((p) => {
      const key = p.category?.id ?? 'uncat'
      const name = p.category?.name ?? 'Uncategorized'
      const existing = categoryMap.get(key)
      if (existing) {
        existing.sold += p.sold30d
        existing.stockValue += p.stockValueCost
        existing.products += 1
      } else {
        categoryMap.set(key, { id: key, name, sold: p.sold30d, stockValue: p.stockValueCost, products: 1 })
      }
    })
    const byCategory = Array.from(categoryMap.values()).sort((a, b) => b.sold - a.sold)

    // Overall summary
    const summary = {
      totalProducts: enriched.length,
      outOfStock: enriched.filter((p) => p.stock <= 0).length,
      urgent: urgent.length,
      low: low.length,
      deadStock: enriched.filter((p) => p.bucket === 'DEAD' && p.stock > 0).length,
      totalValueCost: Math.round(enriched.reduce((s, p) => s + p.stockValueCost, 0)),
      totalValueRetail: Math.round(enriched.reduce((s, p) => s + p.stockValueRetail, 0)),
      potentialProfit: Math.round(
        enriched.reduce((s, p) => s + p.stockValueRetail - p.stockValueCost, 0),
      ),
    }

    return NextResponse.json({
      success: true,
      data: {
        summary,
        urgent,
        low,
        fastMovers,
        deadStock,
        byCategory,
        windowDays: DAYS_WINDOW,
      },
    })
  } catch (error) {
    console.error('[INVENTORY_INSIGHTS]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to load inventory insights' },
      { status: 500 },
    )
  }
}
