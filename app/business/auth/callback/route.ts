import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sanitizeBusinessNext } from '@/lib/business/routes'

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const next = sanitizeBusinessNext(url.searchParams.get('next'), '/business/onboarding')
  const type = url.searchParams.get('type')

  if (!code) {
    return NextResponse.redirect(new URL('/business/sign-in?error=Authentication link is invalid or expired.', request.url))
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)
  if (error || !data.user) {
    const target = type === 'recovery' ? '/business/reset-password?error=Password reset link is invalid or expired.' : '/business/sign-in?error=Authentication link is invalid or expired.'
    return NextResponse.redirect(new URL(target, request.url))
  }

  if (type === 'recovery') {
    return NextResponse.redirect(new URL('/business/reset-password', request.url))
  }

  const { data: memberships } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', data.user.id)
    .eq('status', 'ACTIVE')
    .limit(1)

  return NextResponse.redirect(new URL(memberships?.length ? next : '/business/onboarding', request.url))
}
