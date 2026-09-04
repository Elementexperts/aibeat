import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { formatPlanPrice, getPlanById } from '@/data/founder-services'
import { verifyAibeatLink, type VerificationMethod } from '@/lib/aibeat-link-verification'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+\..+/i
const MAX_FIELD_LENGTH = 2000
const SITE_URL = 'https://www.aibeat.dev'
const DEFAULT_SUBMISSION_TO_EMAIL = 'info@aibeat.dev'
const DEFAULT_SUBMISSION_FROM_EMAIL = 'AIBeat Submissions <onboarding@resend.dev>'

type SubmitPayload = {
  type?: string
  name?: string
  url?: string
  shortDescription?: string
  category?: string
  description?: string
  email?: string
  website?: string
  selectedPlan?: string
  verificationPageUrl?: string
  verificationMethod?: VerificationMethod
  contactName?: string
  company?: string
  role?: string
  country?: string
  preferredChannel?: string
  launchInterest?: string
  newsletterInterest?: string
  articleInterest?: string
  affiliateInterest?: string
  preferredTiming?: string
  notes?: string
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LENGTH) : ''
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function getSubmissionRecipients() {
  return (process.env.SUBMISSION_TO_EMAIL || DEFAULT_SUBMISSION_TO_EMAIL)
    .split(/[,\s]+/)
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
    .filter((email, index, all) => EMAIL_RE.test(email) && all.indexOf(email) === index)
}

function submissionHtml({
  type,
  name,
  url,
  category,
  description,
  email,
  selectedPlan,
  verificationPageUrl,
  verificationStatus,
}: Required<Pick<SubmitPayload, 'type' | 'name' | 'url' | 'category' | 'description' | 'email'>> & { selectedPlan: string; verificationPageUrl: string; verificationStatus: string }) {
  const safeName = escapeHtml(name)
  const safeUrl = escapeHtml(url)
  const safeDescription = escapeHtml(description)
  const rows = [
    ['Submission type', type],
    ['Tool name', name],
    ['Tool URL', `<a href="${safeUrl}" style="color:#d4380d;text-decoration:none">${safeUrl}</a>`],
    ['Category', category],
    ['Selected plan', selectedPlan],
    ['Verification page', verificationPageUrl || 'Not required or not provided'],
    ['Verification status', verificationStatus],
    ['Submitter email', email || 'Not provided'],
  ]

  return `
    <div style="margin:0;background:#f0ede8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#0a0a0a;line-height:1.5">
      <div style="max-width:680px;margin:0 auto;background:#f8f7f4;border:2px solid #0a0a0a">
        <div style="border-bottom:2px solid #0a0a0a;padding:18px 22px 14px">
          <img
            src="${SITE_URL}/aibeat-logo.png"
            width="220"
            alt="AIBeat.dev"
            style="display:block;max-width:220px;height:auto;margin-bottom:10px"
          />
          <div style="font-family:Consolas,Monaco,monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#666">
            Tool submission received
          </div>
        </div>

        <div style="padding:24px 22px 10px">
          <div style="display:inline-block;background:#d4380d;color:#fff;font-family:Consolas,Monaco,monospace;font-size:11px;font-weight:bold;letter-spacing:0.12em;text-transform:uppercase;padding:5px 8px;margin-bottom:14px">
            Review Queue
          </div>
          <h1 style="font-family:Georgia,serif;font-size:30px;line-height:1.1;margin:0 0 8px;color:#0a0a0a">
            ${safeName}
          </h1>
          <p style="margin:0 0 20px;color:#666;font-size:14px">
            A new tool was submitted through AIBeat.dev.
          </p>

          <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;margin-bottom:22px">
            ${rows.map(([label, value]) => `
              <tr>
                <td style="border:1px solid #ddd9d2;background:#f0ede8;font-family:Consolas,Monaco,monospace;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#666;width:180px;padding:10px">
                  ${escapeHtml(label)}
                </td>
                <td style="border:1px solid #ddd9d2;background:#fff;font-size:14px;color:#0a0a0a;padding:10px">
                  ${label === 'Tool URL' ? value : escapeHtml(value)}
                </td>
              </tr>
            `).join('')}
          </table>

          <div style="border-left:4px solid #d4380d;background:#fff;padding:14px 16px;margin-bottom:22px">
            <h2 style="font-family:Georgia,serif;font-size:20px;line-height:1.2;margin:0 0 8px;color:#0a0a0a">
              Why review it?
            </h2>
            <p style="white-space:pre-wrap;margin:0;color:#2d2d2d;font-size:14px">${safeDescription}</p>
          </div>

          <a
            href="${safeUrl}"
            style="display:inline-block;background:#0a0a0a;color:#fff;text-decoration:none;font-weight:bold;font-size:13px;padding:11px 16px;margin-bottom:8px"
          >
            Open submitted tool
          </a>
        </div>

        <div style="border-top:1px solid #ddd9d2;padding:16px 22px 20px;background:#f0ede8">
          <p style="margin:0 0 6px;font-family:Consolas,Monaco,monospace;font-size:11px;color:#666">
            AIBeat.dev submissions
          </p>
          <p style="margin:0;color:#666;font-size:12px">
            This notification was sent from the AIBeat submit form. Replies go to the submitter when they provided an email address.
          </p>
        </div>
      </div>
    </div>
  `
}

