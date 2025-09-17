import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const AUTH_COOKIE_NAME = 'ipscan_auth'
const CORRECT_ACCESS_CODE = '1212312121.'
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 // 7 วัน

export function setAuthCookie(response: NextResponse) {
  const isSecure = process.env.NODE_ENV === 'production' && 
                   (process.env.VERCEL_URL?.includes('https') || 
                    process.env.NODE_ENV === 'production' && process.env.HTTPS === 'true')
  
  response.cookies.set(AUTH_COOKIE_NAME, 'authenticated', {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'lax',
    maxAge: COOKIE_MAX_AGE,
    path: '/'
  })
}

export function clearAuthCookie(response: NextResponse) {
  response.cookies.delete(AUTH_COOKIE_NAME)
}

export function isAuthenticated(): boolean {
  try {
    const cookieStore = cookies()
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME)
    return authCookie?.value === 'authenticated'
  } catch {
    return false
  }
}

export function isAuthenticatedFromRequest(request: NextRequest): boolean {
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME)
  return authCookie?.value === 'authenticated'
}

export function validateAccessCode(code: string): boolean {
  return code === CORRECT_ACCESS_CODE
}

export function requireAuth(request: NextRequest) {
  if (!isAuthenticatedFromRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }
  return null
}
