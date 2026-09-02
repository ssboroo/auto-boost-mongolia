import './globals.css'
import './auth-loading.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import AuthGate from '../components/AuthGate'

export const metadata: Metadata = {
  title: {
    default: 'Auto Boost Mongolia — AI Ads Manager',
    template: '%s · Auto Boost Mongolia',
  },
  description: 'Meta Ads Manager-ийн мэргэжлийн тохиргоо, AI шалгалт, тайланг Монгол хэлээр удирдах платформ.',
  applicationName: 'Auto Boost Mongolia',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#111827',
  colorScheme: 'light',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn">
      <body><AuthGate>{children}</AuthGate></body>
    </html>
  )
}
