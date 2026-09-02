import { TOOLS, type Tool } from './data'

const SITE_URL = 'https://www.aibeat.dev'

export const PICTORY_PARTNER_HTML = `<div style="margin:0 20px 24px 20px;border:2px solid #111;background:#fff7e8"><div style="padding:24px 24px 10px 24px"><div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#d12f2f;font-weight:800">Featured Partner Pick</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:10px"><tbody><tr><td width="62" valign="top"><img src="https://www.google.com/s2/favicons?domain=pictory.ai&amp;sz=128" width="52" height="52" style="display:block;border-radius:10px;border:1px solid #e8dfd0;background:#fff" alt="Pictory"></td><td valign="top"><div style="font-family:Georgia,serif;font-size:25px;font-weight:700;line-height:1.15">Pictory — turn long-form content into video faster</div><div style="font-size:13px;color:#555;line-height:1.5;margin-top:5px">A practical AI video workflow for creators, marketers and lean teams that need more output from content they already have.</div></td></tr></tbody></table></div><div style="padding:8px 24px 6px 24px"><div style="font-size:13px;font-weight:700;margin-bottom:8px">Great use cases:</div><div style="font-size:13px;color:#444;line-height:1.7">✓ Turn blog posts and scripts into branded videos<br>✓ Repurpose webinars and podcasts into short social clips<br>✓ Create faceless YouTube content from text and existing media<br>✓ Extract highlights from long videos for LinkedIn, TikTok, Reels and Shorts<br>✓ Produce marketing videos without a traditional editing workflow</div></div><div style="margin:14px 24px;background:#111;color:#fff;padding:14px 16px;text-align:center"><div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#ffd66b;font-weight:700">AIBeat reader gift</div><div style="font-size:24px;font-weight:800;margin-top:3px">20% OFF Pictory</div><div style="font-size:13px;margin-top:4px">Use promo code <strong>Cpiabd20</strong></div></div><div style="padding:2px 24px 24px 24px;text-align:center"><a href="https://pictory.ai?fpr=nomoz36" style="display:inline-block;background:#d12f2f;color:#fff;text-decoration:none;padding:13px 22px;font-size:14px;font-weight:800" target="_blank">Claim 20% off Pictory →</a><div style="font-size:11px;color:#777;margin-top:10px">Pictory recommends its annual plans for the best value.</div><div style="margin-top:8px"><a href="https://www.aibeat.dev/tools/pictory" style="font-size:12px;color:#111;font-weight:700" target="_blank">Read the Pictory feature on AIBeat</a></div></div></div>`

export const PICTORY_PARTNER_TEXT = `Featured Partner Pick
Pictory — turn long-form content into video faster
A practical AI video workflow for creators, marketers and lean teams that need more output from content they already have.

Great use cases:
✓ Turn blog posts and scripts into branded videos
✓ Repurpose webinars and podcasts into short social clips
✓ Create faceless YouTube content from text and existing media
✓ Extract highlights from long videos for LinkedIn, TikTok, Reels and Shorts
✓ Produce marketing videos without a traditional editing workflow

AIBeat reader gift
20% OFF Pictory
Use promo code Cpiabd20
Claim 20% off Pictory → https://pictory.ai?fpr=nomoz36
Pictory recommends its annual plans for the best value.
Read the Pictory feature on AIBeat: https://www.aibeat.dev/tools/pictory`

export type WeeklyToolsNewsletter = { subject: string; html: string; plainText: string; selectedTools: Tool[]; key: string }

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function selectWeeklyTools(input: { tools?: Tool[]; slugs?: string[]; limit?: number } = {}) {
  const tools = input.tools ?? TOOLS
  const limit = input.limit ?? 8
  if (input.slugs?.length) {
    const bySlug = new Map(tools.map((tool) => [tool.slug, tool]))
    const selected = input.slugs.map((slug) => bySlug.get(slug)).filter((tool): tool is Tool => Boolean(tool))
    if (selected.length !== input.slugs.length) throw new Error('WEEKLY_TOOL_SLUGS contains an unknown tool slug.')
    if (selected.length !== limit) throw new Error(`Weekly tools newsletter requires exactly ${limit} tool slugs.`)
    return selected
  }
  if (tools.length < limit) throw new Error(`Weekly tools newsletter requires at least ${limit} tools.`)
  return tools.slice(-limit).reverse()
}

