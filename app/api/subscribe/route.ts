import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const KIT_API_BASE = 'https://api.kit.com/v4'

async function parseKitError(res: Response) {
  try {
    return await res.text()
  } catch {
    return 'Unable to read Kit error response'
  }
}

export async function POST(req: NextRequest) {
  let email: string | undefined

  try {
    const body = await req.json()
    email = body?.email
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const normalizedEmail = email?.trim().toLowerCase()

  if (!normalizedEmail || !EMAIL_RE.test(normalizedEmail)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.KIT_API_KEY
  const formId = process.env.KIT_FORM_ID

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID env vars')
    return NextResponse.json({ error: 'Newsletter signup is not configured' }, { status: 500 })
  }

  try {
    const headers = {
      'Content-Type': 'application/json',
      'X-Kit-Api-Key': apiKey,
    }

    const subscriberRes = await fetch(`${KIT_API_BASE}/subscribers`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ email_address: normalizedEmail }),
    })

    if (!subscriberRes.ok) {
      const detail = await parseKitError(subscriberRes)
      console.error('Kit subscriber upsert failed:', subscriberRes.status, detail)
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    const subscriberData = await subscriberRes.json()
    const subscriberId = subscriberData?.subscriber?.id

    if (!subscriberId) {
      console.error('Kit subscriber upsert returned no subscriber id')
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    const formRes = await fetch(`${KIT_API_BASE}/forms/${formId}/subscribers/${subscriberId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ referrer: 'https://aibeat.dev' }),
    })

    if (!formRes.ok) {
      const detail = await parseKitError(formRes)
      console.error('Kit form subscribe failed:', formRes.status, detail)
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit subscribe error:', err)
    return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
  }
}
