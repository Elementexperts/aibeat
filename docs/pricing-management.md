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
| Enhanced Listing | $29 one time |
| AIBeat Spotlight | $79 one time |
| Launch Feature | $149 one time |
| Newsletter Feature | $99 per placement |
| Sponsored Article | $199 one time |
| Growth Campaign | From $349 |
| Partnership | Custom or exchange-based |

## Helpers

The pricing file exports:

- `getActivePlans()`
- `getPlansByCategory()`
- `getRecommendedPlan()`
- `getPlanById()`
- `formatPlanPrice()`

## Payment Readiness

No payment processor is currently implemented.

Workflow:

```text
request submitted
-> AIBeat review
-> manual payment link when applicable
-> payment confirmed
-> placement or campaign scheduled
```

Do not display "Buy Now" until a real checkout provider exists and has been explicitly approved.

## Free Listing Verification

Free Listing requires a public "Listed on AIBeat" badge or text link before the request can be reviewed.

This verifies website control only. It does not guarantee publication, ranking, newsletter coverage, or editorial endorsement.
