import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.aibeat.dev'
const PUBLIC_BUSINESS_PATHS = new Set(['/business', '/business/ai-spend-calculator'])

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() || ''

  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  if (request.nextUrl.pathname.startsWith('/business') && !PUBLIC_BUSINESS_PATHS.has(request.nextUrl.pathname)) {
    const userId = request.cookies.get('aibeat_business_user_id')?.value
    if (!userId) {
      const url = request.nextUrl.clone()
      url.pathname = '/business'
      url.searchParams.set('next', request.nextUrl.pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
