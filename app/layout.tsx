import type { Metadata, Viewport } from 'next'
import { Lora } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { GoogleAnalytics } from '@/components/analytics/GoogleAnalytics'

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
})

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'Oil Blender'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#92400e',
}

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s — ${siteName}`,
  },
  description: 'Create custom massage oil blends with compatibility ratings, safety guidance, and printable recipe cards.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteName,
  },
}

const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth" className={`${lora.variable} h-full antialiased`}>
      <head>
        {/* Synchronous dark-mode init — prevents flash of light mode for dark-preference users */}
        <script dangerouslySetInnerHTML={{ __html: `try{var t=localStorage.getItem('theme'),d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark')}catch(e){}` }} />
      </head>
      <body className="flex min-h-full flex-col bg-stone-50 text-stone-900 dark:bg-stone-900 dark:text-stone-100">
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
