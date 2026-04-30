import { prisma } from '@/lib/prisma'
import { getDaysRemaining } from '@/lib/utils'

export type SubscriptionInfo = {
  status: string
  daysRemaining: number
  isExpired: boolean
  isTrial: boolean
  isActive: boolean
  hasPendingProof: boolean
  planName: string | null
  expiryDate: Date | null
}

export async function getSubscriptionInfo(storeId: string): Promise<SubscriptionInfo> {
  const store = await prisma.store.findUnique({
    where: { id: storeId },
    include: {
      subscriptions: {
        where: { status: 'ACTIVE' },
        orderBy: { endDate: 'desc' },
        take: 1,
        include: { plan: true },
      },
      paymentProofs: {
        where: { status: 'PENDING' },
        take: 1,
      },
    },
  })

  if (!store) {
    return {
      status: 'EXPIRED',
      daysRemaining: 0,
      isExpired: true,
      isTrial: false,
      isActive: false,
      hasPendingProof: false,
      planName: null,
      expiryDate: null,
    }
  }

  const hasPendingProof = store.paymentProofs.length > 0
  const activeSubscription = store.subscriptions[0]
  const isTrial = store.subscriptionStatus === 'TRIAL'
  const isActive = store.subscriptionStatus === 'ACTIVE'
  const isExpired = store.subscriptionStatus === 'EXPIRED'

  let daysRemaining = 0
  let expiryDate: Date | null = null

  if (isTrial && store.trialEndsAt) {
    daysRemaining = getDaysRemaining(store.trialEndsAt)
    expiryDate = store.trialEndsAt
  } else if (activeSubscription) {
    daysRemaining = getDaysRemaining(activeSubscription.endDate)
    expiryDate = activeSubscription.endDate
  }

  return {
    status: store.subscriptionStatus,
    daysRemaining,
    isExpired: isExpired || (isTrial && daysRemaining === 0),
    isTrial,
    isActive,
    hasPendingProof,
    planName: activeSubscription?.plan?.name ?? (isTrial ? 'Trial' : null),
    expiryDate,
  }
}
