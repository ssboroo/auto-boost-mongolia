import './globals.css'
import type { ReactNode } from 'react'

export const metadata = {
  title: 'Auto Boost Mongolia',
  description: 'Монгол хэлтэй AI Ads Manager',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="mn">
      <body>{children}</body>
    </html>
  )
}
