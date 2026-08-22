'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  Activity,
  AlertTriangle,
  Archive,
  Bot,
  BriefcaseBusiness,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Database,
  FileText,
  GitBranch,
  LayoutDashboard,
  Lock,
  PauseCircle,
  Play,
  Plug,
  Settings,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react'
import { AGENT_REGISTRY, executeAgentMock } from '@/lib/business/agents'
import { getBusinessWorkspaceData } from '@/lib/business/workspace'
import { getAgentIndustryInstructions, INDUSTRY_PROFILE_LABELS } from '@/lib/business/industry-profiles'
import { decideApproval, runWorkflowManual } from '@/lib/business/workflows'
import type { AgentType, Approval, IndustryProfile, WorkflowRun } from '@/lib/business/types'

type RouteKey =
  | 'dashboard'
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
  { href: '/business/workflows', label: 'Workflows', key: 'workflows', icon: GitBranch },
  { href: '/business/agents', label: 'Agents', key: 'agents', icon: Bot },
  { href: '/business/context', label: 'Context', key: 'context', icon: Database },
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

export function BusinessWorkspace({ route, workflowId }: { route: RouteKey; workflowId?: string }) {
  const data = useMemo(() => getBusinessWorkspaceData(), [])
  const [selectedProfile, setSelectedProfile] = useState<IndustryProfile>(data.organization.primaryProfile)
  const [approvals, setApprovals] = useState<Approval[]>(data.approvals)
  const [runs, setRuns] = useState<WorkflowRun[]>(data.runs)
  const [demoAgentOutput, setDemoAgentOutput] = useState<Record<string, unknown> | null>(null)
  const activeWorkflow = data.workflows.find((workflow) => workflow.id === workflowId) ?? data.workflows[0]

  function runWorkflow(id: string) {
    const workflow = data.workflows.find((candidate) => candidate.id === id)
    if (!workflow) return
    const result = runWorkflowManual(workflow, 'user-sarah')
    setRuns((current) => [result.run, ...current])
    if (result.approval) setApprovals((current) => [result.approval!, ...current])
  }

  function resolveApproval(approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED') {
    setApprovals((current) => current.map((item) => (item.id === approval.id ? decideApproval(item, decision, 'user-sarah', decision === 'EDITED' ? `${item.generatedContent}\n\nEdited by approver.` : undefined) : item)))
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
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-md border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-100">
                <BriefcaseBusiness className="h-4 w-4" />
                AIBeat Business
              </div>
              <h1 className="mt-4 text-3xl font-black tracking-tight text-white md:text-5xl">Corporate AI operating console</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 md:text-base">
                Discover, measure, govern, optimize, automate, and measure ROI from one tenant-aware workspace.
              </p>
            </div>
            <div className="grid gap-2 rounded-lg border border-white/10 bg-white/[0.04] p-4 text-sm">
              <span className="text-slate-400">Workspace</span>
              <strong>{data.organization.name}</strong>
              <span className="text-slate-400">{data.industryLabel} · {data.organization.employeeCount} employees</span>
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
                href={item.href}
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
        </aside>

        <section className="min-w-0">
          {route === 'dashboard' && <Dashboard data={data} approvals={approvals} runs={runs} onRunWorkflow={runWorkflow} />}
          {route === 'workflows' && <Workflows data={data} runs={runs} onRunWorkflow={runWorkflow} />}
          {route === 'workflow-detail' && activeWorkflow && <WorkflowDetail workflow={activeWorkflow} runs={runs.filter((run) => run.workflowId === activeWorkflow.id)} onRunWorkflow={runWorkflow} />}
          {route === 'agents' && (
            <Agents
              selectedProfile={selectedProfile}
              setSelectedProfile={setSelectedProfile}
              demoAgentOutput={demoAgentOutput}
              onRunAgent={runAgent}
            />
          )}
          {route === 'context' && <ContextView data={data} />}
          {route === 'ai-stack' && <AIStack data={data} />}
          {route === 'recommendations' && <Recommendations data={data} />}
          {route === 'approvals' && <Approvals approvals={approvals} onResolve={resolveApproval} />}
          {route === 'integrations' && <Integrations data={data} />}
          {route === 'reports' && <Reports data={data} runs={runs} />}
          {route === 'audit' && <Audit data={data} />}
          {route === 'settings' && <SettingsView selectedProfile={selectedProfile} setSelectedProfile={setSelectedProfile} />}
        </section>
      </div>
    </div>
  )
}