function weekKey(now: Date) {
  const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
  const day = date.getUTCDay() || 7
  date.setUTCDate(date.getUTCDate() + 4 - day)
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function buildWeeklyToolsNewsletter(input: { tools?: Tool[]; slugs?: string[]; now?: Date } = {}): WeeklyToolsNewsletter {
  const selectedTools = selectWeeklyTools({ tools: input.tools, slugs: input.slugs, limit: 8 })
  const rows = selectedTools.map((tool, index) => {
    const padding = index === selectedTools.length - 1 ? '6px' : '18px'
    return `<tr><td width="54" valign="top" style="padding:0 0 ${padding} 0"><img src="${escapeHtml(tool.logoUrl || `https://www.google.com/s2/favicons?domain=${new URL(tool.websiteUrl).hostname}&sz=128`)}" width="40" height="40" style="display:block;border-radius:8px;border:1px solid #eee" alt="${escapeHtml(tool.name)}"></td><td valign="top" style="padding:0 0 ${padding} 0"><a href="${SITE_URL}/tools/${encodeURIComponent(tool.slug)}" style="font-size:16px;font-weight:700;color:#111;text-decoration:none" target="_blank">${escapeHtml(tool.name)}</a><div style="font-size:13px;color:#666;line-height:1.5;margin-top:2px">${escapeHtml(tool.tagline)}</div><div style="margin-top:5px"><a href="${SITE_URL}/tools/${encodeURIComponent(tool.slug)}" style="font-size:12px;color:#d12f2f;font-weight:700;text-decoration:none" target="_blank">View on AIBeat →</a></div></td></tr>`
  }).join('')
  const toolsText = selectedTools.map((tool) => `${tool.name} — ${tool.tagline}\nView on AIBeat → ${SITE_URL}/tools/${tool.slug}`).join('\n\n')
  const html = `<div dir="ltr"><div style="margin:0;padding:0;background:#f6f6f6;font-family:Arial,Helvetica,sans-serif;color:#111111"><div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #e5e5e5"><div style="padding:26px 32px 18px 32px;border-bottom:3px solid #111111"><div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#d12f2f;font-weight:700">AIBeat Weekly</div><div style="font-family:Georgia,serif;font-size:32px;line-height:1.1;font-weight:700;margin-top:6px">Latest tools launched on AIBeat</div><div style="font-size:14px;color:#666;margin-top:8px">Fresh launches from the last 10 days — AI agents, video, image, productivity and GTM tools worth knowing.</div></div><div style="padding:24px 32px 8px 32px"><div style="font-size:12px;letter-spacing:1.4px;text-transform:uppercase;color:#777;font-weight:700;margin-bottom:16px">New in the directory</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tbody>${rows}</tbody></table></div><div style="padding:24px 32px"><a href="${SITE_URL}/directory" style="display:block;text-align:center;border:1px solid #111;padding:13px 18px;color:#111;text-decoration:none;font-size:13px;font-weight:700" target="_blank">View more tools in the AIBeat directory →</a></div>${PICTORY_PARTNER_HTML}<div style="padding:24px 32px 30px 32px;border-top:1px solid #eee;text-align:center"><div style="font-family:Georgia,serif;font-size:22px;font-weight:700">Launching an AI product?</div><div style="font-size:13px;color:#666;line-height:1.6;max-width:470px;margin:8px auto 16px auto">Get discovered by founders, builders and AI buyers through the AIBeat directory and featured placements.</div><a href="${SITE_URL}/submit" style="display:inline-block;background:#111;color:#fff;text-decoration:none;padding:13px 24px;font-size:13px;font-weight:800" target="_blank">Launch your product on AIBeat →</a></div><div style="padding:18px 32px;background:#f7f7f7;border-top:1px solid #e5e5e5;text-align:center;font-size:11px;line-height:1.6;color:#777">AIBeat — Discover • Launch • Grow with AI<br><a href="${SITE_URL}" style="color:#111" target="_blank">aibeat.dev</a><br><br><span style="color:#888">Affiliate disclosure: the Pictory link is an affiliate link. AIBeat may earn a commission if you purchase through it, at no additional cost to you.</span></div></div></div></div>`
  const plainText = `AIBeat Weekly\nLatest tools launched on AIBeat\nFresh launches from the last 10 days — AI agents, video, image, productivity and GTM tools worth knowing.\n\nNew in the directory\n\n${toolsText}\n\nView more tools in the AIBeat directory → ${SITE_URL}/directory\n\n${PICTORY_PARTNER_TEXT}\n\nLaunching an AI product?\nGet discovered by founders, builders and AI buyers through the AIBeat directory and featured placements.\nLaunch your product on AIBeat → ${SITE_URL}/submit\n\nAIBeat — Discover • Launch • Grow with AI\n${SITE_URL}\n\nAffiliate disclosure: the Pictory link is an affiliate link. AIBeat may earn a commission if you purchase through it, at no additional cost to you.`
  return { subject: `AIBeat Weekly Launches: 8 New Tools + Featured Pictory 20% Gift`, html, plainText, selectedTools, key: `aibeat-weekly-tools-${weekKey(input.now ?? new Date())}-${selectedTools.map((tool) => tool.slug).join('-')}`.slice(0, 180) }
}