function submissionText({
  type,
  name,
  url,
  category,
  description,
  email,
  selectedPlan,
  verificationPageUrl,
  verificationStatus,
}: Required<Pick<SubmitPayload, 'type' | 'name' | 'url' | 'category' | 'description' | 'email'>> & { selectedPlan: string; verificationPageUrl: string; verificationStatus: string }) {
  return [
    'New AIBeat tool submission',
    '',
    `Submission type: ${type}`,
    `Tool name: ${name}`,
    `Tool URL: ${url}`,
    `Category: ${category}`,
    `Selected plan: ${selectedPlan}`,
    `Verification page: ${verificationPageUrl || 'Not required or not provided'}`,
    `Verification status: ${verificationStatus}`,
    `Submitter email: ${email || 'Not provided'}`,
    '',
    'Why review it?',
    description,
  ].join('\n')
}

export async function POST(req: NextRequest) {
  let body: SubmitPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (clean(body.website)) {
    return NextResponse.json({ success: true })
  }

  const type = clean(body.type)
  const name = clean(body.name)
  const url = clean(body.url)
  const category = clean(body.category)
  const description = clean(body.description)
  const email = clean(body.email).toLowerCase()
  const plan = getPlanById(clean(body.selectedPlan || body.type || 'free'))
  const selectedPlan = `${plan.name} (${formatPlanPrice(plan)})`
  const verificationPageUrl = clean(body.verificationPageUrl)
  const verificationMethod = body.verificationMethod === 'text' ? 'text' : 'badge'

  if (!type || !name || !url || !category || !description) {
    return NextResponse.json({ error: 'Please complete all required fields' }, { status: 400 })
  }

  if (!URL_RE.test(url)) {
    return NextResponse.json({ error: 'Enter a valid tool URL' }, { status: 400 })
  }

  if (email && !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  let verificationStatus = plan.verificationRequired ? 'Pending - not provided yet' : 'Not required'

  if (plan.verificationRequired && verificationPageUrl) {
    try {
      const verification = await verifyAibeatLink({ websiteUrl: url, verificationPageUrl, verificationMethod })
      verificationStatus = verification.ok ? 'Verified' : `Manual review needed - ${verification.reason || 'verification did not pass'}`
    } catch {
      verificationStatus = 'Manual review needed - verification check could not be completed'
    }
  }

  try {
    const submissionId = await recordPublicFormSubmission({
      kind: 'tool_submission', email,
      payload: { type, name, url, category, description, email, selectedPlan, verificationPageUrl, verificationMethod, verificationStatus },
    })
    return NextResponse.json({ success: true, submissionId })
  } catch (err) {
    console.error('Submit form error:', err)
    return NextResponse.json({ error: 'Could not submit right now' }, { status: 502 })
  }
}
