import type { Metadata } from 'next'
import Script from 'next/script'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { TopBar } from '@/components/layout/TopBar'
import { BreakingTicker } from '@/components/layout/BreakingTicker'
import { Footer } from '@/components/layout/Footer'

export const metadata: Metadata = {
  title: {
    default: 'AIBeat.dev — The Pulse of Artificial Intelligence',
    template: '%s | AIBeat.dev',
  },
  description: 'Daily AI news, honest tool reviews, and side-by-side comparisons. Free forever. Trusted by 8,400+ founders and freelancers.',
  keywords: ['AI news', 'AI tools', 'artificial intelligence', 'SaaS reviews', 'AI tool comparisons'],
  authors: [{ name: 'AIBeat Staff' }],
  creator: 'AIBeat.dev',
  metadataBase: new URL('https://aibeat.dev'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aibeat.dev',
    siteName: 'AIBeat.dev',
    title: 'AIBeat.dev — The Pulse of Artificial Intelligence',
    description: 'Daily AI news, honest tool reviews, and side-by-side comparisons.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AIBeat.dev',
    description: 'Daily AI news, honest tool reviews, and side-by-side comparisons.',
    creator: '@aibeat_dev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JD3XXLRLZ5"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JD3XXLRLZ5');
          `}
        </Script>
      </head>
      <body>
        <TopBar />
        <Navbar />
        <BreakingTicker />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  )
}
