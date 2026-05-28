import type { Metadata } from 'next'
import DirectoryClient from '@/components/ui/DirectoryClient'

export const metadata: Metadata = {
  title: 'AI Tool Directory — AIBeat.dev',
  description: 'Browse 500+ AI tools for founders and freelancers. Filter by category, pricing, and rating.',
}

export default function DirectoryPage() {
  return <DirectoryClient />
}
