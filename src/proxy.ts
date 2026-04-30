import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that never need auth check
const PUBLIC_PATHS = ['/login', '/register', '/forgot-password', '/api/auth']

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Skip auth entirely for public paths — saves ~1s DB call
  const isPublic = PUBLIC_PATHS.some(p => pathname.startsWith(p))
  if (isPublic) return NextResponse.next()

  // Skip auth for cron and n8n (they have their own API keys)
  if (pathname.startsWith('/api/cron')) return NextResponse.next()
  if (pathname.startsWith('/api/n8n')) return NextResponse.next()

  const session = await auth()

  // Protected dashboard routes
  const dashboardRoutes = [
    '/dashboard', '/pos', '/products', '/categories', '/customers',
    '/orders', '/inventory', '/reports', '/staff', '/settings', '/billing', '/returns', '/discounts',
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
