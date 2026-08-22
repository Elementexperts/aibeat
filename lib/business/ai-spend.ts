import { demoAITools, demoRecommendations, demoRoiMetrics } from './demo-data'
import { getMemberForUser } from './context'
import { assertPermission, assertTenantAccess } from './security'
import type { AIRecommendation, AIToolSubscription, ROIMetrics } from './types'

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
