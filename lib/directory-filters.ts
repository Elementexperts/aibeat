export type DirectoryFilters = { q: string; category: string; pricing: '' | 'free' | 'freemium' | 'paid' }
export type DirectorySearchParams = Record<string, string | string[] | undefined>
type Params = URLSearchParams | DirectorySearchParams
const KEYS = ['q', 'category', 'pricing'] as const

function first(params: Params, key: string): string {
  if (params instanceof URLSearchParams) return params.get(key) ?? ''
  const value = params[key]
  return (Array.isArray(value) ? value[0] : value) ?? ''
}

export function parseDirectoryFilters(params: Params, categories: readonly string[]): DirectoryFilters {
  const category = first(params, 'category')
  const pricing = first(params, 'pricing').trim().toLowerCase()
  return {
    q: Array.from(first(params, 'q').trim()).slice(0, 200).join(''),
    category: categories.includes(category) ? category : '',
    pricing: pricing === 'free' || pricing === 'freemium' || pricing === 'paid' ? pricing : '',
  }
}

// Even invalid nonempty filter URLs stay out of the search index.
export function hasDirectoryFilterInput(params: Params): boolean {
  return KEYS.some(key => Boolean(first(params, key)))
}

export function directoryFilterHref(filters: DirectoryFilters, current: URLSearchParams, hash = ''): string {
  const params = new URLSearchParams()
  for (const key of KEYS) if (filters[key]) params.append(key, filters[key])
  current.forEach((value, key) => { if (!KEYS.includes(key as typeof KEYS[number])) params.append(key, value) })
  const query = params.toString()
  return '/directory' + (query ? '?' + query : '') + hash
}

export function directoryNavigation(currentHref: string, filters: DirectoryFilters, categories: readonly string[]) {
  const current = new URL(currentHref, 'http://localhost')
  const normalized = parseDirectoryFilters(filters, categories)
  const href = directoryFilterHref(normalized, current.searchParams, current.hash)
  if (href === current.pathname + current.search + current.hash) return null
  const previous = parseDirectoryFilters(current.searchParams, categories)
  const method = KEYS.every(key => previous[key] === normalized[key]) ? 'replace' : 'push'
  return { href, method } as const
}

export function filterDirectoryTools<T extends { name: string; tagline: string; category: string; pricingType: string }>(tools: readonly T[], filters: DirectoryFilters): T[] {
  const q = filters.q.toLowerCase()
  return tools.filter(tool =>
    (!q || [tool.name, tool.tagline, tool.category].some(value => value.toLowerCase().includes(q))) &&
    (!filters.category || tool.category === filters.category) &&
    (!filters.pricing || tool.pricingType === filters.pricing))
}
