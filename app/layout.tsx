import type { Metadata } from 'next'
import { Noto_Sans_Thai } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'

const notoSansThai = Noto_Sans_Thai({ 
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '500', '600', '700']
})

export const metadata: Metadata = {
  title: 'IP Scanner',
  description: 'เครื่องมือสแกน IP Address และตรวจสอบสถานะ',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16', type: 'image/x-icon' },
      { url: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' }
    ],
    apple: '/favicon.svg',
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <body className={notoSansThai.className}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}