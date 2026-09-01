'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Archive,
  Bot,
  BriefcaseBusiness,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileText,
  Gauge,
  GitBranch,
  LayoutDashboard,
  Lock,
  LogOut,
  MessagesSquare,
  PauseCircle,
  Play,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  UploadCloud,
  Users,
} from 'lucide-react'
import { AGENT_REGISTRY, executeAgentMock } from '@/lib/business/agents'
import { getBusinessWorkspaceData, type BusinessWorkspaceData } from '@/lib/business/workspace'
import { getAgentIndustryInstructions, INDUSTRY_PROFILE_LABELS } from '@/lib/business/industry-profiles'
import { decideApproval, runWorkflowManual } from '@/lib/business/workflows'
import type { AgentEvaluationResult, AgentFinding, AgentType, Approval, BusinessDocumentIngestionResult, IndustryProfile, IntegrationConnection, IntegrationConnectionStatus, OrganizationMember, Role, WorkflowRun } from '@/lib/business/types'
import { createClient } from '@/lib/supabase/client'
import { AskAIBeat } from './AskAIBeat'
import type { AIBeatAssistantMessage, AIBeatAssistantResponse } from '@/lib/business/assistant/types'
import { buildWorkflowCatalog, getPreparedLeadResearchInput, validatePreparedLeadUrl } from '@/lib/business/workflow-catalog'
import { defaultRunHistory, groupLeadQualifications, runProspectLabel, runProspectUrl, sortAndDedupeRuns } from '@/lib/business/workflow-history'

export type BusinessWorkspaceRoute =
  | 'dashboard'
  | 'ask'
  | 'workflows'
  | 'workflow-detail'
  | 'agents'
  | 'context'
  | 'ai-stack'
  | 'recommendations'
  | 'approvals'
  | 'integrations'
  | 'reports'
  | 'audit'
  | 'settings'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

const navItems = [
  { href: '/business/dashboard', label: 'Dashboard', key: 'dashboard', icon: LayoutDashboard },
  { href: '/business/ask', label: 'Ask AIBeat', key: 'ask', icon: MessagesSquare },
  { href: '/business/workflows', label: 'Workflows', key: 'workflows', icon: GitBranch },
  { href: '/business/agents', label: 'Agents', key: 'agents', icon: Bot },
  { href: '/business/context', label: 'Business Memory', key: 'context', icon: Database },
  { href: '/business/ai-stack', label: 'AI Stack', key: 'ai-stack', icon: CircleDollarSign },
  { href: '/business/recommendations', label: 'Recommendations', key: 'recommendations', icon: TrendingUp },
  { href: '/business/approvals', label: 'Approvals', key: 'approvals', icon: ClipboardCheck },
  { href: '/business/integrations', label: 'Integrations', key: 'integrations', icon: Plug },
  { href: '/business/reports', label: 'Reports', key: 'reports', icon: FileText },
  { href: '/business/audit', label: 'Audit', key: 'audit', icon: Archive },
  { href: '/business/settings', label: 'Settings', key: 'settings', icon: Settings },
]

const agentStats: Record<AgentType, string> = {
  LEAD_RESEARCH: '7 qualified leads',
  COMPETITOR_MONITOR: '3 important developments',
  MARKETING_CONTENT: '2 drafts awaiting review',
  WEEKLY_REPORT: 'Next run Monday 08:00',
  EXECUTIVE_BRIEF: 'Last run 07:30',
}

type WorkspaceMode = 'demo' | 'authenticated'

