'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function adminLogin(_prev: unknown, data: FormData): Promise<{ error: string } | never> {
  const secret = process.env.ADMIN_SECRET
  const input = data.get('secret')?.toString() ?? ''

  if (!secret) {
    redirect('/admin')
  }

  // Constant-time comparison
  const enc = new TextEncoder()
  const a = enc.encode(input.padEnd(128, '\0').slice(0, 128))
  const b = enc.encode(secret.padEnd(128, '\0').slice(0, 128))
  let diff = input.length !== secret.length ? 1 : 0
  for (let i = 0; i < 128; i++) diff |= a[i] ^ b[i]

  if (diff !== 0) {
    return { error: 'Incorrect secret.' }
  }

  const jar = await cookies()
  jar.set('admin_token', secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })

  redirect('/admin')
}
