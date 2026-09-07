import { NextRequest, NextResponse } from 'next/server'
import { formatPlanPrice, getPlanById } from '@/data/founder-services'
import { verifyAibeatLink, type VerificationMethod } from '@/lib/aibeat-link-verification'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const URL_RE = /^https?:\/\/.+\..+/i
const MAX_FIELD_LENGTH = 2000

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
  submitWithoutVerification?: boolean
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

  if (plan.verificationRequired && body.submitWithoutVerification === true) {
    verificationStatus = 'Manual review requested - submitted without badge verification'
  } else if (plan.verificationRequired && verificationPageUrl) {
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
