import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import ClientErrorBoundary from '@/components/ClientErrorBoundary'
import './globals.css'

export const metadata: Metadata = {
  title: {
    default: 'zlflly-notes',
    template: '%s | zlflly-notes'
  },
  description: 'Taste-first anti-knowledge management notes - 个人笔记管理系统，支持文本、链接、图片笔记的创建和管理',
  generator: 'zlflly-notes',
  applicationName: 'zlflly-notes',
  keywords: ['notes', 'knowledge management', '笔记', '知识管理', 'productivity', '效率工具'],
  authors: [{ name: 'zlflly', url: 'https://github.com/zlflly' }],
  creator: 'zlflly',
  publisher: 'zlflly',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://www.zlflly.asia' : 'http://localhost:3000')),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon.png', sizes: '192x192', type: 'image/png' },
      { url: '/favicon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.png',
    apple: [
      { url: '/favicon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      {
        rel: 'apple-touch-icon-precomposed',
        url: '/favicon.png',
      },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'zlflly-notes',
    title: 'zlflly-notes',
    description: 'Taste-first anti-knowledge management notes - 个人笔记管理系统，支持文本、链接、图片笔记的创建和管理',
    url: '/',
    images: [
      {
        url: '/favicon.png',
        width: 512,
        height: 512,
        alt: 'zlflly-notes logo - 笔记本图标',
        type: 'image/png',
      },
    ],
    locale: 'zh_CN',
  },
  twitter: {
    card: 'summary',
    site: '@zlflly',
    creator: '@zlflly',
    title: 'zlflly-notes',
    description: 'Taste-first anti-knowledge management notes - 个人笔记管理系统',
    images: [
      {
        url: '/favicon.png',
        alt: 'zlflly-notes logo',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: '', // 如果有Google Search Console验证码，可以在这里添加
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        <meta name="theme-color" content="#F6F4F0" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="zlflly-notes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#F6F4F0" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <link rel="mask-icon" href="/favicon.png" color="#1C1917" />
      </head>
      <body className={GeistSans.className}>
        <ClientErrorBoundary>
          {children}
        </ClientErrorBoundary>
      </body>
    </html>
  )
}
