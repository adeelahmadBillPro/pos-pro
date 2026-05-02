import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import { hasPermission, type UserRole } from '@/lib/permissions'

const reorderSchema = z.object({
  productIds: z.array(z.string()).min(1),
})

/**
 * Bulk-update sortOrder for products in a single store.
 *
 * Receives an ordered array of productIds; the array's index becomes the
 * product's sortOrder (0 = first in POS grid). Single transaction so partial
 * reorders don't leave the list in a weird half-state.
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'products.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const body = await req.json()
    const { productIds } = reorderSchema.parse(body)

    // Sanity check — every id belongs to this store
    const existing = await prisma.product.findMany({
      where: { id: { in: productIds }, storeId, deletedAt: null },
      select: { id: true },
    })
    const validIds = new Set(existing.map((p) => p.id))
    if (existing.length !== productIds.length) {
      return NextResponse.json(
        { success: false, error: 'One or more products do not belong to your store' },
        { status: 400 },
      )
    }

    await prisma.$transaction(
      productIds.map((id, idx) =>
        prisma.product.update({
          where: { id },
          data: { sortOrder: idx },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 422 },
      )
    }
    console.error('[PRODUCTS_REORDER]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
