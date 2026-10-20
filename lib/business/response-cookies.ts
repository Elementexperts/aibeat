import type { NextResponse } from 'next/server'

export function copyBusinessCookies(source: NextResponse, target: NextResponse) {
  for (const cookie of source.cookies.getAll()) target.cookies.set(cookie)
  return target
}