export function BusinessWorkspace({
  route,
  workflowId,
  initialData,
  onRunWorkflow,
  onDecideApproval,
  onUploadDocument,
  onUpdateIntegration,
  onInviteMember,
  onUpdateMemberRole,
  onRunEvaluations,
  onAskAIBeat,
  onTestAIConnection,
  initialWorkflowSuggestion,
  mode = 'authenticated',
}: {
  route: BusinessWorkspaceRoute
  workflowId?: string
  initialData?: BusinessWorkspaceData
  onRunWorkflow?: (workflowId: string, input?: Record<string, unknown>) => Promise<{ run: WorkflowRun; approval?: Approval; finding?: AgentFinding }>
  onDecideApproval?: (approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'EDITED', editedContent?: string) => Promise<Approval>
  onUploadDocument?: (formData: FormData) => Promise<BusinessDocumentIngestionResult>
  onUpdateIntegration?: (integrationId: string, action: 'disconnect' | 'reconnect' | 'mark-expired') => Promise<IntegrationConnection>
  onInviteMember?: (formData: FormData) => Promise<OrganizationMember>
  onUpdateMemberRole?: (memberId: string, role: Role) => Promise<OrganizationMember>
  onRunEvaluations?: () => Promise<AgentEvaluationResult[]>
  onAskAIBeat?: (question: string, history?: AIBeatAssistantMessage[]) => Promise<{ ok: true; response: AIBeatAssistantResponse } | { ok: false; error: string; code?: string }>
  onTestAIConnection?: () => Promise<{ ok: boolean; message: string; latencyMs?: number }>
  initialWorkflowSuggestion?: { workflowId: string; input: Record<string, string> }
  mode?: WorkspaceMode
}) {
  const fallbackData = useMemo(() => {
    if (initialData) return initialData
    if (mode === 'demo') return getBusinessWorkspaceData()
    throw new Error('Authenticated workspace data is required.')
  }, [initialData, mode])
  const data = fallbackData
  const isDemo = mode === 'demo'
  const [, startTransition] = useTransition()
  const [selectedProfile, setSelectedProfile] = useState<IndustryProfile>(data.organization.primaryProfile)
  const [approvals, setApprovals] = useState<Approval[]>(data.approvals)
  const [runs, setRuns] = useState<WorkflowRun[]>(data.runs)
  const [findings, setFindings] = useState<AgentFinding[]>(data.findings)
  const [workflowError, setWorkflowError] = useState<string | null>(null)
  const [runningWorkflowId, setRunningWorkflowId] = useState<string | null>(null)
  const [memoryData, setMemoryData] = useState(data)
  const [demoAgentOutput, setDemoAgentOutput] = useState<Record<string, unknown> | null>(null)
  const activeWorkflow = data.workflows.find((workflow) => workflow.id === workflowId) ?? data.workflows[0]

  async function handleSignOut() {
    const supabase = createClient()

    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error('Unable to sign out of AIBeat Business', error)
      return
    }

    window.location.assign('/business')
  }

  function runWorkflow(id: string, input: Record<string, unknown> = {}) {
    const workflow = data.workflows.find((candidate) => candidate.id === id || candidate.templateId === id) ?? data.templates.find((candidate) => candidate.id === id)
    if (!workflow) return
    if (workflow.inputs.some((item) => item.required) && !Object.keys(input).length) {
      window.location.assign('/business/workflows')
      return
    }
    if (!isDemo && onRunWorkflow) {
      startTransition(async () => {
        setWorkflowError(null); setRunningWorkflowId(id)
        try {
          const result = await onRunWorkflow(id, input)
          setRuns((current) => [result.run, ...current.filter((run) => run.id !== result.run.id)])
          if (result.approval) setApprovals((current) => [result.approval!, ...current.filter((approval) => approval.id !== result.approval?.id)])
          if (result.finding) setFindings((current) => [result.finding!, ...current.filter((finding) => finding.id !== result.finding?.id)])
        } catch (error) { setWorkflowError(error instanceof Error ? error.message : 'Workflow could not be run.') }
        finally { setRunningWorkflowId(null) }
      })
      return
    }
    const result = runWorkflowManual(workflow, data.organization.id === 'org-growth-labs' ? 'user-sarah' : data.organization.id)
    setRuns((current) => [result.run, ...current])
    if (result.approval) setApprovals((current) => [result.approval!, ...current])
  }

  function resolveApproval(approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED') {
    const editedContent = decision === 'EDITED' ? `${approval.generatedContent}\n\nEdited by approver.` : undefined
    if (!isDemo && onDecideApproval) {
      startTransition(async () => {
        const next = await onDecideApproval(approval.id, decision, editedContent)
        setApprovals((current) => current.map((item) => (item.id === approval.id ? next : item)))
        setRuns((current) => current.map((run) => {
          if (run.id !== next.workflowRunId) return run
          return {
            ...run,
            status: decision === 'REJECTED' ? 'FAILED' : 'COMPLETED',
            completedAt: new Date().toISOString(),
            resultSummary: decision === 'REJECTED' ? 'Workflow stopped after rejection.' : 'Workflow completed after approval.',
          }
        }))
      })
      return
    }
    setApprovals((current) => current.map((item) => (item.id === approval.id ? decideApproval(item, decision, 'user-sarah', editedContent) : item)))
  }

  function runAgent(agentType: AgentType) {
    const result = executeAgentMock(
      {
        organizationId: data.organization.id,
        userId: 'user-sarah',
        workflowRunId: `manual-agent-${Date.now()}`,
        industryProfile: selectedProfile,
        permissions: ['business:read', 'workflow:run'],
        businessContext: data.context,
      },
      agentType,
    )
    setDemoAgentOutput(result.output)
  }

  return (
    <div className="dark-page min-h-screen bg-[#0b1117] text-white">
      <div className="border-b border-white/10 bg-[#101820]">
        <div className="site-shell py-6">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-5xl">
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
                <BriefcaseBusiness className="h-4 w-4" />
                {isDemo ? 'Demo workspace' : 'AIBeat Business'}
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">
                One company memory. Five specialized AI agents. Fewer disconnected AI tools.
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-lg md:leading-8">
                {isDemo
                  ? 'Interactive demo with fictional names, activity, integrations, and financial metrics.'
                  : 'Understand AI spend, automate recurring work, and give every AI agent the same governed business context.'}
              </p>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                {isDemo
                  ? 'No real organization data is queried or changed in this public demo.'
                  : 'A corporate AI operating console for spend intelligence, workflow automation, approvals, reports, and audit-ready context.'}
              </p>
            </div>
            <div className="grid min-w-0 gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm sm:min-w-[280px]">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Organization</span>
              <strong className="text-lg text-white">{data.organization.name}</strong>
              <span className="text-slate-300">{data.industryLabel}</span>
              <span className="inline-flex w-fit items-center gap-2 rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold text-slate-300">
                <Users className="h-3.5 w-3.5" />
                {data.organization.employeeCount} employees
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="site-shell grid gap-6 py-6 lg:grid-cols-[240px_1fr]">
        <aside className="h-fit rounded-lg border border-white/10 bg-white/[0.035] p-2">
          {navItems.map((item) => {
            const selected = route === item.key || (route === 'workflow-detail' && item.key === 'workflows')
            return (
              <Link
                key={item.href}
                href={isDemo ? `/business/demo?view=${item.key}` : item.href}
                className={`flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition ${selected ? 'bg-emerald-300/15 text-emerald-100' : 'text-slate-300 hover:bg-white/[0.05] hover:text-white'}`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            )
          })}
          <Link href="/business/ai-spend-calculator" className="mt-2 flex items-center gap-3 rounded-md border border-cyan-300/20 px-3 py-2.5 text-sm font-semibold text-cyan-100">
            <Sparkles className="h-4 w-4" />
            Spend Calculator
          </Link>
          {isDemo && (
            <div className="mt-3 grid gap-2 border-t border-white/10 pt-3">
              <Link href="/business/sign-up" className="rounded-md bg-emerald-400 px-3 py-2 text-center text-sm font-black text-slate-950">Create Your Workspace</Link>
              <Link href="/business/pricing" className="rounded-md border border-white/10 px-3 py-2 text-center text-sm font-black text-white">Start Early Access</Link>
            </div>
          )}
          {!isDemo && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm font-semibold text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {isDemo && <DemoNotice />}
          {route === 'dashboard' && <Dashboard data={data} approvals={approvals} runs={runs} onRunWorkflow={runWorkflow} mode={mode} />}
          {route === 'ask' && <AskAIBeat onAsk={onAskAIBeat} demo={isDemo} />}
          {route === 'workflows' && <Workflows data={data} runs={runs} findings={findings} onRunWorkflow={runWorkflow} mode={mode} error={workflowError} runningWorkflowId={runningWorkflowId} initialWorkflowSuggestion={initialWorkflowSuggestion} />}
          {route === 'workflow-detail' && activeWorkflow && <WorkflowDetail workflow={activeWorkflow} runs={runs.filter((run) => run.workflowId === activeWorkflow.id)} onRunWorkflow={runWorkflow} mode={mode} />}
          {route === 'agents' && (
            <Agents
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              demoAgentOutput={demoAgentOutput}
              onRunAgent={runAgent}
              mode={mode}
            />
          )}
          {route === 'context' && <ContextView data={memoryData} onUploadDocument={onUploadDocument ? async (formData) => {
            const result = await onUploadDocument(formData)
            setMemoryData((current) => ({
              ...current,
              documents: [result.document, ...(current.documents ?? []).filter((document) => document.id !== result.document.id)],
              documentChunks: [...result.chunks, ...(current.documentChunks ?? []).filter((chunk) => chunk.documentId !== result.document.id)],
              context: {
                ...current.context,
                companyKnowledge: [result.contextItem, ...current.context.companyKnowledge.filter((item) => item.id !== result.contextItem.id)],
              },
            }))
            return result
          } : undefined} mode={mode} />}
          {route === 'ai-stack' && <AIStack data={data} onTestAIConnection={onTestAIConnection} />}
          {route === 'recommendations' && <Recommendations data={data} />}
          {route === 'approvals' && <Approvals approvals={approvals} onResolve={resolveApproval} mode={mode} />}
          {route === 'integrations' && <Integrations data={data} onUpdateIntegration={onUpdateIntegration} mode={mode} />}
          {route === 'reports' && <Reports data={data} runs={runs} onRunEvaluations={onRunEvaluations} mode={mode} />}
          {route === 'audit' && <Audit data={data} />}
          {route === 'settings' && <SettingsView data={data} selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile} onInviteMember={onInviteMember} onUpdateMemberRole={onUpdateMemberRole} mode={mode} />}
        </section>
      </div>
    </div>
  )
}

