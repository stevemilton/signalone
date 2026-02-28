import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'E-SAF Civic — Personal Safety Platform',
  description: 'Connect with your local CCTV control room when you feel unsafe. A supplementary safety tool for UK citizens.',
  keywords: ['safety', 'CCTV', 'personal safety', 'UK', 'control room', 'emergency'],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#1d4ed8',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
