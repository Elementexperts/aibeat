// Live content API requires next-sanity v10+ (Next.js 15+).
// This project uses Next.js 14 with ISR revalidation instead.
// This file is a stub to prevent build errors.

export const sanityFetch = async (query: string, params?: Record<string, unknown>) => {
  const { sanityClient } = await import('@/lib/sanity')
  return sanityClient.fetch(query, params ?? {})
}

export const SanityLive = () => null
