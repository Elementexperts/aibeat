import type { Metadata } from 'next'
import Script from 'next/script'
import { organizationSchema, websiteSchema, jsonLd } from '@/lib/site-seo'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { TopBar } from '@/components/layout/TopBar'
import { BreakingTicker } from '@/components/layout/BreakingTicker'
import { Footer } from '@/components/layout/Footer'
import { SubscribePopup } from '@/components/subscribe/SubscribePopup'
import { PublicAnalytics } from '@/components/analytics/PublicAnalytics'

const siteUrl = 'https://www.aibeat.dev'
const previewImage = '/og-image.png'
const analyticsId = /^G-[A-Z0-9]+$/.test(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '') ? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID! : 'G-JD3XXLRLZ5'

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
  other: process.env.VERCEL_GIT_COMMIT_SHA ? { 'aibeat-build-revision': process.env.VERCEL_GIT_COMMIT_SHA } : undefined,
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { 'msvalidate.01': process.env.BING_SITE_VERIFICATION } : undefined,
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
  const structuredData = { '@context': 'https://schema.org', '@graph': [organizationSchema, websiteSchema] }

  return (
    <html lang="en">
      <head>
        <link rel="alternate" type="application/rss+xml" title="AIBeat AI News" href="https://www.aibeat.dev/feed.xml" />
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
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
            gtag('config', '${analyticsId}');
          `}
        </Script>
        <script
          id="organization-schema"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(structuredData) }}
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
