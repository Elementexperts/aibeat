import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.aibeat.dev'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase() || ''

  if (host.endsWith('.vercel.app')) {
    const url = request.nextUrl.clone()
    url.protocol = 'https'
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
}
