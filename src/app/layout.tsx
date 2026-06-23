import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worldpulse.news'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName} — Notícias do Mundo em Tempo Real`,
    template: `%s | ${siteName}`,
  },
  description: 'As notícias mais relevantes do mundo, atualizadas 24h por dia. Mundo, Economia, Tecnologia, Ciência, Esportes e mais.',
  keywords: ['notícias', 'news', 'mundo', 'economia', 'tecnologia', 'ciência', 'esportes'],
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    alternateLocale: 'en_US',
    url: siteUrl,
    siteName,
  },
  twitter: { card: 'summary_large_image' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body className="min-h-screen flex flex-col bg-white text-slate-900">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
