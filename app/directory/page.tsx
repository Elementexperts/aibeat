import type { Metadata } from 'next'
import { TOOLS } from '@/lib/data'
import DirectoryClient from '@/components/ui/DirectoryClient'

export function generateMetadata({ searchParams }: { searchParams?: { category?: string; q?: string } }): Metadata { return {
  robots: searchParams?.category || searchParams?.q ? { index: false, follow: true } : { index: true, follow: true },
  alternates: { canonical: '/directory' },
  title: 'AI Tool Directory — AIBeat.dev',
  description: 'Browse AIBeat’s AI tool directory by category, pricing, and rating. Explore product descriptions, features, and alternatives for your next workflow.',
} }

export default function DirectoryPage({ searchParams }: { searchParams?: { category?: string } }) {
  return <DirectoryClient key={searchParams?.category || 'all'} initialCategory={TOOLS.some(tool => tool.category === searchParams?.category) ? searchParams?.category : undefined} />
}
