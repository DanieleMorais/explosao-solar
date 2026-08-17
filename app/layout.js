import Script from 'next/script'
import { Archivo, Source_Serif_4 } from 'next/font/google'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import CookieBanner from '@/components/CookieBanner'
import Analytics from '@/components/Analytics'
import LangSync from '@/components/LangSync'
import { SITE } from '@/lib/content'
import './globals.css'

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
})

const serif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: `${SITE.name} — Notícias do Brasil e do Mundo`,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  alternates: {
    canonical: '/',
    types: { 'application/rss+xml': [{ url: '/feed.xml', title: `${SITE.name} — Feed RSS` }] },
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: SITE.name,
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
    url: SITE.url,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE.name} — ${SITE.tagline}`,
    description: SITE.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48', type: 'image/x-icon' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
    shortcut: ['/favicon.ico'],
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
}

export const viewport = {
  themeColor: '#0C0E1A',
}

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: SITE.name,
  url: SITE.url,
  logo: { '@type': 'ImageObject', url: `${SITE.url}/icon.svg` },
  email: SITE.email,
  sameAs: [],
}

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE.name,
  url: SITE.url,
  inLanguage: 'pt-BR',
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE.url}/busca?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${serif.variable}`}>
      <body style={{ fontFamily: 'var(--font-archivo), sans-serif', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
        <Header />
        <main style={{ flex: 1 }}>{children}</main>
        <Footer />
        <CookieBanner />
        <Analytics />
        <LangSync />
        {process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  )
}
