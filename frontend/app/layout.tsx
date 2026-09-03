import './globals.css'
import './auth-loading.css'
import './site-readable.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import AuthGate from '../components/AuthGate'

export const metadata: Metadata = {
  title: {
    default: 'RAINY — AI-Powered Facebook Ads',
    template: '%s · RAINY',
  },
  description: 'RAINY — Facebook болон Meta зар сурталчилгааг AI ашиглан Монгол хэлээр удирдах платформ.',
  applicationName: 'RAINY',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#002319',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  )
}
