import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const storeId = (session.user as any).storeId as string

    const order = await prisma.order.findFirst({
      where: { id, storeId },
      include: {
        customer: true,
        cashier: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, images: true } },
          },
        },
        payments: true,
        returns: {
          include: {
            items: {
              include: {
                orderItem: { select: { name: true, quantity: true } },
              },
            },
          },
        },
      },
    })

    if (!order) return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })

    return NextResponse.json({ success: true, data: order })
  } catch (error) {
    console.error('[ORDER_GET]', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
