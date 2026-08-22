import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Recommendations | AIBeat Business',
  description: 'AIBeat Business spend and workflow recommendations connected to governed AI agents.',
}

export default function BusinessRecommendationsPage() {
  return <BusinessWorkspace route="recommendations" />
}
