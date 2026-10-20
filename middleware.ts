import { invitationNext } from './lib/business/invitations'
import { copyBusinessCookies } from './lib/business/response-cookies'
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAuthenticatedBusinessPath, isBusinessPath, isPrivateBusinessPath, sanitizeBusinessNext } from './lib/business/routes'
import { businessHostRoute, isBusinessDatabaseEnvironmentAllowed } from './lib/business/compatibility'
import { BUSINESS_ORG_COOKIE, loadBusinessSession } from './lib/business/session-state'

export async function middleware(request: NextRequest) {
  const route = businessHostRoute(request.headers.get('host') || '', process.env)
  if (route === 'deny') return new NextResponse('Unrecognized application environment or host.', { status: 421 })
  if (route === 'canonical') {
    const url = request.nextUrl.clone()
    url.protocol = 'https:'
    url.host = 'www.aibeat.dev'
    return NextResponse.redirect(url, 308)
  }
  let response = NextResponse.next({ request })
  const finish = (target: NextResponse) => copyBusinessCookies(response, target)
  const path = request.nextUrl.pathname
  const privatePath = isPrivateBusinessPath(path)
  const onboarding = isAuthenticatedBusinessPath(path)
  const authPage = path === '/business/sign-in' || path === '/business/sign-up'
  if (!isBusinessPath(path) || (!privatePath && !onboarding && !authPage)) return response
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    if (!isBusinessDatabaseEnvironmentAllowed(process.env)) throw new Error('Database environment mismatch')
    if (!url || !key) throw new Error('Authentication configuration unavailable')
    const client = createServerClient(url, key, { cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: values => {
        for (const { name, value } of values) request.cookies.set(name, value)
        response = copyBusinessCookies(response, NextResponse.next({ request }))
        for (const { name, value, options } of values) response.cookies.set(name, value, options)
      },
    } })
    const cookieName = process.env.AIBEAT_BUSINESS_ORG_COOKIE || BUSINESS_ORG_COOKIE
    const session = await loadBusinessSession(client, request.cookies.get(cookieName)?.value)
    const redirect = (path: string) => finish(NextResponse.redirect(new URL(path, request.url)))
    if (!session.user) {
      if (authPage) return response
      return redirect('/business/sign-in?next=' + encodeURIComponent(sanitizeBusinessNext(path + request.nextUrl.search)))
    }
    if (session.context) response.cookies.set(cookieName, session.context.organizationId, {
      httpOnly: true, sameSite: 'lax', secure: request.nextUrl.protocol === 'https:', path: '/',
    })
    else response.cookies.delete(cookieName)
    if (authPage) return redirect(invitationNext(request.nextUrl.searchParams.get('next')) ?? (session.needsOnboarding ? '/business/onboarding' : sanitizeBusinessNext(request.nextUrl.searchParams.get('next'))))
    if (path === '/business/invitations/accept') return response
    if (onboarding) {
      if (!session.needsOnboarding) return redirect('/business/dashboard')
      return response
    }
    if (!session.context) return redirect('/business/onboarding?next=' + encodeURIComponent(sanitizeBusinessNext(path + request.nextUrl.search)))
    return response
  } catch {
    return finish(new NextResponse('Unable to verify workspace access. Please try again.', { status: 503 }))
  }
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'] }
