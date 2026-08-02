import { config as loadEnv } from 'dotenv'
import { runDailyLeadDiscovery } from '../lib/daily-lead-discovery'

loadEnv({ path: '.env.local' })

type Args = Record<string, string | boolean>

function parseArgs(argv: string[]): Args {
  const args: Args = {}
  for (let i = 0; i < argv.length; i += 1) {
    const item = argv[i]
    if (!item.startsWith('--')) continue
    const key = item.slice(2)
    const next = argv[i + 1]
    if (!next || next.startsWith('--')) args[key] = true
    else {
      args[key] = next
      i += 1
    }
  }
  return args
}

function numberArg(args: Args, key: string): number | undefined {
  const value = args[key]
  if (typeof value !== 'string') return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  const report = await runDailyLeadDiscovery({
    dryRun: args['dry-run'] === true,
    createDrafts: args['create-drafts'] !== 'false',
    maxCandidates: numberArg(args, 'max-candidates'),
    maxLeads: numberArg(args, 'max-leads'),
    minScore: numberArg(args, 'min-score'),
  })

  console.log(JSON.stringify(report, null, 2))
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : 'Daily lead discovery failed')
  process.exitCode = 1
})
