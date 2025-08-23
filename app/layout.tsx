import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: 'zlflly-notes',
  description: 'Taste-first anti-knowledge management notes',
  generator: 'zlflly-notes',
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://my-minttr.vercel.app' : 'http://localhost:3004'),
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'zlflly-notes',
    description: 'Taste-first anti-knowledge management notes',
    type: 'website',
    images: [
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        alt: 'zlflly-notes logo',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'zlflly-notes',
    description: 'Taste-first anti-knowledge management notes',
    images: ['/favicon.png'],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className={GeistSans.className}>
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
      </body>
    </html>
  )
}
