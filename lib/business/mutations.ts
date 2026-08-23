import { archiveBusinessContextItem, createBusinessContextItem, updateBusinessContextItem } from './context'
import { businessStore } from './store'
import { getWorkflow, runWorkflowManual, updateWorkflow as updateWorkflowRecord } from './workflows'
import type { AIRecommendation, AIToolSubscription, BusinessContextItem, WorkflowDefinition } from './types'

export interface BusinessMutationActor {
  userId: string
  organizationId: string
}

export function createContext(actor: BusinessMutationActor, input: Omit<BusinessContextItem, 'id' | 'organizationId' | 'createdAt' | 'humanVerified'> & { humanVerified?: boolean }) {
  validateString(input.title, 'title')
  validateString(input.content, 'content')
  return businessStore.createBusinessContextItem(actor, input)
}

export function updateContext(actor: BusinessMutationActor, itemId: string, patch: Partial<BusinessContextItem>) {
  validateString(itemId, 'itemId')
  return updateBusinessContextItem(actor, itemId, patch)
}

export function archiveContext(actor: BusinessMutationActor, itemId: string) {
  validateString(itemId, 'itemId')
  return archiveBusinessContextItem(actor, itemId)
}

export function createWorkflow(actor: BusinessMutationActor, input: Omit<WorkflowDefinition, 'id' | 'organizationId'>) {
  validateString(input.name, 'name')
  return businessStore.createWorkflow(actor, input)
}

export function updateWorkflow(actor: BusinessMutationActor, workflowId: string, patch: Partial<WorkflowDefinition>) {
  validateString(workflowId, 'workflowId')
  return updateWorkflowRecord(actor.organizationId, workflowId, patch, actor.userId)
}

export function pauseWorkflow(actor: BusinessMutationActor, workflowId: string) {
  return updateWorkflow(actor, workflowId, { status: 'PAUSED' })
}

export function resumeWorkflow(actor: BusinessMutationActor, workflowId: string) {
  return updateWorkflow(actor, workflowId, { status: 'ACTIVE' })
}

export function runWorkflow(actor: BusinessMutationActor, workflowId: string, idempotencyKey?: string) {
  validateString(workflowId, 'workflowId')
  const workflow = getWorkflow(actor.organizationId, workflowId, actor.userId)
  return businessStore.runWorkflow(actor, workflow.id, { idempotencyKey })
}

export function approveAction(actor: BusinessMutationActor, approvalId: string) {
  validateString(approvalId, 'approvalId')
  return businessStore.decideApproval(actor, approvalId, 'APPROVED')
}

export function rejectAction(actor: BusinessMutationActor, approvalId: string) {
  validateString(approvalId, 'approvalId')
  return businessStore.decideApproval(actor, approvalId, 'REJECTED')
}

export function editAndApproveAction(actor: BusinessMutationActor, approvalId: string, editedContent: string) {
  validateString(approvalId, 'approvalId')
  validateString(editedContent, 'editedContent')
  return businessStore.decideApproval(actor, approvalId, 'EDITED', editedContent)
}

export function createAIStackItem(actor: BusinessMutationActor, input: Omit<AIToolSubscription, 'id' | 'organizationId'>) {
  validateString(input.toolName, 'toolName')
  return businessStore.createAIStackItem(actor, input)
}

export function updateAIStackItem(actor: BusinessMutationActor, toolId: string, patch: Partial<AIToolSubscription>) {
  validateString(toolId, 'toolId')
  return businessStore.updateAIStackItem(actor, toolId, patch)
}

export function archiveAIStackItem(actor: BusinessMutationActor, toolId: string) {
  validateString(toolId, 'toolId')
  return businessStore.updateAIStackItem(actor, toolId, { notes: 'Archived by user' })
}

export function createRecommendation(actor: BusinessMutationActor, input: Omit<AIRecommendation, 'id' | 'organizationId'>) {
  validateString(input.title, 'title')
  return businessStore.createRecommendation(actor, input)
}

function validateString(value: unknown, field: string) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Invalid ${field}`)
  }
}

export { createBusinessContextItem, updateBusinessContextItem, archiveBusinessContextItem, runWorkflowManual }

