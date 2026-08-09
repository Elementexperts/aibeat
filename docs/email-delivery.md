# AIBeat Email Delivery

AIBeat uses two separate email paths.

## Newsletter signup

Newsletter forms use Kit through:

- `app/api/subscribe/route.ts`
- `KIT_API_KEY`
- `KIT_FORM_ID`

This adds or updates a subscriber in Kit. It does not send an admin notification email to the AIBeat owner.

## Tool submission notifications

The tool submission form uses Resend through:

- `app/api/submit/route.ts`
- `RESEND_API_KEY`
- `SUBMISSION_TO_EMAIL`
- `SUBMISSION_FROM_EMAIL`

`SUBMISSION_TO_EMAIL` is the inbox that receives new tool submission notifications. It may contain one email address or multiple comma-separated addresses.

Example:

```bash
SUBMISSION_TO_EMAIL=info@aibeat.dev,you@example.com
```

`SUBMISSION_FROM_EMAIL` must use a sender address or domain that is verified in Resend. A recommended production value is:

```bash
SUBMISSION_FROM_EMAIL=AIBeat Submissions <submissions@aibeat.dev>
```

## Vercel checklist

For production delivery, confirm these variables exist in Vercel Project Settings for the Production environment:

- `RESEND_API_KEY`
- `SUBMISSION_TO_EMAIL`
- `SUBMISSION_FROM_EMAIL`
- `KIT_API_KEY`
- `KIT_FORM_ID`

After changing any of these values, redeploy the site so the latest environment is used.

## If emails are not arriving

Check these first:

- Confirm `SUBMISSION_TO_EMAIL` points to an inbox you can actually receive.
- Confirm the `aibeat.dev` sender domain is verified in Resend.
- Check Resend logs for accepted, bounced, or rejected messages.
- Check spam, promotions, and quarantine folders.
- If using `info@aibeat.dev`, confirm mailbox hosting or forwarding is active.
- If newsletter signup succeeds but no email arrives to you, that is expected unless a separate admin notification is added.
