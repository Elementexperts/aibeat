import { NextRequest, NextResponse } from 'next/server'
import { recordPublicFormSubmission } from '@/lib/public-form-submissions'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const MAX_FIELD_LENGTH = 500
const COMPANY_SIZES = new Set(['1-9', '10-19', '20-49', '50-100', '101-250', '250+'])

type EarlyAccessPayload = {
  email?: string
  company?: string
  companySize?: string
  designPartner?: boolean
  website?: string
}

function clean(value: unknown) {
  return typeof value === 'string' ? value.trim().slice(0, MAX_FIELD_LENGTH) : ''
}

export async function POST(req: NextRequest) {
  let body: EarlyAccessPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (clean(body.website)) {
    return NextResponse.json({ success: true })
  }

  const email = clean(body.email).toLowerCase()
  const company = clean(body.company)
  const companySize = clean(body.companySize)
  const designPartner = body.designPartner === true

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid work email' }, { status: 400 })
  }

  if (!company) {
    return NextResponse.json({ error: 'Enter your company name' }, { status: 400 })
  }

  if (!COMPANY_SIZES.has(companySize)) {
    return NextResponse.json({ error: 'Select a company size' }, { status: 400 })
  }

  try {
    const submissionId = await recordPublicFormSubmission({ kind: 'business_early_access', email, payload: { email, company, companySize, designPartner } })
    return NextResponse.json({ success: true, submissionId })
  } catch (error) {
    console.error('Business early access error:', error)
    return NextResponse.json({ error: 'Could not join early access right now' }, { status: 502 })
  }
}
