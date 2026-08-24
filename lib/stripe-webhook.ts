const processedStripeEventIds = new Set<string>()

export function markStripeEventProcessed(eventId: string) {
  if (processedStripeEventIds.has(eventId)) return false
  processedStripeEventIds.add(eventId)
  return true
}
