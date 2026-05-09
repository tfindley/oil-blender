'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_LINKS = [
  { label: 'Oils', href: '/admin' },
  { label: 'Blends', href: '/admin/blends' },
  { label: 'Database', href: '/admin/database' },
  { label: 'Settings', href: '/admin/settings' },
]

export function AdminNav() {
  const pathname = usePathname()

  if (pathname === '/admin/login') return null

  return (
    <nav className="sticky top-0 z-30 border-b border-stone-200 bg-white dark:border-stone-700 dark:bg-stone-900">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <span className="font-serif text-lg font-bold text-stone-900 dark:text-stone-100">⚙ Admin</span>

        <div className="flex flex-1 items-center gap-1">
          {NAV_LINKS.map(({ label, href }) => {
            const isActive =
              href === '/admin' ? pathname === '/admin' : pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-b-2 border-amber-700 text-amber-700 dark:border-amber-500 dark:text-amber-500'
                    : 'text-stone-600 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100'
                }`}
              >
                {label}
              </Link>
            )
          })}
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="rounded-md px-3 py-1.5 text-sm text-stone-500 hover:text-stone-800 dark:text-stone-400 dark:hover:text-stone-200"
          >
            ← Back to Site
          </Link>
          <a
            href="/admin/logout"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-50 dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-800"
          >
            Sign Out
          </a>
        </div>
      </div>
    </nav>
  )
}
