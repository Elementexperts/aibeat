import type { Metadata } from 'next'
import { TOOLS } from '@/lib/data'
import DirectoryClient from '@/components/ui/DirectoryClient'

type SearchParams = Record<string, string | string[] | undefined>
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? ''

export function generateMetadata({ searchParams }: { searchParams?: SearchParams }): Metadata { return {
  robots: searchParams && ['category', 'q', 'pricing'].some(key => Boolean(first(searchParams[key]))) ? { index: false, follow: true } : { index: true, follow: true },
  alternates: { canonical: '/directory' },
  title: 'AI Tool Directory — AIBeat.dev',
  description: 'Browse AIBeat’s AI tool directory by category, pricing, and rating. Explore product descriptions, features, and alternatives for your next workflow.',
} }

export default function DirectoryPage({ searchParams = {} }: { searchParams?: SearchParams }) {
  const category = first(searchParams.category)
  const q = Array.from(first(searchParams.q).trim()).slice(0, 200).join('')
  const pricing = first(searchParams.pricing).trim().toLowerCase()
  const initialCategory = TOOLS.some(tool => tool.category === category) ? category : undefined
  const initialPricing = ['free', 'freemium', 'paid'].includes(pricing) ? pricing[0].toUpperCase() + pricing.slice(1) : undefined
  return <DirectoryClient key={JSON.stringify([initialCategory, q, initialPricing])} initialCategory={initialCategory} initialQuery={q} initialPricing={initialPricing} />
}
