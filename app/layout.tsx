import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TokenMetrics Market App',
  description: 'Indices and Indicators with 30-day detail view',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

