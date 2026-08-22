import type { Metadata } from 'next'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'

export const metadata: Metadata = {
  title: 'Settings | AIBeat Business',
  description: 'AIBeat Business workspace settings for industry profile and core security posture.',
}

export default function BusinessSettingsPage() {
  return <BusinessWorkspace route="settings" />
}
