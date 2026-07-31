# Reddit Community Automation

AIBeat includes a draft-first Reddit automation system for the official community, r/AIBeat.

The automation prepares Reddit-ready community posts from local AIBeat content and recurring community templates. It is intentionally conservative: scheduled runs generate drafts only by default, and live publishing requires explicit configuration.

## What It Does

- Generates scheduled community posts.
- Generates AI news roundups from local `content/articles` MDX files.
- Generates weekly AI tool discussion threads.
- Generates show-and-tell community threads.
- Rotates community questions.
- Saves every generated post as a Markdown draft.
- Checks history to avoid duplicate posts.
- Supports dry-run mode.
- Can publish through Reddit's official OAuth API when enabled and configured.
- Never automates votes, DMs, fake engagement, comments on unrelated posts, or spam.

## Supported Post Types

- `weekly-tools`
- `ai-news-roundup`
- `show-and-tell`
- `community-question`
- `manual`

## Local Commands

Generate a draft:

```bash
npm run reddit:generate -- --type weekly-tools
npm run reddit:generate -- --type ai-news-roundup --limit 5
npm run reddit:generate -- --type show-and-tell
npm run reddit:generate -- --type community-question
```

Request publishing:

```bash
npm run reddit:publish -- --type ai-news-roundup
```

Useful options:

```text
--type
--dry-run
--publish
--force
--limit
--date
```

`--force` bypasses duplicate protection. Use it only when you have reviewed the draft and understand why a similar post already exists.

## Environment Variables

Local `.env.local` and GitHub Actions can use:

```env
REDDIT_CLIENT_ID=
REDDIT_CLIENT_SECRET=
REDDIT_REFRESH_TOKEN=
REDDIT_USER_AGENT=AIBeatCommunityBot/1.0 by u/Mother_Form7041
REDDIT_SUBREDDIT=AIBeat

REDDIT_PUBLISH_ENABLED=false
REDDIT_DRY_RUN=true

AIBEAT_SITE_URL=https://aibeat.dev
```

Do not commit real secrets.

## GitHub Secrets

Add these in:

```text
Settings -> Secrets and variables -> Actions -> Secrets
```

- `REDDIT_CLIENT_ID`
- `REDDIT_CLIENT_SECRET`
- `REDDIT_REFRESH_TOKEN`
- `REDDIT_USER_AGENT`
- `REDDIT_SUBREDDIT`

## GitHub Repository Variables

Add these in:

```text
Settings -> Secrets and variables -> Actions -> Variables
```

- `REDDIT_PUBLISH_ENABLED=false`
- `AIBEAT_SITE_URL=https://aibeat.dev`

Keep `REDDIT_PUBLISH_ENABLED` disabled until Reddit authentication has been tested successfully through a manual workflow run.

## Dry-Run Mode

Dry-run mode prints a preview and saves a Markdown draft under:

```text
data/reddit/drafts/
```

Dry-run mode never posts to Reddit.

## Draft Format

Draft files include metadata and the post content:

```md
---
id: "..."
type: "weekly-tools"
subreddit: "AIBeat"
generatedAt: "..."
status: "draft"
---

# Title

...

# Body

...
```

Generated drafts from GitHub Actions are uploaded as workflow artifacts. The workflow does not commit generated drafts back to the repository.

## Direct Publishing

Publishing happens only when all of these are true:

- `REDDIT_PUBLISH_ENABLED=true`
- `REDDIT_DRY_RUN=false`
- `--publish` is used or the manual workflow input `publish=true`
- All Reddit credentials are present

If any requirement is missing, the system saves a draft and explains why publishing was skipped.

The Reddit client uses Reddit OAuth refresh-token flow. It does not use username/password login.

## Duplicate Protection

The automation stores history in:

```text
data/reddit/history.json
```

Each post gets a stable content hash based on:

- post type
- title
- body

If the same content hash already exists, the automation skips the duplicate unless `--force` is provided.

## AI News Roundups

Roundups load recent AIBeat content from local MDX files in:

```text
content/articles/
```

The loader:

- sorts newest first
- selects stories from the last seven days
- limits roundups to five stories
- uses existing titles and decks/summaries
- avoids scraping the live website
- works without an LLM

