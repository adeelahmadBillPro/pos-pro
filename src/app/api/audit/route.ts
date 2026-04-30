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
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get('page') || '1')
    const limit = 50
    const skip = (page - 1) * limit
    const entity = searchParams.get('entity') || ''
    const action = searchParams.get('action') || ''
    const userId = searchParams.get('userId') || ''

    const where: any = {
      user: { storeId },
    }
    if (entity) where.entity = entity
    if (action) where.action = action
    if (userId) where.userId = userId

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ])

    // Get distinct entity types for filter
    const entities = await prisma.auditLog.findMany({
      where: { user: { storeId } },
      select: { entity: true },
      distinct: ['entity'],
      orderBy: { entity: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: logs,
      pagination: { page, pages: Math.ceil(total / limit), total },
      entities: entities.map((e) => e.entity),
    })
  } catch (error) {
    console.error('[AUDIT_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
