# Kit HTML Templates

These files are designed for Kit email layout templates and include Kit's required content/footer variables.

## Templates

1. `lead-outreach-compact.html`
   - Compact branded outreach template for tailored lead drafts.
   - Best for Product Hunt, Beta List, directory, and founder outreach.

2. `founder-services-offer.html`
   - More detailed founder services template.
   - Best for explaining feature options, Spotlight, newsletter, sponsored articles, launch use cases, and partner opportunities.

3. `aibeat-daily-news.html`
   - Editorial daily news template.
   - Best for AIBeat Daily news feed emails.

## Kit Variables Used

```text
{{ message_content }}
{{ address }}
{{ unsubscribe_link }}
```

Paste the HTML into Kit's email layout template editor. Keep `{{ message_content }}` in place so broadcasts and drafts can render their own message body inside the branded layout.
