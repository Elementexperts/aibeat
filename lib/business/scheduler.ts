import type { BusinessActor, BusinessDataStore } from './store'
import type { WorkflowScheduleAttempt, WorkflowScheduleTrigger } from './types'

const DEFAULT_TIMEZONE = 'UTC'
const DEFAULT_MAX_RETRIES = 3
const LEASE_MINUTES = 5

export interface ScheduleWorkflowInput {
  workflowId: string
  schedule: string
  timezone?: string
  startFrom?: Date
  maxRetries?: number
}

export interface SchedulerTickResult {
  attempts: WorkflowScheduleAttempt[]
  completed: number
  failed: number
  deadLettered: number
}

export function upsertWorkflowSchedule(store: BusinessDataStore, actor: BusinessActor, input: ScheduleWorkflowInput): WorkflowScheduleTrigger {
  const workflow = store.getWorkflow(actor, input.workflowId)
  const organization = store.getOrganization(actor)
  const timezone = input.timezone ?? organization.timezone ?? DEFAULT_TIMEZONE
  const nextRunAt = computeNextRunAt(input.schedule, timezone, input.startFrom ?? new Date())
  const now = new Date().toISOString()
  const existing = store.scheduleTriggers.find((trigger) => trigger.organizationId === actor.organizationId && trigger.workflowId === input.workflowId)

  const trigger: WorkflowScheduleTrigger = {
    id: existing?.id ?? `trg-${workflow.id}-${Date.now()}`,
    organizationId: actor.organizationId,
    workflowId: workflow.id,
    timezone,
    schedule: input.schedule,
    nextRunAt,
    status: 'ACTIVE',
    retryCount: existing?.retryCount ?? 0,
    maxRetries: input.maxRetries ?? existing?.maxRetries ?? DEFAULT_MAX_RETRIES,
    lastRunAt: existing?.lastRunAt,
    lastError: existing?.lastError,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  }

  if (existing) {
    Object.assign(existing, trigger)
  } else {
    store.scheduleTriggers.unshift(trigger)
  }

  store.updateWorkflow(actor, workflow.id, {
    trigger: 'SCHEDULED',
    schedule: input.schedule,
    timezone,
    nextRunAt,
  })

  store.recordAuditEvent(actor, {
    eventType: 'WORKFLOW_SCHEDULED',
    entityType: 'workflow_schedule_trigger',
    entityId: trigger.id,
    summary: `Workflow scheduled: ${workflow.name} at ${input.schedule} ${timezone}`,
  })

  return trigger
}

export function runSchedulerTick(store: BusinessDataStore, actor: BusinessActor, now = new Date()): SchedulerTickResult {
  store.assertMember(actor, 'workflow:run')
  const due = store.scheduleTriggers.filter((trigger) => (
    trigger.organizationId === actor.organizationId
    && trigger.status === 'ACTIVE'
    && new Date(trigger.nextRunAt).getTime() <= now.getTime()
  ))

  const result: SchedulerTickResult = { attempts: [], completed: 0, failed: 0, deadLettered: 0 }

  for (const trigger of due) {
    const attempt = leaseTrigger(store, trigger, now)
    result.attempts.push(attempt)
    try {
      const run = store.runWorkflow(actor, trigger.workflowId, {
        idempotencyKey: `${trigger.id}:${attempt.scheduledFor}`,
      }).run
      run.scheduledTriggerId = trigger.id
      run.scheduledFor = attempt.scheduledFor
      attempt.workflowRunId = run.id
      attempt.status = 'COMPLETED'
      attempt.completedAt = new Date().toISOString()
      trigger.retryCount = 0
      trigger.lastError = undefined
      trigger.lastRunAt = now.toISOString()
      trigger.nextRunAt = computeNextRunAt(trigger.schedule, trigger.timezone, new Date(now.getTime() + 1000))
      trigger.updatedAt = new Date().toISOString()
      result.completed += 1
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scheduler failure'
      attempt.status = 'FAILED'
      attempt.error = message
      attempt.completedAt = new Date().toISOString()
      trigger.retryCount += 1
      trigger.lastError = message
      trigger.nextRunAt = retryAt(now, trigger.retryCount)
      trigger.updatedAt = new Date().toISOString()
      result.failed += 1

      if (trigger.retryCount >= trigger.maxRetries) {
        trigger.status = 'DEAD_LETTERED'
        trigger.deadLetterReason = message
        attempt.status = 'DEAD_LETTERED'
        result.deadLettered += 1
        store.recordAuditEvent(actor, {
          eventType: 'WORKFLOW_SCHEDULE_DEAD_LETTERED',
          entityType: 'workflow_schedule_trigger',
          entityId: trigger.id,
          summary: `Scheduled workflow dead-lettered after ${trigger.retryCount} attempts: ${message}`,
        })
      }
    }
  }

  return result
}

