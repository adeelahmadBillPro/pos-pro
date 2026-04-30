import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { categorySchema } from '@/lib/validations'
import { hasPermission, type UserRole } from '@/lib/permissions'
import { generateSlug } from '@/lib/utils'
import { logAudit } from '@/lib/audit'

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string

    const category = await prisma.category.findFirst({
      where: { id, storeId, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true } },
        children: { where: { deletedAt: null }, select: { id: true, name: true } },
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    })

    if (!category) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: category })
  } catch (error) {
    console.error('[CATEGORY_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'categories.write')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string

    const existing = await prisma.category.findFirst({
      where: { id, storeId, deletedAt: null },
    })
    if (!existing) {
      return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })
    }

    const body = await req.json()
    const data = categorySchema.parse(body)

    // Prevent self-parenting
    if (data.parentId === id) {
      return NextResponse.json({ success: false, error: 'Category cannot be its own parent' }, { status: 400 })
    }

    // Regenerate slug only if name changed
    let slug = existing.slug
    if (data.name !== existing.name) {
      slug = generateSlug(data.name)
      const slugConflict = await prisma.category.findFirst({
        where: { slug, storeId, deletedAt: null, id: { not: id } },
      })
      if (slugConflict) {
        slug = `${slug}-${Date.now()}`
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: data.name,
        slug,
        parentId: data.parentId || null,
        image: data.image || null,
        sortOrder: data.sortOrder,
      },
      include: {
        parent: { select: { id: true, name: true } },
        _count: { select: { products: { where: { deletedAt: null } } } },
      },
    })

    await logAudit({
      userId: user.id,
      action: 'UPDATE',
      entity: 'Category',
      entityId: id,
      oldValues: existing,
      newValues: updated,
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: error.flatten().fieldErrors },
        { status: 422 }
      )
    }
    console.error('[CATEGORY_PUT]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const user = session.user as any
    if (!hasPermission(user.role as UserRole, 'categories.delete')) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const storeId = user.storeId as string
    const category = await prisma.category.findFirst({
      where: { id, storeId, deletedAt: null },
      include: { _count: { select: { products: { where: { deletedAt: null } } } } },
    })
    if (!category) return NextResponse.json({ success: false, error: 'Category not found' }, { status: 404 })

    if (category._count.products > 0) {
      return NextResponse.json(
        { success: false, error: `Cannot delete: ${category._count.products} products in this category. Reassign them first.` },
        { status: 409 }
      )
    }

    // Move child categories to uncategorized
    await prisma.category.updateMany({
      where: { parentId: id, storeId },
      data: { parentId: null },
    })

    await prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    })

    await logAudit({
      userId: user.id,
      action: 'DELETE',
      entity: 'Category',
      entityId: id,
      oldValues: category,
    })

    return NextResponse.json({ success: true, message: 'Category deleted' })
  } catch (error) {
    console.error('[CATEGORY_DELETE]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
