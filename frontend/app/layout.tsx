import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    default: 'Auto Boost Mongolia — AI Ads Manager',
    template: '%s · Auto Boost Mongolia',
  },
  description: 'Meta Ads Manager-ийн мэргэжлийн тохиргоо, AI шалгалт, тайланг Монгол хэлээр удирдах платформ.',
  applicationName: 'Auto Boost Mongolia',
  robots: { index: true, follow: true },
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
      <body>{children}</body>
    </html>
  )
}
