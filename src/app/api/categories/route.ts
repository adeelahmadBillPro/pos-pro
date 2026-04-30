import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { categorySchema } from '@/lib/validations'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { generateSlug } from '@/lib/utils'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const categories = await prisma.category.findMany({
      where: { storeId, deletedAt: null },
      include: {
        _count: { select: { products: { where: { deletedAt: null } } } },
        parent: { select: { id: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json({ success: true, data: categories })
  } catch (error) {
    console.error('[CATEGORIES_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'categories.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    if (!storeId) return NextResponse.json({ success: false, error: 'No store' }, { status: 400 })

    const body = await req.json()
    const data = categorySchema.parse(body)

    // Generate unique slug for this store
    let slug = generateSlug(data.name)
    const existing = await prisma.category.findFirst({
      where: { slug, storeId, deletedAt: null },
    })
    if (existing) {
      slug = `${slug}-${Date.now()}`
    }

    const category = await prisma.category.create({
      data: {
        storeId,
        name: data.name,
        slug,
        parentId: data.parentId || null,
        image: data.image || null,
        sortOrder: data.sortOrder,
      },
      include: {
        parent: { select: { id: true, name: true } },
      },
    })

    await logAudit({
      userId: user.id,
      action: 'CREATE',
      entity: 'Category',
      entityId: category.id,
      newValues: category,
    })

    return NextResponse.json({ success: true, data: category }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[CATEGORIES_POST]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
