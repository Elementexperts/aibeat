import type { Metadata } from 'next'
import { askAIBeatAction } from '@/app/business/actions'
import { BusinessWorkspace } from '@/components/business/BusinessWorkspace'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { getAuthenticatedBusinessWorkspaceData } from '@/lib/business/workspace-server'

export const metadata: Metadata = { title: 'Ask AIBeat | AIBeat Business', description: 'Get advisory guidance about AIBeat Business workflows, memory, approvals, integrations, and next steps.', robots: privateBusinessRobots }
export default async function AskAIBeatPage() { const data = await getAuthenticatedBusinessWorkspaceData(); return <BusinessWorkspace route="ask" initialData={data} onAskAIBeat={askAIBeatAction} /> }
