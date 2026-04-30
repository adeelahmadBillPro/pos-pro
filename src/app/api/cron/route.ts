import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notifyExpiryWarning } from '@/lib/notifications'

// Simple cron endpoint — call via external cron service or Vercel Cron
// GET /api/cron?secret=CRON_SECRET
export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET && process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: string[] = []

  try {
    // 1. Check expiring subscriptions
    const stores = await prisma.store.findMany({
      where: { subscriptionStatus: 'ACTIVE', deletedAt: null },
      include: {
        subscriptions: {
          where: { status: 'ACTIVE' },
          orderBy: { endDate: 'desc' },
          take: 1,
          include: { plan: true },
        },
        users: { where: { role: 'OWNER', isActive: true }, take: 1 },
      },
    })

    for (const store of stores) {
      const sub = store.subscriptions[0]
      if (!sub) continue
      const daysLeft = Math.ceil((sub.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      const owner = store.users[0]
      if (!owner) continue

      if (daysLeft === 3 || daysLeft === 1) {
        await notifyExpiryWarning({
          ownerEmail: owner.email,
          ownerPhone: owner.phone ?? undefined,
          storeName: store.name,
          daysLeft,
        })
        results.push(`Expiry warning sent: ${store.name} (${daysLeft}d left)`)
      }

      // Mark expired
      if (sub.endDate < new Date()) {
        await prisma.store.update({
          where: { id: store.id },
          data: { subscriptionStatus: 'EXPIRED' },
        })
        await prisma.subscription.update({
          where: { id: sub.id },
          data: { status: 'EXPIRED' },
        })
        results.push(`Marked expired: ${store.name}`)
      }
    }

    // 2. Check low stock — trackStock and minStock are on Product
    const lowStockProducts = await prisma.product.findMany({
      where: {
        trackStock: true,
        deletedAt: null,
        inventory: { isNot: null },
      },
      include: { inventory: true },
    })

    const lowStockCount = lowStockProducts.filter(
      (p) => p.inventory && p.inventory.quantity <= p.minStock
    ).length

    if (lowStockCount > 0) {
      results.push(`Low stock products: ${lowStockCount}`)
    }

  } catch (error) {
    console.error('[CRON]', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }

  return NextResponse.json({ success: true, results, timestamp: new Date().toISOString() })
}