function Dashboard({ data, approvals, runs, onRunWorkflow, mode }: { data: ReturnType<typeof getBusinessWorkspaceData>; approvals: Approval[]; runs: WorkflowRun[]; onRunWorkflow: (id: string) => void; mode: WorkspaceMode }) {
  const metrics = [
    { label: 'AI Spend', value: `${money.format(data.roi.aiSpendMonthly)}/mo`, estimate: true },
    { label: 'Potential Savings', value: `${money.format(data.roi.potentialSavingsMonthly)}/mo`, estimate: true },
    { label: 'Estimated Hours Saved', value: `${data.roi.estimatedHoursSaved}h`, estimate: true },
    { label: 'Active Workflows', value: String(data.workflows.filter((workflow) => workflow.status === 'ACTIVE').length) },
    { label: 'Pending Approvals', value: String(approvals.filter((approval) => approval.status === 'PENDING').length) },
    { label: 'Run Success', value: `${data.roi.workflowSuccessRate}%`, estimate: true },
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {metrics.map((metric) => (
          <Metric key={metric.label} label={metric.label} value={metric.value} estimate={metric.estimate} />
        ))}
      </div>

      <ExecutiveBriefSection items={data.executiveBriefItems} />

      <OptimizationOpportunitiesSection opportunities={data.optimizationOpportunities} />

      <AgentTeamSection data={data} />

      <BusinessMemoryHealthSection health={data.businessMemoryHealth} connectors={data.connectors} />

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <NotificationsSection data={data} />
        <RecentActivitySection activities={data.recentActivity} approvals={approvals} runs={runs} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Panel title="Workflow / Integration Health" icon={Gauge}>
          <div className="grid gap-3 md:grid-cols-2">
            {data.workflows.map((workflow) => (
              <div key={workflow.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{workflow.name}</h3>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{workflow.description}</p>
                  </div>
                  <StatusBadge status={workflow.status === 'ACTIVE' ? 'Success' : workflow.status} tone={workflow.status === 'ACTIVE' ? 'green' : 'amber'} />
                </div>
                <button
                  type="button"
                  disabled={workflow.status !== 'ACTIVE'}
                  onClick={() => onRunWorkflow(workflow.id)}
                  className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                >
                  <Play className="h-4 w-4" />
                  {mode === 'demo' ? 'Simulate Run' : 'Run'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.connectors.slice(0, 4).map((connector) => (
              <div key={connector.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{connector.name}</div>
                <div className="mt-2 text-sm font-black text-white">{formatConnectorStatus(connector.status)}</div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  )
}

function NotificationsSection({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  const notifications = data.notifications ?? []
  return (
    <Panel title="Notifications" icon={AlertTriangle}>
      {notifications.length ? (
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notification) => (
            <Link key={notification.id} href={notification.href ?? '/business/dashboard'} className="block rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-amber-300/30">
              <div className="flex items-start justify-between gap-3">
                <strong className="text-sm text-white">{notification.title}</strong>
                <StatusBadge status={formatConnectorStatus(notification.status)} tone={notification.status === 'UNREAD' ? 'amber' : 'slate'} />
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{notification.body}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title="No operational notifications" body="Approvals, workflow failures, and priority workflow completions will appear here." />
      )}
    </Panel>
  )
}

function ExecutiveBriefSection({ items }: { items: ReturnType<typeof getBusinessWorkspaceData>['executiveBriefItems'] }) {
  return (
    <Panel title="Today's Executive Brief" icon={CalendarCheck} action={<Link href="/business/reports" className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300">Open Daily Brief <ArrowRight className="h-4 w-4" /></Link>}>
      {items.length ? (
        <div className="grid gap-4 lg:grid-cols-[0.32fr_1fr]">
          <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 p-4">
            <div className="text-4xl font-black text-white">{items.length}</div>
            <p className="mt-2 text-sm font-semibold text-emerald-50">items need attention</p>
            <p className="mt-3 text-sm leading-6 text-slate-300">The Executive Daily Brief synthesizes agent findings, approvals, workflow signals, and company context.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {items.map((item) => (
              <Link key={item.id} href={item.href ?? '/business/reports'} className="rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-100">{item.type}</div>
                <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-xs leading-5 text-slate-400">{item.summary}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState title="No executive brief yet" body="Once agents run, the Executive Daily Brief will summarize the most important items for leadership." />
      )}
    </Panel>
  )
}

function OptimizationOpportunitiesSection({ opportunities }: { opportunities: ReturnType<typeof getBusinessWorkspaceData>['optimizationOpportunities'] }) {
  return (
    <Panel title="AI Optimization Opportunities" icon={TrendingUp}>
      {opportunities.length ? (
        <div className="grid gap-4 xl:grid-cols-3">
          {opportunities.slice(0, 3).map((opportunity) => (
            <div key={opportunity.id} className="flex flex-col rounded-lg border border-white/10 bg-black/20 p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">{opportunity.type.replace('_', ' ')}</div>
                  <h3 className="mt-2 text-lg font-black text-white">{opportunity.title}</h3>
                </div>
                {opportunity.confidence && <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate-300">{Math.round(opportunity.confidence * 100)}% est.</span>}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">{opportunity.problem}</p>
              <div className="mt-4 grid gap-3">
                <OpportunityStep label={opportunity.currentStateLabel} value={opportunity.currentStateValue} />
                <OpportunityStep label="AIBeat capability" value={opportunity.recommendedCapability} />
                <OpportunityStep label="Potential action" value={opportunity.potentialAction} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-400">
                {opportunity.estimatedMonthlySavings && <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-emerald-100">{money.format(opportunity.estimatedMonthlySavings)}/mo estimated savings</span>}
                {opportunity.estimatedHoursSaved && <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-cyan-100">{opportunity.estimatedHoursSaved} hrs/mo estimated</span>}
              </div>
              <Link href={opportunity.ctaHref} className="mt-5 inline-flex items-center justify-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-black text-white transition hover:border-cyan-300/40">
                {opportunity.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState title="No recommendations yet" body="AIBeat will show consolidation, utilization, governance, and workflow automation opportunities after spend and workflow signals are available." />
      )}
    </Panel>
  )
}

function OpportunityStep({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-1 text-sm font-semibold leading-5 text-white">{value}</div>
    </div>
  )
}

function AgentTeamSection({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  const groups = [
    { key: 'INTELLIGENCE', title: 'Intelligence Agents', description: 'Discover prospects, monitor markets, and prepare campaign work.' },
    { key: 'REPORTING', title: 'Reporting Agent', description: 'Turns operational signals into recurring reports.' },
    { key: 'EXECUTIVE', title: 'Executive Agent', description: 'Synthesizes the most important findings from AIBeat Business agents and company context.' },
  ] as const

  return (
    <Panel title="Your AI Team" icon={Bot}>
      {data.agentSummaries.length ? (
        <div className="space-y-5">
          {groups.map((group) => {
            const summaries = data.agentSummaries.filter((summary) => summary.group === group.key)
            if (!summaries.length) return null
            return (
              <div key={group.key}>
                <div className="mb-3">
                  <h3 className="text-sm font-black uppercase tracking-[0.14em] text-slate-300">{group.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{group.description}</p>
                </div>
                <div className="grid gap-3 lg:grid-cols-3">
                  {summaries.map((summary) => {
                    const agent = data.agents.find((candidate) => candidate.type === summary.agentType) ?? AGENT_REGISTRY[summary.agentType]
                    return <AgentCard key={summary.agentType} agent={agent} summary={summary} />
                  })}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <EmptyState title="No agent activity yet" body="Your five AIBeat agents will appear here after workflows or scheduled runs produce their first outputs." />
      )}
    </Panel>
  )
}

function AgentCard({ agent, summary }: { agent: ReturnType<typeof getBusinessWorkspaceData>['agents'][number]; summary: ReturnType<typeof getBusinessWorkspaceData>['agentSummaries'][number] }) {
  const tone = summary.status === 'ACTIVE' ? 'green' : summary.status === 'WAITING_APPROVAL' ? 'amber' : 'slate'

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.12em] text-cyan-100">{summary.group === 'INTELLIGENCE' ? 'Intelligence Agent' : summary.group === 'REPORTING' ? 'Reporting Agent' : 'Executive Agent'}</div>
          <h3 className="mt-2 text-base font-black text-white">{agent.name}</h3>
        </div>
        <StatusBadge status={summary.status.replace('_', ' ')} tone={tone} />
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-300">{summary.agentType === 'EXECUTIVE_BRIEF' ? 'Synthesizes the most important findings from AIBeat Business agents and company context.' : agent.description}</p>
      <div className="mt-4 grid gap-2 text-xs text-slate-400">
        <span>Last run: {formatDashboardTime(summary.lastRunAt)}</span>
        <span>{summary.keyResult}</span>
        <span>Next run: {formatDashboardTime(summary.nextRunAt)}</span>
        {summary.pendingOutput && <span className="text-amber-100">Pending: {summary.pendingOutput}</span>}
      </div>
    </div>
  )
}

function BusinessMemoryHealthSection({ health, connectors }: { health: ReturnType<typeof getBusinessWorkspaceData>['businessMemoryHealth']; connectors: ReturnType<typeof getBusinessWorkspaceData>['connectors'] }) {
  const connectedSources = connectors.filter((connector) => connector.status === 'CONNECTED')

  return (
    <Panel title="Business Memory" icon={Database} action={<Link href="/business/context" className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm font-black text-white transition hover:border-emerald-300/40">Manage Business Context <ArrowRight className="h-4 w-4" /></Link>}>
      {health ? (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-sm leading-6 text-slate-300">Shared company knowledge, operational context and previous AI findings used across your agents.</p>
            <p className="mt-3 rounded-lg border border-cyan-300/20 bg-cyan-300/10 p-3 text-sm leading-6 text-cyan-50">All five AI agents use the same governed organization context.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="Company Knowledge" value={`${health.companyKnowledgeScore}%`} />
            <Metric label="Operational Context" value={`${health.operationalContextScore}%`} />
            <Metric label="CRM" value={formatConnectorStatus(health.crmStatus)} />
            <Metric label="Analytics" value={formatConnectorStatus(health.analyticsStatus)} />
            <Metric label="Calendar" value={formatConnectorStatus(health.calendarStatus)} />
            <Metric label="Documents" value={String(health.documentCount)} />
            <Metric label="Agent Findings" value={String(health.agentFindingCount)} />
            <Metric label="Last Updated" value={formatDashboardTime(health.lastUpdatedAt)} />
          </div>
        </div>
      ) : connectedSources.length ? (
        <EmptyState title="Business Memory is warming up" body="Connected data sources are available. AIBeat will show health scores after context is indexed." />
      ) : (
        <EmptyState title="Connect your first data source" body="Connect CRM, analytics, calendar, or documents so all five agents can share governed company context." />
      )}
    </Panel>
  )
}

function RecentActivitySection({ activities, approvals, runs }: { activities: ReturnType<typeof getBusinessWorkspaceData>['recentActivity']; approvals: Approval[]; runs: WorkflowRun[] }) {
  return (
    <Panel title="Recent Activity" icon={Activity}>
      {activities.length ? (
        <div className="space-y-3">
          {activities.map((activity) => (
            <Link key={activity.id} href={activity.href ?? '/business/dashboard'} className="block rounded-lg border border-white/10 bg-black/20 p-4 transition hover:border-emerald-300/30">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-slate-500">{activity.timestampLabel}</div>
                  <h3 className="mt-1 text-sm font-black text-white">{activity.title}</h3>
                  <p className="mt-1 text-sm text-slate-400">{activity.summary}</p>
                </div>
                <StatusBadge status={activity.status.replace('_', ' ')} tone={activity.status === 'SUCCESS' ? 'green' : activity.status === 'WAITING_APPROVAL' ? 'amber' : activity.status === 'FAILED' ? 'red' : 'cyan'} />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <Timeline runs={runs} approvals={approvals} />
      )}
    </Panel>
  )
}

function Workflows({ data, runs, findings, onRunWorkflow, mode, error, runningWorkflowId, initialWorkflowSuggestion }: { data: ReturnType<typeof getBusinessWorkspaceData>; runs: WorkflowRun[]; findings: AgentFinding[]; onRunWorkflow: (id: string, input?: Record<string, unknown>) => void; mode: WorkspaceMode; error: string | null; runningWorkflowId: string | null; initialWorkflowSuggestion?: { workflowId: string; input: Record<string, string> } }) {
  const catalog = buildWorkflowCatalog(data.workflows, data.templates)
  const suggestedWorkflow = initialWorkflowSuggestion ? catalog.find((workflow) => workflow.templateId === initialWorkflowSuggestion.workflowId || workflow.id === initialWorkflowSuggestion.workflowId) : undefined
  const [workflowInputs, setWorkflowInputs] = useState<Record<string, Record<string, string>>>(suggestedWorkflow && initialWorkflowSuggestion ? { [suggestedWorkflow.id]: initialWorkflowSuggestion.input } : {})
  const preparedInput = getPreparedLeadResearchInput(initialWorkflowSuggestion)
  const [preparedLeadUrl, setPreparedLeadUrl] = useState(preparedInput?.leadUrl ?? '')
  const [preparedError, setPreparedError] = useState<string | null>(null)
  const [showOlderRuns, setShowOlderRuns] = useState(false)
  const orderedRuns = sortAndDedupeRuns(runs)
  const visibleRuns = defaultRunHistory(orderedRuns, showOlderRuns)
  const qualificationGroups = groupLeadQualifications(findings, orderedRuns)
  function runPreparedLeadResearch() {
    const validation = validatePreparedLeadUrl(preparedLeadUrl)
    if (!validation.ok) { setPreparedError(validation.error); return }
    setPreparedError(null)
    onRunWorkflow('tpl-lead-research', { leadUrl: validation.leadUrl })
  }
  return (
    <Panel title="Structured Workflows" icon={GitBranch}>
      <div className="space-y-4">
        {error && <div className="rounded-md border border-rose-300/30 bg-rose-300/10 p-3 text-sm text-rose-100">{error}</div>}
        {preparedInput && <div className="rounded-lg border border-cyan-300/30 bg-cyan-300/[0.07] p-5">
          <p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">Recommended by Ask AIBeat</p>
          <h3 className="mt-2 text-xl font-black">Lead Research &amp; Qualification</h3>
          <label className="mt-4 block max-w-xl text-sm font-semibold text-slate-200">Prospect website<input aria-label="Prepared prospect website" value={preparedLeadUrl} onChange={(event) => { setPreparedLeadUrl(event.target.value); setPreparedError(null) }} className="mt-2 w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2.5 text-sm text-white" /></label>
          {preparedError && <p className="mt-2 text-sm text-rose-200">{preparedError}</p>}
          <div className="mt-4"><p className="text-sm font-semibold text-white">AIBeat will:</p><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300"><li>Research the prospect&apos;s public website</li><li>Compare it against Business Memory and your ICP</li><li>Calculate qualification and confidence</li><li>Identify evidence, likely needs, and risks</li><li>Prepare the recommended next action</li><li>Stop at the approval boundary before external action</li></ul></div>
          <div className="mt-5 flex flex-wrap gap-2"><Link href="/business/ask" className="rounded-md border border-white/15 px-4 py-2 text-sm font-black text-white">Back to Ask AIBeat</Link><button type="button" disabled={runningWorkflowId === 'tpl-lead-research' || !preparedLeadUrl.trim()} onClick={runPreparedLeadResearch} className="inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400"><Play className="h-4 w-4" />{runningWorkflowId === 'tpl-lead-research' ? 'Running…' : 'Run Lead Research'}</button></div>
        </div>}
        <h3 className="pt-2 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Workflow Catalog</h3>
        {catalog.map((workflow) => (
          <div key={workflow.id} className="rounded-lg border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <Link href={`/business/workflows/${workflow.id}`} className="text-lg font-black text-white hover:text-emerald-100">{workflow.name}</Link>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">{workflow.description}</p>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                  <span className="rounded-md bg-white/[0.06] px-2 py-1">Agent: {AGENT_REGISTRY[workflow.agentType].name}</span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1">Trigger: {workflow.trigger}</span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1">Version {workflow.version}</span>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1">{workflow.status}</span>
                </div>
              </div>
              <div className="w-full max-w-sm space-y-2">
              {workflow.inputs.map((input) => <label key={input.key} className="block text-xs font-semibold text-slate-300">{input.label}<input aria-label={input.label} value={workflowInputs[workflow.id]?.[input.key] ?? ''} onChange={(event) => setWorkflowInputs((current) => ({ ...current, [workflow.id]: { ...current[workflow.id], [input.key]: event.target.value } }))} placeholder={input.key === 'leadUrl' ? 'example.com' : input.label} className="mt-1 w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-sm text-white placeholder:text-slate-500" /></label>)}
              <button type="button" disabled={workflow.status !== 'ACTIVE' || runningWorkflowId === workflow.id || workflow.inputs.some((input) => input.required && !(workflowInputs[workflow.id]?.[input.key] ?? '').trim())} onClick={() => onRunWorkflow(workflow.id, workflowInputs[workflow.id] ?? {})} className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
                <Play className="h-4 w-4" />
                {runningWorkflowId === workflow.id ? 'Running…' : mode === 'demo' ? 'Simulate Manual Run' : 'Manual Run'}
              </button>
              </div>
            </div>
          </div>
        ))}
        <h3 className="pt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Run History</h3>
        {visibleRuns.map((run) => <RunHistoryCard key={run.id} run={run} hasFinding={findings.some((finding) => finding.workflowRunId === run.id)} />)}
        {orderedRuns.length > 8 && <button type="button" onClick={() => setShowOlderRuns((current) => !current)} className="w-fit rounded-md border border-white/15 px-4 py-2 text-sm font-black text-white">{showOlderRuns ? 'Show recent runs' : `Show older runs (${orderedRuns.length - 8})`}</button>}
        <h3 id="lead-qualifications" className="scroll-mt-6 pt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Lead Qualifications</h3>
        {qualificationGroups.map((group) => <QualificationGroup key={group.key} group={group} runs={orderedRuns} />)}
      </div>
    </Panel>
  )
}

function RunHistoryCard({ run, hasFinding }: { run: WorkflowRun; hasFinding: boolean }) {
  const ai = run.resultMetadata?.ai && typeof run.resultMetadata.ai === 'object' ? run.resultMetadata.ai as Record<string, unknown> : undefined
  const prospect = runProspectUrl(run)
  return <div className="rounded-lg border border-white/10 bg-black/20 p-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{prospect ? 'Prospect' : 'Workflow run'}</p><strong className="mt-1 block text-base text-white">{runProspectLabel(run)}</strong></div><StatusBadge status={run.status} tone={run.status === 'WAITING_FOR_APPROVAL' ? 'amber' : run.status === 'FAILED' ? 'red' : run.status === 'COMPLETED' ? 'green' : 'cyan'} /></div>
    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-400"><span>Started {formatDashboardTime(run.startedAt)}</span><span>{run.completedAt ? `Completed ${formatDashboardTime(run.completedAt)}` : run.status === 'WAITING_FOR_APPROVAL' ? 'Waiting for approval' : 'In progress'}</span>{Boolean(ai?.provider) && <span>{ai?.provider === 'mock' ? 'Mock AI · Mock test result' : `${String(ai?.provider)} · ${String(ai?.model ?? 'model unavailable')}`}</span>}</div>
    {run.resultSummary && <p className="mt-3 text-sm text-slate-300">{run.resultSummary}</p>}
    {hasFinding && <a href="#lead-qualifications" className="mt-3 inline-block text-sm font-black text-emerald-200 hover:text-emerald-100">View result</a>}
  </div>
}

function QualificationGroup({ group, runs }: { group: ReturnType<typeof groupLeadQualifications>[number]; runs: WorkflowRun[] }) {
  const [expanded, setExpanded] = useState(false)
  const runById = new Map(runs.map((run) => [run.id, run]))
  const latestRun = group.latest.workflowRunId ? runById.get(group.latest.workflowRunId) : undefined
  return <div className="space-y-3">
    <LeadQualification finding={group.latest} run={latestRun} />
    <div className="flex flex-wrap items-center gap-3 px-1 text-xs text-slate-400"><span>Latest {formatDashboardTime(group.latest.createdAt)}</span>{group.history.length > 1 && <button type="button" onClick={() => setExpanded((current) => !current)} className="font-black text-emerald-200">{expanded ? 'Hide history' : `History (${group.history.length})`}</button>}</div>
    {expanded && <div className="divide-y divide-white/10 rounded-lg border border-white/10 bg-black/20 px-4">{group.history.map((finding) => { const run = finding.workflowRunId ? runById.get(finding.workflowRunId) : undefined; const score = finding.structuredData?.fitScore; return <div key={finding.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><span>{new Date(finding.createdAt).toLocaleString()} · Fit {String(score ?? '—')}</span><StatusBadge status={run?.status ?? finding.status} tone={run?.status === 'WAITING_FOR_APPROVAL' ? 'amber' : run?.status === 'FAILED' ? 'red' : 'slate'} /></div> })}</div>}
  </div>
}

function LeadQualification({ finding, run }: { finding: AgentFinding; run?: WorkflowRun }) {
  const result = finding.structuredData ?? {}
  const list = (key: string) => Array.isArray(result[key]) ? (result[key] as string[]) : []
  const ai = result.ai && typeof result.ai === 'object' ? result.ai as Record<string, unknown> : run?.resultMetadata?.ai as Record<string, unknown> | undefined
  return <div className="rounded-lg border border-emerald-300/20 bg-emerald-300/[0.06] p-5">
    <div className="flex flex-wrap justify-between gap-2"><h4 className="text-lg font-black">{String(result.company ?? finding.title)}</h4><StatusBadge status={run?.status ?? finding.status} tone={run?.status === 'WAITING_FOR_APPROVAL' ? 'amber' : 'green'} /></div>
    {run?.status === 'WAITING_FOR_APPROVAL' && <p className="mt-2 text-sm font-semibold text-amber-100">Research completed — next action requires approval.</p>}
    <div className="mt-4 grid gap-3 sm:grid-cols-2"><Metric label="Fit score" value={String(result.fitScore ?? '—')} /><Metric label="Confidence" value={typeof result.confidence === 'number' ? `${Math.round(result.confidence * 100)}%` : '—'} /></div>
    {[['Reasons', list('reasons')], ['Evidence', list('evidence')], ['Likely needs', list('likelyNeeds')], ['Risks', list('risks')]].map(([label, values]) => <div key={label as string} className="mt-4"><strong className="text-sm">{label as string}</strong><ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-300">{(values as string[]).map((value) => <li key={value}>{value}</li>)}</ul></div>)}
    <p className="mt-4 text-sm"><strong>Recommended next action:</strong> {String(result.recommendedNextAction ?? '')}</p><p className="mt-2 text-sm"><strong>Outreach angle:</strong> {String(result.suggestedOutreachAngle ?? '')}</p>
    {ai && (ai.provider === 'mock' || ai.aiMode === 'mock' || ai.mode === 'mock' ? <p className="mt-4 text-xs font-semibold text-cyan-100">Mock AI · Mock test result · No external model call</p> : <div className="mt-4 grid gap-1 rounded-md border border-white/10 bg-black/20 p-3 text-xs text-slate-400 sm:grid-cols-2"><p>AI provider: {String(ai.provider)}</p><p>Model: {String(ai.model)}</p><p>Input tokens: {String(ai.tokensIn ?? 0)}</p><p>Output tokens: {String(ai.tokensOut ?? 0)}</p><p>Latency: {String(ai.latencyMs ?? 0)}ms</p><p className="break-all">Model run ID: {String(ai.modelRunId ?? '')}</p><p>Cost tracking: Not yet calculated</p></div>)}
  </div>
}

function WorkflowDetail({ workflow, runs, onRunWorkflow, mode }: { workflow: ReturnType<typeof getBusinessWorkspaceData>['workflows'][number]; runs: WorkflowRun[]; onRunWorkflow: (id: string, input?: Record<string, unknown>) => void; mode: WorkspaceMode }) {
  const [inputs, setInputs] = useState<Record<string, string>>({})
  return (
    <div className="space-y-6">
      <Panel title={workflow.name} icon={GitBranch}>
        <p className="text-sm leading-6 text-slate-300">{workflow.description}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Metric label="Agent" value={AGENT_REGISTRY[workflow.agentType].name} />
          <Metric label="Status" value={workflow.status} />
          <Metric label="Trigger" value={workflow.schedule ?? workflow.trigger} />
          <Metric label="Approval Boundary" value={workflow.approvalPolicy.requiredForRisks.join(', ')} />
        </div>
        <div className="mt-5 max-w-md space-y-3">{workflow.inputs.map((input) => <label key={input.key} className="block text-xs font-semibold text-slate-300">{input.label}<input value={inputs[input.key] ?? ''} onChange={(event) => setInputs((current) => ({ ...current, [input.key]: event.target.value }))} className="mt-1 w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-sm text-white" /></label>)}</div>
        <button type="button" disabled={workflow.status !== 'ACTIVE' || workflow.inputs.some((input) => input.required && !(inputs[input.key] ?? '').trim())} onClick={() => onRunWorkflow(workflow.id, inputs)} className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
          <Play className="h-4 w-4" />
          {mode === 'demo' ? 'Simulate Workflow' : 'Run Workflow'}
        </button>
      </Panel>
      <Panel title="Step Definitions" icon={ClipboardCheck}>
        <div className="grid gap-3">
          {workflow.steps.map((step) => (
            <div key={step.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <strong>{step.name}</strong>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs font-semibold">{step.risk}</span>
              </div>
              <p className="mt-2 text-sm text-slate-400">{step.description}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Run Timeline" icon={Activity}>
        {runs.length ? runs.map((run) => <RunTimeline key={run.id} run={run} />) : <p className="text-sm text-slate-400">No runs for this workflow in the demo store yet.</p>}
      </Panel>
    </div>
  )
}

function Agents({ selectedProfile, setSelectedProfile, demoAgentOutput, onRunAgent, mode }: { selectedProfile: IndustryProfile; setSelectedProfile: (profile: IndustryProfile) => void; demoAgentOutput: Record<string, unknown> | null; onRunAgent: (agent: AgentType) => void; mode: WorkspaceMode }) {
  return (
    <div className="space-y-6">
      <Panel title="Industry-Tailored Agents" icon={Bot}>
        <label className="text-sm font-semibold text-slate-300" htmlFor="industry-profile">What type of company are you?</label>
        <select id="industry-profile" value={selectedProfile} onChange={(event) => setSelectedProfile(event.target.value as IndustryProfile)} className="mt-2 w-full max-w-md rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-white">
          {Object.entries(INDUSTRY_PROFILE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {Object.values(AGENT_REGISTRY).map((agent) => (
            <div key={agent.type} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-base font-black">{agent.name}</h3>
                <button type="button" onClick={() => onRunAgent(agent.type)} className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-black text-slate-950">{mode === 'demo' ? 'Simulate' : 'Demo Run'}</button>
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-300">{agent.description}</p>
              <p className="mt-3 rounded-md border border-amber-300/20 bg-amber-300/10 p-3 text-xs leading-5 text-amber-50">{getAgentIndustryInstructions(selectedProfile, agent.type)}</p>
            </div>
          ))}
        </div>
      </Panel>
      {demoAgentOutput && (
        <Panel title="Structured Agent Output" icon={FileText}>
          <pre className="overflow-auto rounded-lg bg-black/40 p-4 text-xs leading-5 text-slate-200">{JSON.stringify(demoAgentOutput, null, 2)}</pre>
        </Panel>
      )}
    </div>
  )
}

function ContextView({ data, onUploadDocument, mode }: { data: ReturnType<typeof getBusinessWorkspaceData>; onUploadDocument?: (formData: FormData) => Promise<BusinessDocumentIngestionResult>; mode: WorkspaceMode }) {
  const [uploadMessage, setUploadMessage] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [, startUploadTransition] = useTransition()
  const groups = [
    ['Company Knowledge', data.context.companyKnowledge],
    ['Operational Context', data.context.operationalContext],
    ['People & Access', data.context.peopleAndAccess],
    ['AI Operational Memory', data.context.aiOperationalMemory],
  ] as const
  const documentCount = data.documents?.length ?? 0
  const chunkCount = data.documentChunks?.length ?? 0

  function uploadDocument(formData: FormData) {
    if (!onUploadDocument) return
    setUploadError(null)
    setUploadMessage(null)
    startUploadTransition(async () => {
      try {
        const result = await onUploadDocument(formData)
        setUploadMessage(`${result.document.title} indexed into ${result.chunks.length} chunks.`)
      } catch (error) {
        setUploadError(error instanceof Error ? error.message : 'Unable to upload document.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <Panel title="Document Ingestion" icon={UploadCloud}>
        <div className="grid gap-4 xl:grid-cols-[0.8fr_1.2fr]">
          <form action={uploadDocument} className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
            <input name="title" placeholder="Document title" className="rounded-md border border-white/10 bg-[#0b1117] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <input name="source" placeholder="Source, e.g. Customer success playbook" className="rounded-md border border-white/10 bg-[#0b1117] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <input name="sourceUrl" placeholder="Source URL (optional)" className="rounded-md border border-white/10 bg-[#0b1117] px-3 py-2 text-sm text-white placeholder:text-slate-500" />
            <input name="file" type="file" accept=".txt,.md,.mdx,.csv,.json,.html,.htm" disabled={mode === 'demo'} className="rounded-md border border-white/10 bg-[#0b1117] px-3 py-2 text-sm text-slate-300 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-400 file:px-3 file:py-1.5 file:text-sm file:font-black file:text-slate-950 disabled:opacity-60" />
            <button type="submit" disabled={mode === 'demo' || !onUploadDocument} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">
              <UploadCloud className="h-4 w-4" />
              Upload & Index
            </button>
            {uploadMessage && <p className="text-sm text-emerald-100">{uploadMessage}</p>}
            {uploadError && <p className="text-sm text-rose-100">{uploadError}</p>}
            {mode === 'demo' && <p className="text-xs leading-5 text-slate-500">Uploads are disabled in the public demo workspace.</p>}
          </form>
          <div className="grid gap-3 md:grid-cols-3">
            <Metric label="Stored Documents" value={String(documentCount)} />
            <Metric label="Indexed Chunks" value={String(chunkCount)} />
            <Metric label="Vector Dimensions" value="384" />
          </div>
        </div>
      </Panel>

      <Panel title="Shared Business Memory" icon={Database}>
        <p className="mb-5 text-sm leading-6 text-slate-300">AIBeat owns and governs company memory. Model providers only receive tenant-filtered context payloads with provenance, source metadata, and retrieved document chunks.</p>
        <div className="grid gap-4 lg:grid-cols-2">
          {groups.map(([title, items]) => (
            <div key={title} className="rounded-lg border border-white/10 bg-black/20 p-4">
              <h3 className="font-black">{title}</h3>
              <div className="mt-3 space-y-3">
                {items.length ? items.map((item) => (
                  <div key={item.id} className="rounded-md bg-white/[0.04] p-3">
                    <div className="flex items-start justify-between gap-2">
                      <strong className="text-sm">{item.title}</strong>
                      <span className="text-xs text-slate-500">{item.sourceDate ?? item.sourceType ?? 'No date'}</span>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{item.content}</p>
                    <p className="mt-2 text-xs text-slate-500">Provenance: {item.provenance}</p>
                  </div>
                )) : <p className="text-sm text-slate-500">Prepared domain; no demo items yet.</p>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function AIStack({ data, onTestAIConnection }: { data: ReturnType<typeof getBusinessWorkspaceData>; onTestAIConnection?: () => Promise<{ ok: boolean; message: string; latencyMs?: number }> }) {
  const [health, setHealth] = useState<{ ok: boolean; message: string; latencyMs?: number } | null>(null)
  const [testing, setTesting] = useState(false)
  async function testConnection() { if (!onTestAIConnection || testing) return; setTesting(true); try { setHealth(await onTestAIConnection()) } catch { setHealth({ ok: false, message: 'AI connection test could not be completed.' }) } finally { setTesting(false) } }
  return (
    <Panel title="AI Stack & Spend Intelligence" icon={CircleDollarSign}>
      <div className="mb-5 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-black uppercase tracking-[0.14em] text-cyan-100">AI Runtime</p><h3 className="mt-2 text-xl font-black">{data.aiRuntime.mode === 'live' ? 'Live AI' : 'Mock AI'}</h3><div className="mt-3 grid gap-1 text-sm text-slate-300"><p>Provider: {data.aiRuntime.provider === 'gemini' ? 'Gemini' : 'Mock'}</p><p>Model: {data.aiRuntime.model}</p><p>Status: {data.aiRuntime.configured ? 'Ready' : 'Configuration required'}</p>{data.aiRuntime.mode === 'mock' && <><p>Cost: $0</p><p>External AI calls: Disabled</p></>}</div></div>
        {onTestAIConnection && (data.viewerRole === 'OWNER' || data.viewerRole === 'ADMIN') && <button type="button" disabled={testing} onClick={() => void testConnection()} className="rounded-md bg-cyan-300 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700">{testing ? 'Testing…' : 'Test AI connection'}</button>}</div>
        {health && <p className={`mt-4 rounded-md p-3 text-sm ${health.ok ? 'bg-emerald-300/10 text-emerald-100' : 'bg-rose-300/10 text-rose-100'}`}>{health.message}{health.latencyMs != null ? ` (${health.latencyMs}ms)` : ''}</p>}
      </div>
      <div className="mb-5 grid gap-3 md:grid-cols-4">
        <Metric label="Monthly Spend" value={money.format(data.spend.monthlySpend)} />
        <Metric label="Low-use Seats" value={String(data.spend.lowUseSeats)} />
        <Metric label="Unapproved Tools" value={String(data.spend.unapprovedTools)} />
        <Metric label="Potential Savings" value={money.format(data.spend.potentialSavings)} />
      </div>
      <div className="overflow-hidden rounded-lg border border-white/10">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="bg-white/[0.06] text-xs uppercase tracking-[0.12em] text-slate-400">
            <tr><th className="p-3">Tool</th><th>Category</th><th>Owner</th><th>Cost</th><th>Seats</th><th>Status</th><th>Usage</th></tr>
          </thead>
          <tbody>
            {data.tools.map((tool) => (
              <tr key={tool.id} className="border-t border-white/10">
                <td className="p-3 font-semibold">{tool.toolName}</td><td>{tool.category}</td><td>{tool.owner}</td><td>{money.format(tool.monthlyCost)}</td><td>{tool.activeSeats}/{tool.seatsPurchased}</td><td>{tool.status}</td><td>{tool.usageLevel}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  )
}

function Recommendations({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  return (
    <Panel title="AI Recommendations" icon={TrendingUp}>
      <div className="grid gap-4">
        {data.recommendations.map((recommendation) => (
          <div key={recommendation.id} className="rounded-lg border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black">{recommendation.title}</h3>
              <span className="rounded-md bg-cyan-300/10 px-2 py-1 text-xs font-semibold text-cyan-100">{recommendation.type}</span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300">{recommendation.rationale}</p>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <Metric label="Estimated Monthly Savings" value={money.format(recommendation.estimatedMonthlySavings ?? 0)} />
              <Metric label="Confidence" value={`${Math.round(recommendation.confidence * 100)}%`} />
              <Metric label="Related Capability" value={recommendation.relatedAgentType ? AGENT_REGISTRY[recommendation.relatedAgentType].name : 'Review'} />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Approvals({ approvals, onResolve, mode }: { approvals: Approval[]; onResolve: (approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED') => void; mode: WorkspaceMode }) {
  return (
    <Panel title="Approval Center" icon={ClipboardCheck}>
      <div className="grid gap-4">
        {approvals.map((approval) => (
          <div key={approval.id} className="rounded-lg border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-black">{approval.proposedAction}</h3>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${approval.status === 'PENDING' ? 'bg-amber-300/10 text-amber-100' : 'bg-emerald-300/10 text-emerald-100'}`}>{approval.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">{approval.generatedContent}</p>
            <div className="mt-3 grid gap-2 text-xs text-slate-400 md:grid-cols-4">
              <span>Agent: {AGENT_REGISTRY[approval.agentType].name}</span><span>System: {approval.targetSystem}</span><span>Entity: {approval.affectedEntity}</span><span>Risk: {approval.risk}</span>
            </div>
            {approval.status === 'PENDING' && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button type="button" onClick={() => onResolve(approval, 'APPROVED')} className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">{mode === 'demo' ? 'Simulate Approval' : 'Approve'}</button>
                <button type="button" onClick={() => onResolve(approval, 'EDITED')} className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950">{mode === 'demo' ? 'Simulate Edit' : 'Edit'}</button>
                <button type="button" onClick={() => onResolve(approval, 'REJECTED')} className="rounded-md bg-rose-400 px-3 py-2 text-sm font-black text-slate-950">{mode === 'demo' ? 'Simulate Rejection' : 'Reject'}</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Integrations({ data, onUpdateIntegration, mode }: { data: ReturnType<typeof getBusinessWorkspaceData>; onUpdateIntegration?: (integrationId: string, action: 'disconnect' | 'reconnect' | 'mark-expired') => Promise<IntegrationConnection>; mode: WorkspaceMode }) {
  const [connectors, setConnectors] = useState(data.connectors)
  const [, startIntegrationTransition] = useTransition()
  const pilot = connectors.filter((connector) => connector.pilotPriority <= 3)
  const remaining = connectors.filter((connector) => connector.pilotPriority > 3)

  function updateIntegration(integrationId: string, action: 'disconnect' | 'reconnect' | 'mark-expired') {
    if (!onUpdateIntegration) return
    startIntegrationTransition(async () => {
      const connection = await onUpdateIntegration(integrationId, action)
      setConnectors((current) => current.map((connector) => connector.id === integrationId ? { ...connector, connection, status: connection.status as IntegrationConnectionStatus, reconnectUrl: connection.reconnectUrl ?? connector.reconnectUrl } : connector))
    })
  }

  return (
    <Panel title="Expandable Connector Architecture" icon={Plug}>
      <div className="mb-5 grid gap-4 md:grid-cols-3">
        {pilot.map((connector) => (
          <div key={connector.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black">{connector.name}</h3>
              <StatusBadge status={formatConnectorStatus(connector.status)} tone={connector.status === 'CONNECTED' ? 'green' : connector.status === 'TOKEN_EXPIRED' || connector.status === 'RECONNECT_REQUIRED' ? 'amber' : 'slate'} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-400">{connector.description}</p>
            <p className="mt-3 text-xs text-slate-500">Capabilities: {connector.capabilities.join(', ')} · Auth: {connector.authType}</p>
            {connector.status !== 'CONNECTED' && connector.authType === 'OAUTH2' && (
              <button type="button" disabled={mode === 'demo' || !onUpdateIntegration} onClick={() => updateIntegration(connector.id, 'reconnect')} className="mt-4 inline-flex items-center gap-2 rounded-md border border-amber-300/30 px-3 py-2 text-sm font-black text-amber-50 disabled:cursor-not-allowed disabled:opacity-60">
                Reconnect
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            {connector.status === 'CONNECTED' && (
              <button type="button" disabled={mode === 'demo' || !onUpdateIntegration} onClick={() => updateIntegration(connector.id, 'disconnect')} className="mt-4 rounded-md border border-white/10 px-3 py-2 text-sm font-black text-white disabled:cursor-not-allowed disabled:opacity-60">Disconnect</button>
            )}
          </div>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {remaining.map((connector) => (
          <div key={connector.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-black">{connector.name}</h3>
              <StatusBadge status={formatConnectorStatus(connector.status)} tone={connector.status === 'CONNECTED' ? 'green' : 'slate'} />
            </div>
            <p className="mt-2 text-xs text-slate-500">{connector.description}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Reports({ data, runs, onRunEvaluations, mode }: { data: ReturnType<typeof getBusinessWorkspaceData>; runs: WorkflowRun[]; onRunEvaluations?: () => Promise<AgentEvaluationResult[]>; mode: WorkspaceMode }) {
  const [evaluations, setEvaluations] = useState(data.evaluations ?? [])
  const [, startEvaluationTransition] = useTransition()
  const avg = (key: keyof Pick<AgentEvaluationResult, 'factuality' | 'relevance' | 'duplicateRate' | 'editRate'>) => evaluations.length ? Math.round((evaluations.reduce((sum, item) => sum + Number(item[key]), 0) / evaluations.length) * 100) : 0
  const totalCost = evaluations.reduce((sum, item) => sum + item.estimatedCostUsd, 0)
  const avgLatency = evaluations.length ? Math.round(evaluations.reduce((sum, item) => sum + item.latencyMs, 0) / evaluations.length) : 0
  function runEvaluations() {
    if (!onRunEvaluations) return
    startEvaluationTransition(async () => setEvaluations(await onRunEvaluations()))
  }
  return (
    <Panel title="ROI / Performance Dashboard" icon={FileText}>
      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="AI Spend" value={`${money.format(data.roi.aiSpendMonthly)} / month`} />
        <Metric label="Potential Savings" value={`${money.format(data.roi.potentialSavingsMonthly)} / month`} />
        <Metric label="Workflows Completed" value={String(data.roi.workflowsCompleted)} />
        <Metric label="Estimated Hours Saved" value={`${data.roi.estimatedHoursSaved}h`} />
        <Metric label="Estimated Savings" value={money.format(data.roi.estimatedSavings)} />
        <Metric label="AI / Tool Cost" value={money.format(data.roi.aiToolCost)} />
        <Metric label="Workflow Success Rate" value={`${data.roi.workflowSuccessRate}%`} />
        <Metric label="Approval Rate" value={`${data.roi.approvalRate}%`} />
      </div>
      <div className="mt-6 rounded-lg border border-white/10 bg-black/20 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-black text-white">Agent Evaluation Harness</h3>
          <button type="button" disabled={mode === 'demo' || !onRunEvaluations} onClick={runEvaluations} className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">Run Evaluations</button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-6">
          <Metric label="Factuality" value={`${avg('factuality')}%`} />
          <Metric label="Relevance" value={`${avg('relevance')}%`} />
          <Metric label="Duplicate Rate" value={`${avg('duplicateRate')}%`} />
          <Metric label="Edit Rate" value={`${avg('editRate')}%`} />
          <Metric label="Eval Cost" value={`$${totalCost.toFixed(3)}`} />
          <Metric label="Latency" value={`${avgLatency}ms`} />
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {runs.map((run) => <RunTimeline key={run.id} run={run} />)}
      </div>
    </Panel>
  )
}

function Audit({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  return (
    <Panel title="Audit Log" icon={Archive}>
      <div className="space-y-3">
        {data.auditEvents.map((event) => (
          <div key={event.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong>{event.action}</strong>
              <span className="text-xs text-slate-500">{new Date(event.timestamp).toLocaleString()}</span>
            </div>
            <p className="mt-2 text-sm text-slate-400">{event.outputSummary}</p>
            <p className="mt-2 text-xs text-slate-500">Input: {event.inputSummary}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function SettingsView({
  data,
  selectedProfile,
  setSelectedProfile,
  onInviteMember,
  onUpdateMemberRole,
  mode,
}: {
  data: ReturnType<typeof getBusinessWorkspaceData>
  selectedProfile: IndustryProfile
  setSelectedProfile: (profile: IndustryProfile) => void
  onInviteMember?: (formData: FormData) => Promise<OrganizationMember>
  onUpdateMemberRole?: (memberId: string, role: Role) => Promise<OrganizationMember>
  mode: WorkspaceMode
}) {
  const [members, setMembers] = useState(data.members ?? [])
  const [, startMemberTransition] = useTransition()
  const disabled = mode === 'demo'

  function inviteMember(formData: FormData) {
    if (!onInviteMember || disabled) return
    startMemberTransition(async () => {
      const member = await onInviteMember(formData)
      setMembers((current) => [member, ...current.filter((item) => item.id !== member.id)])
    })
  }

  function updateMemberRole(memberId: string, role: Role) {
    if (!onUpdateMemberRole || disabled) return
    startMemberTransition(async () => {
      const member = await onUpdateMemberRole(memberId, role)
      setMembers((current) => current.map((item) => item.id === member.id ? member : item))
    })
  }

  return (
    <Panel title="Business Settings" icon={Settings}>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <h3 className="font-black">Industry Profile</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">Profile selection changes terminology, workflow defaults, KPI suggestions, scoring logic, and agent instructions.</p>
          <select value={selectedProfile} onChange={(event) => setSelectedProfile(event.target.value as IndustryProfile)} className="mt-4 w-full rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-white">
            {Object.entries(INDUSTRY_PROFILE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <h3 className="font-black">Security Model</h3>
          <div className="mt-3 space-y-2 text-sm text-slate-300">
            <p className="flex items-center gap-2"><Lock className="h-4 w-4 text-emerald-200" /> Server-side tenant checks</p>
            <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-200" /> OWNER, ADMIN, MANAGER, MEMBER roles</p>
            <p className="flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-amber-200" /> Approval-required actions pause workflows</p>
          </div>
        </div>
      </div>
      <div className="mt-5 rounded-lg border border-white/10 bg-black/20 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="font-black">Workspace Members</h3>
          <StatusBadge status={`${members.length} seats`} tone="cyan" />
        </div>
        <form action={inviteMember} className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_auto]">
          <input name="email" type="email" required placeholder="teammate@company.com" disabled={disabled || !onInviteMember} className="rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-sm text-white placeholder:text-slate-500 disabled:cursor-not-allowed disabled:opacity-60" />
          <select name="role" defaultValue="MEMBER" disabled={disabled || !onInviteMember} className="rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60">
            {(['ADMIN', 'MANAGER', 'MEMBER'] as Role[]).map((role) => <option key={role} value={role}>{role}</option>)}
          </select>
          <button type="submit" disabled={disabled || !onInviteMember} className="rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400">Invite</button>
        </form>
        <div className="mt-4 divide-y divide-white/10">
          {members.map((member) => (
            <div key={member.id} className="grid gap-3 py-3 md:grid-cols-[1fr_160px] md:items-center">
              <div>
                <p className="font-semibold text-white">{member.invitedEmail ?? member.userId}</p>
                <p className="mt-1 text-xs text-slate-500">{member.status ?? 'ACTIVE'}{member.invitedBy ? ` by ${member.invitedBy}` : ''}</p>
              </div>
              <select value={member.role} disabled={disabled || !onUpdateMemberRole} onChange={(event) => updateMemberRole(member.id, event.target.value as Role)} className="rounded-md border border-white/10 bg-[#101820] px-3 py-2 text-sm text-white disabled:cursor-not-allowed disabled:opacity-60">
                {(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER'] as Role[]).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>
    </Panel>
  )
}

function Timeline({ runs, approvals }: { runs: WorkflowRun[]; approvals: Approval[] }) {
  return (
    <div className="space-y-3">
      {runs.slice(0, 2).map((run) => <RunTimeline key={run.id} run={run} />)}
      {approvals.filter((approval) => approval.status === 'PENDING').map((approval) => (
        <div key={approval.id} className="rounded-lg border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
          Approval pending: {approval.proposedAction}
        </div>
      ))}
    </div>
  )
}

function RunTimeline({ run }: { run: WorkflowRun }) {
  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{run.resultSummary ?? run.id}</strong>
        <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate-300">{run.status}</span>
      </div>
      <div className="mt-4 space-y-3">
        {run.steps.map((step) => (
          <div key={step.id} className="grid gap-2 border-l border-white/10 pl-4 md:grid-cols-[160px_1fr]">
            <span className="text-xs text-slate-500">{step.startedAt ? new Date(step.startedAt).toLocaleTimeString() : 'Pending'}</span>
            <div>
              <p className="flex items-center gap-2 text-sm font-semibold"><StepIcon status={step.status} /> {step.name}</p>
              <p className="mt-1 text-xs text-slate-400">{step.outputSummary}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function StepIcon({ status }: { status: string }) {
  if (status === 'COMPLETED') return <CheckCircle2 className="h-4 w-4 text-emerald-200" />
  if (status === 'WAITING_FOR_APPROVAL') return <PauseCircle className="h-4 w-4 text-amber-200" />
  return <Activity className="h-4 w-4 text-cyan-200" />
}

function Metric({ label, value, estimate = false }: { label: string; value: string; estimate?: boolean }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 break-words text-xl font-black text-white">{value}</div>
      {estimate && <div className="mt-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Estimate</div>}
    </div>
  )
}

function StatusBadge({ status, tone = 'slate' }: { status: string; tone?: 'green' | 'amber' | 'cyan' | 'red' | 'slate' }) {
  const classes = {
    green: 'bg-emerald-300/10 text-emerald-100',
    amber: 'bg-amber-300/10 text-amber-100',
    cyan: 'bg-cyan-300/10 text-cyan-100',
    red: 'bg-rose-300/10 text-rose-100',
    slate: 'bg-white/[0.06] text-slate-300',
  }[tone]

  return <span className={`rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${classes}`}>{status}</span>
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-white/15 bg-black/10 p-5">
      <h3 className="text-sm font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  )
}

function formatDashboardTime(value?: string) {
  if (!value) return 'Not scheduled'
  if (!value.includes('T')) return value
  return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function formatConnectorStatus(value: string) {
  return value.toLowerCase().split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

function Panel({ title, icon: Icon, children, action }: { title: string; icon: typeof LayoutDashboard; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#101820] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-100"><Icon className="h-5 w-5" /></span>
          <h2 className="text-xl font-black text-white">{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </div>
  )
}

function DemoNotice() {
  return (
    <div className="mb-6 rounded-lg border border-cyan-300/20 bg-cyan-300/[0.08] p-4 text-sm leading-6 text-cyan-50">
      <strong className="font-black">Interactive demo.</strong> Growth Labs - Demo Workspace is fictional. Names, activity, integrations, workflow results, approvals, and financial metrics are simulated; no production connectors are authorized and no database mutations are performed here.
    </div>
  )
}
