import { NextRequest, NextResponse } from 'next/server'
import { verifySessionToken } from '@/lib/admin-auth'

export async function proxy(req: NextRequest) {
  const secret = process.env.ADMIN_SECRET
  if (!secret) return // no secret set — admin open (dev/local only)

  const { pathname } = req.nextUrl

  // Login page itself is always accessible
  if (pathname === '/admin/login') return

  const token = req.cookies.get('admin_token')?.value

  if (!(await verifySessionToken(token, secret))) {
    const loginUrl = req.nextUrl.clone()
    loginUrl.pathname = '/admin/login'
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: ['/admin/:path*'],
}
