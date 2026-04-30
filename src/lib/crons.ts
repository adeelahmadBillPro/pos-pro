import cron from 'node-cron'
import { prisma } from '@/lib/prisma'
import { notifyExpiryWarning } from '@/lib/notifications'
import { formatDate } from '@/lib/utils'

async function checkExpiringSubscriptions() {
  const stores = await prisma.store.findMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      deletedAt: null,
    },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
        include: { plan: true },
      },
      users: {
        where: { role: 'OWNER', isActive: true },
        take: 1,
      },
    },
  })

  for (const store of stores) {
    const sub = store.subscriptions[0]
    if (!sub) continue

    const daysLeft = Math.ceil(
      (sub.endDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    const owner = store.users[0]
    if (!owner) continue

    if (daysLeft === 3 || daysLeft === 1) {
      await notifyExpiryWarning({
        ownerEmail: owner.email,
        ownerPhone: owner.phone ?? undefined,
        storeName: store.name,
        daysLeft,
      })
    }
  }
}

async function markExpiredSubscriptions() {
  await prisma.store.updateMany({
    where: {
      subscriptionStatus: 'ACTIVE',
      subscriptions: {
        none: {
          status: 'ACTIVE',
          endDate: { gte: new Date() },
        },
      },
    },
    data: { subscriptionStatus: 'EXPIRED' },
  })
}

async function expireTrialAccounts() {
  await prisma.store.updateMany({
    where: {
      subscriptionStatus: 'TRIAL',
      trialEndsAt: { lt: new Date() },
    },
    data: { subscriptionStatus: 'EXPIRED' },
  })
}

async function sendLowStockAlerts() {
  const stores = await prisma.store.findMany({
    where: { subscriptionStatus: { in: ['ACTIVE', 'TRIAL'] }, deletedAt: null },
    include: {
      products: {
        where: { isActive: true, trackStock: true, deletedAt: null },
        include: { inventory: true },
      },
      users: {
        where: { role: 'OWNER', isActive: true },
        take: 1,
      },
    },
  })

  for (const store of stores) {
    const lowStock = store.products.filter(
      p => p.inventory && p.inventory.quantity <= p.minStock
    )
    if (lowStock.length === 0) continue

    const owner = store.users[0]
    if (!owner) continue

    const productList = lowStock
      .map(p => `• ${p.name}: ${p.inventory?.quantity ?? 0} remaining`)
      .join('\n')

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const msg = `*Low Stock Alert*\n${lowStock.length} products ka stock kam hai:\n${productList}\n\nInventory check karein:\n${appUrl}/inventory`

    const { sendWhatsApp, sendEmail } = await import('@/lib/notifications')
    await Promise.all([
      sendEmail({ to: owner.email, subject: `Low Stock Alert - ${store.name}`, html: `<pre>${msg}</pre>` }),
      owner.phone ? sendWhatsApp(owner.phone, msg) : Promise.resolve(),
    ])
  }
}

let cronStarted = false

export function startCronJobs() {
  if (cronStarted) return
  cronStarted = true

  // Every day at 9 AM: check expiring subscriptions
  cron.schedule('0 9 * * *', () => checkExpiringSubscriptions().catch(console.error))

  // Every day at 10 AM: low stock alerts
  cron.schedule('0 10 * * *', () => sendLowStockAlerts().catch(console.error))

  // Every midnight: expire trial accounts
  cron.schedule('0 0 * * *', () => expireTrialAccounts().catch(console.error))

  // Every hour: mark expired subscriptions
  cron.schedule('0 * * * *', () => markExpiredSubscriptions().catch(console.error))

  console.log('✅ Cron jobs started')
}
