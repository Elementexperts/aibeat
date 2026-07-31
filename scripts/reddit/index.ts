import { getRedditConfig } from './config'
import { generateRedditPost } from './generate-post'
import { publishOrDraftPost } from './publish-post'
import type { CliOptions, RedditPostType } from './types'
import { formatPreview, parseDate } from './utils'

const POST_TYPES: RedditPostType[] = [
  'weekly-tools',
  'ai-news-roundup',
  'show-and-tell',
  'community-question',
  'manual',
]

function readArg(args: string[], name: string) {
  const index = args.indexOf(name)
  return index >= 0 ? args[index + 1] : undefined
}

function hasFlag(args: string[], name: string) {
  return args.includes(name)
}

export function parseCliOptions(args: string[]): CliOptions {
  const rawType = readArg(args, '--type') ?? 'weekly-tools'
  if (!POST_TYPES.includes(rawType as RedditPostType)) {
    throw new Error(`Unsupported --type "${rawType}". Use one of: ${POST_TYPES.join(', ')}`)
  }

  const limit = Number(readArg(args, '--limit') ?? '5')
  return {
    type: rawType as RedditPostType,
    dryRun: hasFlag(args, '--dry-run') ? true : undefined,
    publish: hasFlag(args, '--publish'),
    force: hasFlag(args, '--force'),
    limit: Number.isFinite(limit) && limit > 0 ? Math.min(limit, 5) : 5,
    date: readArg(args, '--date'),
  }
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2))
  const config = getRedditConfig({
    dryRun: options.dryRun ?? getRedditConfig().dryRun,
  })
  const draft = generateRedditPost({
    type: options.type,
    config,
    limit: options.limit,
    date: parseDate(options.date),
  })

  const result = await publishOrDraftPost({
    draft,
    config,
    force: options.force,
    publishRequested: options.publish,
  })

  console.log(formatPreview(draft))
  console.log('')
  console.log(result.message)
  console.log(`Draft path: ${result.draftPath}`)
  if (result.status === 'failed') process.exitCode = 1
}

if (process.argv[1]?.replace(/\\/g, '/').endsWith('/scripts/reddit/index.ts')) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err)
    process.exit(1)
  })
}
