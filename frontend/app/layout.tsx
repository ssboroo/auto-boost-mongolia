import './globals.css'
import './auth-loading.css'
import './site-readable.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import AuthGate from '../components/AuthGate'
import UiProvider from '../components/ui/UiProvider'

export const metadata: Metadata = {
  title: {
    default: 'BOOST.MN — Multi-Channel Ads',
    template: '%s · BOOST.MN',
  },
  description: 'Facebook, Instagram, Google, YouTube, TikTok, X, LinkedIn болон Microsoft Ads-ийг нэг Монгол dashboard-аас удирдах рекламын автоматжуулалтын платформ.',
  applicationName: 'BOOST.MN',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f6f9fe' },
    { media: '(prefers-color-scheme: dark)', color: '#06101d' },
  ],
  colorScheme: 'light dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn" suppressHydrationWarning>
      <body>
        <UiProvider>
          <AuthGate>{children}</AuthGate>
        </UiProvider>
      </body>
    </html>
  )
}
