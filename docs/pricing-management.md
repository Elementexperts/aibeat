# Pricing Management

Founder-service pricing is managed centrally in:

```text
data/founder-services.ts
```

Do not duplicate prices across page components.

## Current Initial Pricing

| Plan | Price |
|---|---:|
| Free Listing | Free |
| Simple Placement | $1.99 one time |
| Featured Placement | $9.95 one time |
| Spotlight Pro | $29 one time |
| Launch Campaign | Custom |
| Newsletter Sponsorship | Custom |
| Sponsored Article | $199 one time |
| Growth Campaign | From $349 |
| Partnership | Custom or exchange-based |

## Helpers

The pricing file exports:

- `getActivePlans()`
- `getPlansByCategory()`
- `getRecommendedPlan()`
- `getPlanById()`
- `getSubmissionPlans()`
- `getPaidSubmissionPlans()`
- `formatPlanPrice()`

## Payment Readiness

Stripe Checkout is implemented for the three self-service paid listing packages.

Workflow:

```text
request submitted
-> AIBeat review
-> Stripe Checkout when a paid listing package is selected
-> webhook-verified payment received
-> placement or campaign scheduled
```

Do not accept client-supplied amounts or arbitrary Stripe Price IDs. The browser sends only an allowed plan key, and the server resolves the Price ID from environment variables.

## Free Listing Verification

Free Listing requires a public "Listed on AIBeat" badge or text link before the request can be reviewed.

This verifies website control only. It does not guarantee publication, ranking, newsletter coverage, or editorial endorsement.
