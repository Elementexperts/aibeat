import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { TopBar } from '@/components/layout/TopBar'
import { BreakingTicker } from '@/components/layout/BreakingTicker'
import { Footer } from '@/components/layout/Footer'
import { SubscribePopup } from '@/components/subscribe/SubscribePopup'
import { PublicAnalytics } from '@/components/analytics/PublicAnalytics'

const siteUrl = 'https://www.aibeat.dev'
const previewImage = '/og-image.png'
const logoImage = '/aibeat-logo.png'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'AIBeat - Discover AI Tools, Startups, Launches & AI News',
    template: '%s | AIBeat.dev',
  },
  description: 'Discover curated AI tools, emerging startups, product launches and important AI news. Find useful AI products by category, workflow and AIBeat Score.',
  keywords: ['AI news', 'AI tools', 'artificial intelligence', 'AI startup launches', 'AI tool directory', 'AI product discovery'],
  authors: [{ name: 'AIBeat Staff' }],
  creator: 'AIBeat.dev',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon-48.png',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'AIBeat.dev',
    title: 'AIBeat - Discover AI Tools, Startups, Launches & AI News',
    description: 'Discover curated AI tools, emerging startups, product launches and important AI news.',
    images: [
      {
        url: previewImage,
        width: 1200,
        height: 630,
        alt: 'AIBeat.dev - Daily AI news and tool picks',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIBeat - Discover AI Tools, Startups, Launches & AI News',
    description: 'Discover curated AI tools, emerging startups, product launches and important AI news.',
    creator: '@aibeat_dev',
    images: [previewImage],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'AIBeat.dev',
    url: siteUrl,
    logo: `${siteUrl}${logoImage}`,
    image: `${siteUrl}${previewImage}`,
    description: metadata.description,
    sameAs: ['https://www.linkedin.com/company/aibeat-dev'],
  }

  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JD3XXLRLZ5"
          strategy="afterInteractive"
        />
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8952238826290438"
          crossOrigin="anonymous"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JD3XXLRLZ5');
          `}
        </Script>
        <Script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body>
        <TopBar />
        <Navbar />
        <BreakingTicker />
        <main>{children}</main>
        <Footer />
        <SubscribePopup />
        <PublicAnalytics />
      </body>
    </html>
  )
}
