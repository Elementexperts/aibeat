import { NextRequest, NextResponse } from 'next/server'
import { verifyAibeatLink, type VerificationMethod } from '@/lib/aibeat-link-verification'

type VerifyPayload = {
  websiteUrl?: string
  verificationPageUrl?: string
  verificationMethod?: VerificationMethod
}

export async function POST(req: NextRequest) {
  let body: VerifyPayload

  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, status: 'failed', reason: 'Invalid request body.' }, { status: 400 })
  }

  if (body.verificationMethod !== 'badge' && body.verificationMethod !== 'text') {
    return NextResponse.json({ ok: false, status: 'failed', reason: 'Verification method must be badge or text.' }, { status: 400 })
  }

  if (!body.websiteUrl || !body.verificationPageUrl) {
    return NextResponse.json({ ok: false, status: 'failed', reason: 'Website URL and verification page URL are required.' }, { status: 400 })
  }

  const result = await verifyAibeatLink({
    websiteUrl: body.websiteUrl,
    verificationPageUrl: body.verificationPageUrl,
    verificationMethod: body.verificationMethod,
  })

  return NextResponse.json(result, { status: result.ok ? 200 : 422 })
}
