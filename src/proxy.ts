import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { hasPermission, type UserRole } from '@/lib/permissions'

// Public paths that never need auth check
const PUBLIC_PATHS = [
  '/login', '/register', '/forgot-password', '/api/auth',
  '/about', '/contact', '/faq', '/terms', '/privacy', '/refund',
]

// ── Per-route permission gates ────────────────────────────────────────────
// If a logged-in user hits a route their role doesn't permit, redirect to /dashboard.
const ROUTE_PERMISSIONS: { prefix: string; permission: string }[] = [
  { prefix: '/staff',           permission: 'staff.read' },
  { prefix: '/audit',           permission: 'settings.read' },
  { prefix: '/settings',        permission: 'settings.read' },
  { prefix: '/billing',         permission: 'billing.read' },
  { prefix: '/reports',         permission: 'reports.view' },
  { prefix: '/discounts',       permission: 'discounts.read' },
  { prefix: '/categories',      permission: 'categories.read' },
  { prefix: '/inventory',       permission: 'inventory.read' },
  { prefix: '/suppliers',       permission: 'suppliers.read' },
  { prefix: '/purchase-orders', permission: 'purchase_orders.read' },
]

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip auth entirely for public paths — saves ~1s DB call
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Skip auth for cron and n8n (they have their own API keys)
  if (pathname.startsWith('/api/cron')) return NextResponse.next()
  if (pathname.startsWith('/api/n8n')) return NextResponse.next()

  // File-serving route is public — uploaded images, payment proofs etc. need to load
  // for both authenticated and unauthenticated users (e.g. landing page).
  if (pathname.startsWith('/api/files/')) return NextResponse.next()

  const session = await auth()

  // Protected dashboard routes
  const dashboardRoutes = [
    '/dashboard', '/pos', '/price-check', '/products', '/categories', '/customers',
    '/orders', '/inventory', '/reports', '/staff', '/settings', '/billing', '/returns', '/discounts', '/profile', '/audit',
    '/suppliers', '/purchase-orders',
  ]
  const isDashboard = dashboardRoutes.some(r => pathname.startsWith(r))

  if (isDashboard && !session) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Protect super-admin routes
  if (pathname.startsWith('/super-admin')) {
    if (!session || (session.user as any).role !== 'SUPER_ADMIN') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // ── Per-route permission gate ──
  // Cashier paste karega /staff URL → check their role → redirect to /dashboard
  if (isDashboard && session) {
    const role = (session.user as any).role as UserRole
    const matched = ROUTE_PERMISSIONS.find((r) => pathname.startsWith(r.prefix))
    if (matched && !hasPermission(role, matched.permission)) {
      return NextResponse.redirect(new URL('/dashboard?denied=1', req.url))
    }
  }

  // Protect API routes
  if (pathname.startsWith('/api') && !pathname.startsWith('/api/auth')) {
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public).*)'],
}
