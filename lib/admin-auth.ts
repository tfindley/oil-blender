// Admin session tokens: random 32-byte token + HMAC-SHA256 signature with
// ADMIN_SECRET. The cookie value is `${token}.${signature}` — opaque to the
// browser. Verify by recomputing the HMAC and timing-safe comparing.
//
// This decouples the cookie value from ADMIN_SECRET itself. A leaked cookie
// no longer reveals the secret; rotating the secret invalidates all cookies.
//
// Uses the Web Crypto API so the same module works in both the Node runtime
// (server actions, route handlers) and the Edge runtime (middleware/proxy).

const enc = new TextEncoder()

function bytesToHex(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i++) out += bytes[i].toString(16).padStart(2, '0')
  return out
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) return new Uint8Array(0)
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const b = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
    if (Number.isNaN(b)) return new Uint8Array(0)
    bytes[i] = b
  }
  return bytes
}

async function hmacHex(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
  return bytesToHex(new Uint8Array(sig))
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length === 0 || a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i]
  return diff === 0
}

export async function mintSessionToken(secret: string): Promise<string> {
  const tokenBytes = new Uint8Array(32)
  crypto.getRandomValues(tokenBytes)
  const token = bytesToHex(tokenBytes)
  const sig = await hmacHex(secret, token)
  return `${token}.${sig}`
}

export async function verifySessionToken(cookieValue: string | undefined, secret: string): Promise<boolean> {
  if (!cookieValue) return false
  const [token, sig] = cookieValue.split('.')
  if (!token || !sig) return false
  const expected = await hmacHex(secret, token)
  return timingSafeEqual(hexToBytes(sig), hexToBytes(expected))
}