function Dashboard({ data, approvals, runs, onRunWorkflow }: { data: ReturnType<typeof getBusinessWorkspaceData>; approvals: Approval[]; runs: WorkflowRun[]; onRunWorkflow: (id: string) => void }) {
  const metrics = [
    ['Active Workflows', data.workflows.filter((workflow) => workflow.status === 'ACTIVE').length],
    ['Pending Approvals', approvals.filter((approval) => approval.status === 'PENDING').length],
    ['Runs This Week', runs.length + 18],
    ['Estimated Hours Saved', `${data.roi.estimatedHoursSaved}h`],
    ['AI Spend', `${money.format(data.roi.aiSpendMonthly)} / mo`],
    ['Potential Savings', `${money.format(data.roi.potentialSavingsMonthly)} / mo`],
  ]

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {metrics.map(([label, value]) => (
          <Metric key={label} label={String(label)} value={String(value)} />
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Five Core Agents" icon={Bot}>
          <div className="grid gap-3 md:grid-cols-2">
            {data.agents.map((agent) => (
              <div key={agent.type} className="rounded-lg border border-white/10 bg-black/20 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-black text-white">{agent.name}</h3>
                    <p className="mt-1 text-xs text-slate-400">{agentStats[agent.type]}</p>
                  </div>
                  <span className="rounded-md bg-emerald-300/10 px-2 py-1 text-xs font-semibold text-emerald-100">Active</span>
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-300">{agent.description}</p>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Activity" icon={Activity}>
          <Timeline runs={runs} approvals={approvals} />
        </Panel>
      </div>
      <Panel title="Workflow Templates" icon={GitBranch}>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {data.workflows.map((workflow) => (
            <div key={workflow.id} className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-black">{workflow.name}</h3>
              <p className="mt-2 min-h-16 text-xs leading-5 text-slate-400">{workflow.description}</p>
              <button
                type="button"
                disabled={workflow.status !== 'ACTIVE'}
                onClick={() => onRunWorkflow(workflow.id)}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
              >
                <Play className="h-4 w-4" />
                Run
              </button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  )
}

function Workflows({ data, runs, onRunWorkflow }: { data: ReturnType<typeof getBusinessWorkspaceData>; runs: WorkflowRun[]; onRunWorkflow: (id: string) => void }) {
  return (
    <Panel title="Structured Workflows" icon={GitBranch}>
      <div className="space-y-4">
        {data.workflows.map((workflow) => (
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
              <button type="button" disabled={workflow.status !== 'ACTIVE'} onClick={() => onRunWorkflow(workflow.id)} className="inline-flex items-center justify-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
                <Play className="h-4 w-4" />
                Manual Run
              </button>
            </div>
          </div>
        ))}
        <h3 className="pt-4 text-sm font-black uppercase tracking-[0.16em] text-slate-400">Run History</h3>
        {runs.map((run) => <RunTimeline key={run.id} run={run} />)}
      </div>
    </Panel>
  )
}

function WorkflowDetail({ workflow, runs, onRunWorkflow }: { workflow: ReturnType<typeof getBusinessWorkspaceData>['workflows'][number]; runs: WorkflowRun[]; onRunWorkflow: (id: string) => void }) {
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
        <button type="button" disabled={workflow.status !== 'ACTIVE'} onClick={() => onRunWorkflow(workflow.id)} className="mt-5 inline-flex items-center gap-2 rounded-md bg-emerald-400 px-4 py-2 text-sm font-black text-slate-950 disabled:bg-slate-700 disabled:text-slate-400">
          <Play className="h-4 w-4" />
          Run Workflow
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

function Agents({ selectedProfile, setSelectedProfile, demoAgentOutput, onRunAgent }: { selectedProfile: IndustryProfile; setSelectedProfile: (profile: IndustryProfile) => void; demoAgentOutput: Record<string, unknown> | null; onRunAgent: (agent: AgentType) => void }) {
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
                <button type="button" onClick={() => onRunAgent(agent.type)} className="rounded-md bg-emerald-400 px-3 py-1.5 text-xs font-black text-slate-950">Demo Run</button>
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

function ContextView({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  const groups = [
    ['Company Knowledge', data.context.companyKnowledge],
    ['Operational Context', data.context.operationalContext],
    ['People & Access', data.context.peopleAndAccess],
    ['AI Operational Memory', data.context.aiOperationalMemory],
  ] as const

  return (
    <Panel title="Shared Business Memory" icon={Database}>
      <p className="mb-5 text-sm leading-6 text-slate-300">AIBeat owns and governs company memory. Model providers only receive tenant-filtered context payloads with provenance and freshness metadata.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map(([title, items]) => (
          <div key={title} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <h3 className="font-black">{title}</h3>
            <div className="mt-3 space-y-3">
              {items.length ? items.map((item) => (
                <div key={item.id} className="rounded-md bg-white/[0.04] p-3">
                  <div className="flex items-start justify-between gap-2">
                    <strong className="text-sm">{item.title}</strong>
                    <span className="text-xs text-slate-500">{item.sourceDate ?? 'No date'}</span>
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
  )
}

function AIStack({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  return (
    <Panel title="AI Stack & Spend Intelligence" icon={CircleDollarSign}>
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

function Approvals({ approvals, onResolve }: { approvals: Approval[]; onResolve: (approval: Approval, decision: 'APPROVED' | 'REJECTED' | 'EDITED') => void }) {
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
                <button type="button" onClick={() => onResolve(approval, 'APPROVED')} className="rounded-md bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">Approve</button>
                <button type="button" onClick={() => onResolve(approval, 'EDITED')} className="rounded-md bg-cyan-300 px-3 py-2 text-sm font-black text-slate-950">Edit</button>
                <button type="button" onClick={() => onResolve(approval, 'REJECTED')} className="rounded-md bg-rose-400 px-3 py-2 text-sm font-black text-slate-950">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Integrations({ data }: { data: ReturnType<typeof getBusinessWorkspaceData> }) {
  return (
    <Panel title="Expandable Connector Architecture" icon={Plug}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.connectors.map((connector) => (
          <div key={connector.id} className="rounded-lg border border-white/10 bg-black/20 p-4">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-black">{connector.name}</h3>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 text-xs text-slate-300">{connector.status}</span>
            </div>
            <p className="mt-3 text-sm text-slate-400">Capabilities: {connector.capabilities.join(', ')}</p>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Reports({ data, runs }: { data: ReturnType<typeof getBusinessWorkspaceData>; runs: WorkflowRun[] }) {
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

function SettingsView({ selectedProfile, setSelectedProfile }: { selectedProfile: IndustryProfile; setSelectedProfile: (profile: IndustryProfile) => void }) {
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className="mt-2 break-words text-xl font-black text-white">{value}</div>
    </div>
  )
}

function Panel({ title, icon: Icon, children }: { title: string; icon: typeof LayoutDashboard; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#101820] p-5 shadow-2xl shadow-black/20">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-md bg-emerald-300/10 text-emerald-100"><Icon className="h-5 w-5" /></span>
        <h2 className="text-xl font-black text-white">{title}</h2>
      </div>
      {children}
    </div>
  )
}
