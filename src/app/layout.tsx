import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WeChat Article Hub',
  description: 'Track WeChat Official Account performance',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}
