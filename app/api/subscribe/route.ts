import { NextRequest, NextResponse } from 'next/server'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  let email: string | undefined

  try {
    const body = await req.json()
    email = body?.email
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address' }, { status: 400 })
  }

  const apiKey = process.env.KIT_API_KEY
  const formId = process.env.KIT_FORM_ID

  if (!apiKey || !formId) {
    console.error('Missing KIT_API_KEY or KIT_FORM_ID env vars')
    return NextResponse.json({ error: 'Newsletter signup is not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`https://api.kit.com/v4/forms/${formId}/subscribers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': apiKey,
      },
      body: JSON.stringify({ email_address: email }),
    })

    if (!res.ok) {
      const detail = await res.text()
      console.error('Kit subscribe failed:', res.status, detail)
      return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Kit subscribe error:', err)
    return NextResponse.json({ error: 'Could not subscribe right now' }, { status: 502 })
  }
}
