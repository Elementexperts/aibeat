import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.aibeat.dev'
const PUBLIC_BUSINESS_PATHS = new Set(['/business', '/business/ai-spend-calculator', '/business/sign-in'])

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() || ''

  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  if (request.nextUrl.pathname.startsWith('/business') && !PUBLIC_BUSINESS_PATHS.has(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request })
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return redirectToBusinessSignIn(request, 'Business authentication is not configured.')
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    })

    const { data } = await supabase.auth.getUser()
    if (!data.user) {
      return redirectToBusinessSignIn(request)
    }

    const { data: memberships, error: membershipError } = await supabase
      .from('organization_members')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('status', 'ACTIVE')
      .limit(1)

    if (membershipError || !memberships?.length) {
      return redirectToBusinessSignIn(request, 'No active AIBeat Business organization is available for this account.')
    }

    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}

function redirectToBusinessSignIn(request: NextRequest, error?: string) {
  const url = request.nextUrl.clone()
  url.pathname = '/business/sign-in'
  url.searchParams.set('next', `${request.nextUrl.pathname}${request.nextUrl.search}`)
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}
