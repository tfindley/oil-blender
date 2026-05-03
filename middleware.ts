import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return // no secret set — admin open (dev/local only)

  const { pathname } = req.nextUrl

  // Login page itself is always accessible
  if (pathname === '/admin/login') return

  const token = req.cookies.get('admin_token')?.value

  // Constant-time comparison to prevent timing attacks
  let match = token !== undefined && token.length === secret.length
  if (match) {
    const enc = new TextEncoder()
    const a = enc.encode(token)
    const b = enc.encode(secret)
    let diff = 0
    for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
    match = diff === 0
  }

  if (!match) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