export function computeNextRunAt(schedule: string, timezone: string, from: Date): string {
  const parsed = parseSchedule(schedule)
  const zoned = getZonedParts(from, timezone)
  for (let dayOffset = 0; dayOffset < 14; dayOffset += 1) {
    const candidateDay = addUtcDays(Date.UTC(zoned.year, zoned.month - 1, zoned.day), dayOffset)
    const candidateParts = getZonedParts(new Date(candidateDay), timezone)
    if (parsed.weekdays && !parsed.weekdays.includes(candidateParts.weekday)) continue
    const candidate = zonedWallTimeToUtc({
      year: candidateParts.year,
      month: candidateParts.month,
      day: candidateParts.day,
      hour: parsed.hour,
      minute: parsed.minute,
      timezone,
    })
    if (candidate.getTime() > from.getTime()) return candidate.toISOString()
  }
  return new Date(from.getTime() + 24 * 60 * 60 * 1000).toISOString()
}

function leaseTrigger(store: BusinessDataStore, trigger: WorkflowScheduleTrigger, now: Date): WorkflowScheduleAttempt {
  const attempt: WorkflowScheduleAttempt = {
    id: `sched-attempt-${trigger.id}-${Date.now()}-${trigger.retryCount + 1}`,
    organizationId: trigger.organizationId,
    triggerId: trigger.id,
    workflowId: trigger.workflowId,
    status: 'LEASED',
    attempt: trigger.retryCount + 1,
    scheduledFor: trigger.nextRunAt,
    leasedUntil: new Date(now.getTime() + LEASE_MINUTES * 60 * 1000).toISOString(),
    createdAt: now.toISOString(),
  }
  store.scheduleAttempts.unshift(attempt)
  return attempt
}

function retryAt(now: Date, retryCount: number): string {
  const delayMinutes = Math.min(60, 2 ** Math.max(0, retryCount - 1) * 5)
  return new Date(now.getTime() + delayMinutes * 60 * 1000).toISOString()
}

function parseSchedule(schedule: string): { weekdays?: number[]; hour: number; minute: number } {
  const lower = schedule.toLowerCase()
  const time = lower.match(/(\d{1,2}):(\d{2})/)
  const hour = time ? Number(time[1]) : 9
  const minute = time ? Number(time[2]) : 0
  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  }
  if (lower.includes('weekday')) return { weekdays: [1, 2, 3, 4, 5], hour, minute }
  const weekdays = Object.entries(weekdayMap).filter(([name]) => lower.includes(name)).map(([, value]) => value)
  return { weekdays: weekdays.length ? weekdays : undefined, hour, minute }
}

function getZonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  }).formatToParts(date)
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? '0'
  return {
    year: Number(value('year')),
    month: Number(value('month')),
    day: Number(value('day')),
    weekday: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(value('weekday')),
  }
}

function zonedWallTimeToUtc(input: { year: number; month: number; day: number; hour: number; minute: number; timezone: string }): Date {
  const guess = new Date(Date.UTC(input.year, input.month - 1, input.day, input.hour, input.minute))
  const zoned = new Intl.DateTimeFormat('en-US', {
    timeZone: input.timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(guess)
  const value = (type: string) => Number(zoned.find((part) => part.type === type)?.value ?? 0)
  const drift = Date.UTC(value('year'), value('month') - 1, value('day'), value('hour'), value('minute')) - guess.getTime()
  return new Date(guess.getTime() - drift)
}

function addUtcDays(epochMs: number, days: number): number {
  return epochMs + days * 24 * 60 * 60 * 1000
}
