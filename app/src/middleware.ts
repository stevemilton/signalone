import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Client-side auth is handled by AuthProvider and route guards
// This middleware handles basic redirects and security headers
export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(self), geolocation=(self), microphone=()')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|firebase-messaging-sw\\.js|sw\\.js).*)',
  ],
}
