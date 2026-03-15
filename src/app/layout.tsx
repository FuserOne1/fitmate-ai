import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['cyrillic', 'latin'] })

export const metadata: Metadata = {
  title: 'FitMate AI - Твой помощник для похудения',
  description: 'AI-помощник для похудения с анализом еды по фото, трекингом воды и умными рекомендациями',
  manifest: '/manifest.json',
  themeColor: '#f43f5e',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'FitMate',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  icons: {
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  )
}