No new AI summarization dependency is added. If AIBeat later exposes a reusable summarizer, it can be connected carefully, but this implementation intentionally uses stored article metadata.

## Content Safety Rules

Draft validation rejects or flags:

- empty titles
- empty bodies
- Reddit titles over 300 characters
- more than one AIBeat.dev promotional link
- repeated paragraphs
- suspicious shortened URLs
- automatically generated affiliate-looking links
- unsupported script or iframe HTML
- aggressive promotional wording as warnings

The automation does not:

- upvote posts
- downvote posts
- manipulate engagement
- use multiple Reddit accounts
- send unsolicited DMs
- auto-comment on unrelated posts
- scrape Reddit content
- bypass moderation
- evade Reddit rate limits
- repost across unrelated subreddits

It is only for r/AIBeat.

## GitHub Actions Schedule

The workflow runs at `08:00 UTC`:

```text
Monday:
What AI tools did you discover this week?

Wednesday:
This Week in AI roundup

Friday:
Show us what you built with AI this week
```

Uzbekistan is UTC+5, so `08:00 UTC` is approximately `13:00` in Uzbekistan.

Do not create more than three automated posts per week initially.

## Troubleshooting

If publishing is skipped:

- Confirm `REDDIT_PUBLISH_ENABLED=true`.
- Confirm `REDDIT_DRY_RUN=false`.
- Confirm the workflow was manually run with `publish=true`.
- Confirm all Reddit secrets are present.
- Confirm the Reddit app is allowed to submit to r/AIBeat.
- Review `data/reddit/history.json` for duplicate skips.

If a roundup has no stories:

- Confirm recent MDX files exist in `content/articles`.
- Confirm `publishedAt` dates are within the last seven days.
- Confirm files are not marked `draft: true` or `published: false`.

If Reddit rejects a post:

- Check title length.
- Check subreddit name.
- Check Reddit app permissions.
- Check Reddit rate-limit messages.
- Review subreddit rules and moderation settings.

## Security Considerations

- Never commit Reddit client secrets or refresh tokens.
- Keep generated drafts reviewable before publishing.
- Keep scheduled runs draft-only until manual publishing has been tested.
- Use the official Reddit API only.
- Rotate Reddit credentials if they are exposed.
- Limit the Reddit app to only the access it needs.

## Reddit Policy Limitations

This automation is for community posts in the official r/AIBeat community only. It should not be used for vote manipulation, spam, unsolicited messaging, ban evasion, mass posting, or engagement manipulation.

If Reddit's current API or app review process blocks direct publishing, keep the automation in draft-only mode and publish manually.

## Manual Setup Required

Codex cannot perform the following actions without access to the owner's Reddit and GitHub settings.

### Reddit Tasks I Will Do Manually

1. Confirm that I am a moderator of r/AIBeat.
2. Review Reddit's current developer requirements.
3. Create or register the appropriate Reddit app or Devvit app.
4. Obtain the client ID, client secret, and refresh token if direct API publishing is allowed.
5. Approve the app for access to r/AIBeat if Reddit requires approval.
6. Confirm the app has permission to submit posts.
7. Find Reddit flair IDs if automated flair assignment is desired.
8. Review the first generated drafts before enabling publishing.
9. Configure Reddit AutoModerator separately if needed.
10. Continue handling moderation decisions that require human judgment.

### GitHub Tasks I Will Do Manually

1. Open the GitHub repository settings.
2. Go to Settings -> Secrets and variables -> Actions.
3. Add the required Reddit secrets.
4. Add repository variables.
5. Keep `REDDIT_PUBLISH_ENABLED=false` initially.
6. Run the GitHub Action manually in dry-run mode.
7. Download and review the generated draft artifact.
8. Enable publishing only after a successful test.
9. Review workflow permissions.
10. Protect the main branch if generated files are ever committed.

### Reddit Community Tasks I Will Do Manually

1. Create post flairs.
2. Configure user flairs.
3. Set subreddit rules.
4. Add the welcome message.
5. Configure community appearance and banner.
6. Pin the welcome post.
7. Add moderators.
8. Review reported posts.
9. Approve or remove content where context is needed.
10. Respond to community feedback.
