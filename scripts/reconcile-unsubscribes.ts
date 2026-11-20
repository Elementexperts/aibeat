import { reconcileUnsubscribes, UnsubscribeLedger, GmailUnsubscribeMailbox } from '../lib/unsubscribe-automation'
// Intentionally no dotenv import, local credential fallback or recipient logging.
async function main() {
  if (process.env.UNSUBSCRIBE_AUTOMATION_ENABLED !== 'true') throw new Error('Automation is not enabled.')
  const summary = await reconcileUnsubscribes({
    ledger: new UnsubscribeLedger(), gmail: new GmailUnsubscribeMailbox(),
    drafts: process.env.UNSUBSCRIBE_CREATE_DRAFTS === 'true',
    repair: process.env.UNSUBSCRIBE_REPAIR_SUPPRESSIONS === 'true', limit: 25,
  })
  console.log(JSON.stringify(summary))
  if (summary.failed || summary.review) process.exitCode = 1
}
main().catch(() => { console.error('Unsubscribe reconciliation stopped. Review the private ledger; no email was sent.'); process.exitCode = 1 })
