import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { productSchema } from '@/lib/validations'
import { hasPermission } from '@/lib/permissions'
import { logAudit } from '@/lib/audit'
import type { UserRole } from '@/lib/permissions'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string

    const product = await prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        inventory: {
          select: { id: true, quantity: true, reserved: true },
        },
      },
    })

    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    console.error('[PRODUCT_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'products.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string

    const existing = await prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = productSchema.parse(body)

    // Check for duplicate SKU (excluding this product)
    const skuConflict = await prisma.product.findFirst({
      where: { sku: data.sku, storeId, deletedAt: null, id: { not: id } },
    })
    if (skuConflict) {
      return NextResponse.json(
        { success: false, error: 'Another product has this SKU' },
        { status: 409 }
      )
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
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

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Product',
      entityId: id,
      oldValues: { name: existing.name, price: existing.price },
      newValues: { name: product.name, price: product.price },
    })

    return NextResponse.json({ success: true, data: product })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[PRODUCT_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'products.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string

    const product = await prisma.product.findFirst({
      where: { id, storeId, deletedAt: null },
    })
    if (!product) {
      return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 })
    }

    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entity: 'Product',
      entityId: id,
      oldValues: { name: product.name },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[PRODUCT_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
