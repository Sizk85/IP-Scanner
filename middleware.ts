import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAuthenticatedFromRequest } from '@/lib/auth'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow access to login page and API auth routes
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth/login') ||
    pathname === '/'
  ) {
    return NextResponse.next()
  }

  // Check authentication for protected routes
  const isAuthenticated = isAuthenticatedFromRequest(request)

  if (!isAuthenticated) {
    // Redirect to login page
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
}
