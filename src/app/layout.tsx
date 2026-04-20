import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '물찾사 - 물리치료사를 찾는 사람들',
  description: '내 주변 전문 물리치료사를 찾아보세요. 부위별 검색, 전문 분야 필터, 카카오톡 즉시 상담.',
  openGraph: {
    title: '물찾사 - 물리치료사를 찾는 사람들',
    description: '내 주변 전문 물리치료사를 찾아보세요.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0A8A7B',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.min.css"
        />
      </head>
      <body className="bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}