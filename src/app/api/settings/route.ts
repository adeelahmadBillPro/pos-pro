import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { settingsSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import type { UserRole } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const store = await prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        phone: true,
        email: true,
        logo: true,
        currency: true,
        taxRate: true,
        taxName: true,
        taxEnabled: true,
        requireCustomer: true,
        allowNegativeStock: true,
        autoApplyTax: true,
        lowStockThreshold: true,
        receiptHeader: true,
        receiptFooter: true,
        receiptShowLogo: true,
        subscriptionStatus: true,
        trialEndsAt: true,
      },
    })

    if (!store) return NextResponse.json({ success: false, error: 'Store not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: store })
  } catch (error) {
    console.error('[SETTINGS_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'settings.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const body = await req.json()
    const data = settingsSchema.parse(body)

    const store = await prisma.store.update({
      where: { id: storeId },
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        city: data.city || null,
        currency: data.currency,
        taxRate: data.taxRate,
        taxName: data.taxName,
        taxEnabled: data.taxEnabled,
        requireCustomer: data.requireCustomer,
        allowNegativeStock: data.allowNegativeStock,
        autoApplyTax: data.autoApplyTax,
        lowStockThreshold: data.lowStockThreshold,
        receiptHeader: data.receiptHeader || null,
        receiptFooter: data.receiptFooter || null,
        receiptShowLogo: data.receiptShowLogo ?? true,
        logo: data.logo || null,
      },
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Store',
      entityId: storeId,
      newValues: { name: data.name },
    })

    return NextResponse.json({ success: true, data: store })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[SETTINGS_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
