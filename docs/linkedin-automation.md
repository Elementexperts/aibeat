# LinkedIn Daily Draft Automation

AIBeat can generate three daily LinkedIn post drafts from recent AIBeat news articles.

The workflow is intentionally draft-first:

- It reads recent MDX articles from `content/articles`.
- It writes reviewable Markdown drafts to `data/linkedin/drafts`.
- It uploads the drafts as a GitHub Actions artifact named `linkedin-daily-drafts`.
- It does not publish posts.
- It only attempts LinkedIn API draft creation when explicitly enabled.

## Workflow

GitHub Actions workflow:

```text
.github/workflows/linkedin-drafts.yml
```

Triggers:

- daily at `18:30 UTC`;
- manually through `workflow_dispatch`.

The 18:30 UTC schedule is intentionally after the 18:00 UTC daily news run, giving the news automation time to create and push the newest article. With the default one-day lookback, it should use the three articles created by the 07:00, 12:00, and 18:00 UTC news runs.

## Local Command

```bash
npm run linkedin:drafts
```

This runs in dry-run mode and creates local Markdown drafts only.

## Repository Variables

```text
AIBEAT_SITE_URL=https://www.aibeat.dev
LINKEDIN_VERSION=202604
LINKEDIN_DAILY_DRAFT_COUNT=3
LINKEDIN_ARTICLE_LOOKBACK_DAYS=1
LINKEDIN_TONE=humanized
```

Supported tone values:

```text
humanized
founder
editorial
```

## Repository Secrets

```text
LINKEDIN_ACCESS_TOKEN
LINKEDIN_CLIENT_ID
LINKEDIN_CLIENT_SECRET
LINKEDIN_REFRESH_TOKEN
LINKEDIN_AUTHOR_URN
```

`LINKEDIN_AUTHOR_URN` should be the profile or organization author URN that your approved LinkedIn app can create content for, for example:

```text
urn:li:person:...
urn:li:organization:...
```

If `LINKEDIN_CLIENT_ID`, `LINKEDIN_CLIENT_SECRET`, and `LINKEDIN_REFRESH_TOKEN` are present, the workflow refreshes a temporary access token at the start of the run. The refreshed access token is used only during that GitHub Actions run and is not written back to the repository.

## Safe Toggles

Default behavior:

```text
LINKEDIN_DRY_RUN=true
LINKEDIN_CREATE_DRAFTS_ENABLED=false
```

With these defaults, the workflow only creates GitHub artifact drafts.

To attempt LinkedIn API draft creation from the manual workflow:

```text
dry_run=false
create_linkedin_drafts=true
```

To discover the personal profile author URN without exposing tokens:

```text
resolve_author_urn=true
```

The workflow will refresh the token, call LinkedIn `/v2/userinfo` first, fall back to `/v2/me` when available, and print only:

```text
linkedInAuthorUrn: urn:li:person:...
```

Copy that value into the GitHub secret:

```text
LINKEDIN_AUTHOR_URN
```

The new LinkedIn workflow creates API drafts with:

```text
lifecycleState: DRAFT
feedDistribution: MAIN_FEED
```

It does not schedule or publish posts.

`MAIN_FEED` is used so LinkedIn treats the draft as an organic member post. `NONE` is reserved for Direct Sponsored Content/dark-share style posts and requires an ad account context.

## Important API Note

LinkedIn's official Posts API supports creating posts through the versioned `/rest/posts` endpoint and requires:

```text
Linkedin-Version
X-Restli-Protocol-Version: 2.0.0
```

The API documentation clearly covers post creation and published lifecycle examples. Draft support and where drafts appear in the LinkedIn product can vary by account, author type, and approved API access. For that reason, AIBeat always saves local review drafts and treats LinkedIn API draft creation as optional.

## Image Handling

Each draft keeps the article image URL and image source URL when available.

The first version mentions the image/source reference in the draft instead of uploading media. This avoids adding image upload complexity until the LinkedIn draft endpoint behavior is confirmed for the account.

## Older Daily News LinkedIn Safety

The older `scripts/fetch-and-post.ts` LinkedIn publisher is now guarded by:

```text
LINKEDIN_PUBLISH_ENABLED=true
```

`LINKEDIN_ACCESS_TOKEN` alone is not enough to publish.
