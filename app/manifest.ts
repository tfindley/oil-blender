import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  const name = process.env.NEXT_PUBLIC_SITE_NAME || 'Oil Blender'
  return {
    name,
    short_name: name.length > 12 ? 'Oil Blender' : name,
    description: 'Build custom massage oil blends with compatibility ratings and recipe cards.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fafaf9',
    theme_color: '#92400e',
    icons: [
      { src: '/icon.png', sizes: '32x32', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  }
}
