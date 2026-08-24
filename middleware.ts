import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import {
  isAuthenticatedBusinessPath,
  isBusinessPath,
  isPrivateBusinessPath,
  isPublicBusinessPath,
  sanitizeBusinessNext,
} from './lib/business/routes'

const CANONICAL_HOST = 'www.aibeat.dev'

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() || ''

  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  if (isBusinessPath(request.nextUrl.pathname)) {
    const response = NextResponse.next({ request })
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

    if (!isPrivateBusinessPath(request.nextUrl.pathname) && !isAuthenticatedBusinessPath(request.nextUrl.pathname)) {
      if (request.nextUrl.pathname === '/business/sign-in' || request.nextUrl.pathname === '/business/sign-up') {
        const auth = await getBusinessAuthState(request, response, supabaseUrl, supabaseKey)
        if (auth.userId && auth.hasMembership) {
          return NextResponse.redirect(new URL(sanitizeBusinessNext(request.nextUrl.searchParams.get('next')), request.url))
        }
        if (auth.userId && !auth.hasMembership) {
          return NextResponse.redirect(new URL('/business/onboarding', request.url))
        }
      }
      return response
    }

    if (!isPublicBusinessPath(request.nextUrl.pathname)) {
      const auth = await getBusinessAuthState(request, response, supabaseUrl, supabaseKey)

      if (!auth.userId) {
        return redirectToBusinessSignIn(request)
      }

      if (isAuthenticatedBusinessPath(request.nextUrl.pathname)) {
        if (auth.hasMembership && request.nextUrl.pathname === '/business/onboarding') {
          return NextResponse.redirect(new URL(sanitizeBusinessNext(request.nextUrl.searchParams.get('next')), request.url))
        }
        return response
      }

      if (!auth.hasMembership) {
        const url = new URL('/business/onboarding', request.url)
        url.searchParams.set('next', sanitizeBusinessNext(`${request.nextUrl.pathname}${request.nextUrl.search}`))
        return NextResponse.redirect(url)
      }
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
  url.search = ''
  url.searchParams.set('next', sanitizeBusinessNext(`${request.nextUrl.pathname}${request.nextUrl.search}`))
  if (error) url.searchParams.set('error', error)
  return NextResponse.redirect(url)
}

async function getBusinessAuthState(request: NextRequest, response: NextResponse, supabaseUrl?: string, supabaseKey?: string) {
  if (!supabaseUrl || !supabaseKey) {
    return { userId: null, hasMembership: false }
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
  if (!data.user) return { userId: null, hasMembership: false }

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('user_id', data.user.id)
    .eq('status', 'ACTIVE')
    .limit(1)

  return { userId: data.user.id, hasMembership: !error && Boolean(memberships?.length) }
}
