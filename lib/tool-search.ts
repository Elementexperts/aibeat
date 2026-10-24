export type SearchableTool = { name: string; slug?: string; tagline: string; category: string; description?: string }

function normalize(value: string): string {
  return value.normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ')
}

export function isExactToolMatch(tool: SearchableTool, query: string): boolean {
  const q = normalize(query)
  return Boolean(q) && (normalize(tool.name) === q || (tool.slug !== undefined && normalize(tool.slug) === q))
}

// Literal keywords may occur across fields; never interpret input as a regex.
export function matchesToolSearch(tool: SearchableTool, query: string): boolean {
  const q = normalize(query)
  if (!q || isExactToolMatch(tool, q)) return true
  const text = normalize([tool.name, tool.slug ?? '', tool.tagline, tool.category, tool.description ?? ''].join(' '))
  return q.split(' ').every(keyword => text.includes(keyword))
}

export function searchTools<T extends SearchableTool>(tools: readonly T[], query: string): T[] {
  const matches = tools.filter(tool => matchesToolSearch(tool, query))
  return [...matches.filter(tool => isExactToolMatch(tool, query)), ...matches.filter(tool => !isExactToolMatch(tool, query))]
}
