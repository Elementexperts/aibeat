import { AGENT_REGISTRY } from './agents'
import { demoAITools, demoRecommendations, demoRoiMetrics } from './demo-data'
import { getMemberForUser } from './context'
import { assertPermission, assertTenantAccess } from './security'
import type { AIRecommendation, AIToolSubscription, OptimizationOpportunity, ROIMetrics } from './types'

export function getAIToolSubscriptions(organizationId: string, userId = 'user-sarah'): AIToolSubscription[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoAITools.filter((tool) => tool.organizationId === organizationId)
}

export function getAIRecommendations(organizationId: string, userId = 'user-sarah'): AIRecommendation[] {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')
  return demoRecommendations.filter((recommendation) => recommendation.organizationId === organizationId)
}

export function getROIMetrics(organizationId: string, userId = 'user-sarah'): ROIMetrics {
  const member = assertTenantAccess(getMemberForUser(userId, organizationId), organizationId)
  assertPermission(member, 'business:read')

  if (demoRoiMetrics.organizationId === organizationId) return demoRoiMetrics

  return {
    organizationId,
    aiSpendMonthly: 0,
    potentialSavingsMonthly: 0,
    workflowsCompleted: 0,
    estimatedHoursSaved: 0,
    estimatedSavings: 0,
    aiToolCost: 0,
    workflowSuccessRate: 0,
    approvalRate: 0,
    activeWorkflows: 0,
    activeAgents: 0,
  }
}

export function summarizeSpend(organizationId: string, userId = 'user-sarah') {
  const tools = getAIToolSubscriptions(organizationId, userId)
  const monthlySpend = tools.reduce((sum, tool) => sum + tool.monthlyCost, 0)
  const lowUseSeats = tools.reduce((sum, tool) => sum + Math.max(0, tool.seatsPurchased - tool.activeSeats), 0)
  const unapprovedTools = tools.filter((tool) => tool.status === 'UNAPPROVED').length
  const potentialSavings = getAIRecommendations(organizationId, userId).reduce((sum, recommendation) => sum + (recommendation.estimatedMonthlySavings ?? 0), 0)

  return {
    monthlySpend,
    lowUseSeats,
    unapprovedTools,
    potentialSavings,
    toolCount: tools.length,
  }
}

export function getOptimizationOpportunities(organizationId: string, userId = 'user-sarah'): OptimizationOpportunity[] {
  const tools = getAIToolSubscriptions(organizationId, userId)
  const recommendations = getAIRecommendations(organizationId, userId)
  const opportunities = recommendations.map((recommendation) => recommendationToOpportunity(recommendation, tools))
  const lowUseSeats = tools.reduce((sum, tool) => sum + Math.max(0, tool.seatsPurchased - tool.activeSeats), 0)

  if (lowUseSeats > 0) {
    opportunities.push({
      id: 'opp-low-utilization',
      organizationId,
      type: 'LOW_UTILIZATION',
      title: `${lowUseSeats} AI seats show low usage`,
      problem: 'Purchased seats are not consistently active across the approved AI stack.',
      currentStateLabel: 'Potential avoidable spend',
      currentStateValue: '$380/mo',
      recommendedCapability: 'AI Stack Intelligence',
      potentialAction: 'Review licenses and renewal risk',
      estimatedMonthlySavings: 380,
      confidence: 0.62,
      ctaLabel: 'Review AI Stack',
      ctaHref: '/business/ai-stack',
    })
  }

  return opportunities
}

function recommendationToOpportunity(recommendation: AIRecommendation, tools: AIToolSubscription[]): OptimizationOpportunity {
  const relatedTools = tools.filter((tool) => recommendation.relatedToolIds.includes(tool.id))
  const combinedSpend = relatedTools.reduce((sum, tool) => sum + tool.monthlyCost, 0)
  const relatedCapability = recommendation.relatedAgentType ? AGENT_REGISTRY[recommendation.relatedAgentType].name : 'AIBeat Business Review'

  if (recommendation.type === 'AUTOMATE_WITH_AIBEAT') {
    return {
      id: `opp-${recommendation.id}`,
      organizationId: recommendation.organizationId,
      type: 'AUTOMATION',
      title: 'Client Reporting',
      problem: recommendation.rationale,
      currentStateLabel: 'Current manual effort',
      currentStateValue: '52 hrs/month',
      recommendedCapability: relatedCapability,
      potentialAction: 'Estimated automation opportunity: 36 hrs/month',
      estimatedMonthlySavings: recommendation.estimatedMonthlySavings,
      estimatedHoursSaved: 36,
      confidence: recommendation.confidence,
      relatedAgentType: recommendation.relatedAgentType,
      relatedWorkflowTemplateId: recommendation.relatedWorkflowTemplateId,
      ctaLabel: 'Configure Workflow',
      ctaHref: recommendation.relatedWorkflowTemplateId ? `/business/workflows/${recommendation.relatedWorkflowTemplateId.replace('tpl-', 'wf-growth-')}` : '/business/workflows',
    }
  }

  if (recommendation.type === 'CONSOLIDATE') {
    return {
      id: `opp-${recommendation.id}`,
      organizationId: recommendation.organizationId,
      type: 'TOOL_OVERLAP',
      title: 'Potential overlap',
      problem: relatedTools.length ? `${relatedTools.map((tool) => tool.toolName).join(' + ')} overlaps with AIBeat workflow coverage.` : recommendation.rationale,
      currentStateLabel: 'Estimated combined spend',
      currentStateValue: combinedSpend > 0 ? `${formatMoney(combinedSpend)}/mo` : 'Needs spend review',
      recommendedCapability: relatedCapability,
      potentialAction: 'Review consolidation opportunity',
      estimatedMonthlySavings: recommendation.estimatedMonthlySavings,
      confidence: recommendation.confidence,
      relatedAgentType: recommendation.relatedAgentType,
      relatedWorkflowTemplateId: recommendation.relatedWorkflowTemplateId,
      ctaLabel: 'Review Consolidation',
      ctaHref: '/business/recommendations',
    }
  }

  return {
    id: `opp-${recommendation.id}`,
    organizationId: recommendation.organizationId,
    type: 'GOVERNANCE',
    title: recommendation.title,
    problem: recommendation.rationale,
    currentStateLabel: 'Estimated savings',
    currentStateValue: recommendation.estimatedMonthlySavings ? `${formatMoney(recommendation.estimatedMonthlySavings)}/mo` : 'Needs review',
    recommendedCapability: relatedCapability,
    potentialAction: 'Review recommendation',
    estimatedMonthlySavings: recommendation.estimatedMonthlySavings,
    confidence: recommendation.confidence,
    relatedAgentType: recommendation.relatedAgentType,
    relatedWorkflowTemplateId: recommendation.relatedWorkflowTemplateId,
    ctaLabel: 'Review Recommendation',
    ctaHref: '/business/recommendations',
  }
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}
