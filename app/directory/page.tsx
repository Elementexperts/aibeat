import type { Metadata } from 'next'
import { TOOLS } from '@/lib/data'
import { hasDirectoryFilterInput, parseDirectoryFilters, type DirectorySearchParams } from '@/lib/directory-filters'
import DirectoryClient from '@/components/ui/DirectoryClient'

type Props = { searchParams?: DirectorySearchParams }

export function generateMetadata({ searchParams = {} }: Props): Metadata { return {
  robots: { index: !hasDirectoryFilterInput(searchParams), follow: true },
  alternates: { canonical: '/directory' },
  title: 'AI Tool Directory — AIBeat.dev',
  description: 'Browse AIBeat’s AI tool directory by category, pricing, and rating. Explore product descriptions, features, and alternatives for your next workflow.',
} }

export default function DirectoryPage({ searchParams = {} }: Props) {
  const filters = parseDirectoryFilters(searchParams, Array.from(new Set(TOOLS.map(tool => tool.category))))
  return <DirectoryClient initialFilters={filters} />
}
