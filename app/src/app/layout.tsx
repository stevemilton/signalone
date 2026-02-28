import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ServiceWorkerRegistration } from '@/components/shared/ServiceWorkerRegistration'

export const metadata: Metadata = {
  title: 'Signal One — Personal Safety',
  description: 'Connect with your local CCTV control room when you feel unsafe. A supplementary safety tool for UK citizens.',
  keywords: ['safety', 'CCTV', 'personal safety', 'UK', 'control room', 'emergency'],
  applicationName: 'Signal One',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Signal One',
  },
  formatDetection: {
    telephone: false,
    email: false,
  },
  icons: [
    { url: '/favicon.ico', sizes: '32x32' },
    { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', rel: 'apple-touch-icon' },
  ],
  openGraph: {
    type: 'website',
    title: 'Signal One — Personal Safety',
    description: 'Connect with your local CCTV control room when you feel unsafe.',
    siteName: 'Signal One',
  },
  twitter: {
    card: 'summary',
    title: 'Signal One — Personal Safety',
    description: 'Connect with your local CCTV control room when you feel unsafe.',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1d4ed8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  )
}
