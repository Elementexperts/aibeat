import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Business Context | AIBeat Business',
  description: 'Tenant-aware shared Business Context and AI operational memory for AIBeat Business agents.',
}

export default function BusinessContextPage() {
  return <BusinessWorkspace route="context" />
}
