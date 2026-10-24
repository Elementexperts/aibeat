'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'
import { isExactToolMatch, searchTools, type SearchableTool } from '@/lib/tool-search'

type ToolResult = SearchableTool & { slug: string }
const SUGGESTIONS = [
  { label: 'AI agents for sales', q: 'sales' },
  { label: 'Free image tools', q: 'image', pricing: 'free' },
  { label: 'AI coding assistants', q: 'coding' },
  { label: 'Marketing automation tools', q: 'marketing automation' },
  { label: 'Research copilots', q: 'research' },
]

export function HomeToolSearch({ tools }: { tools: readonly ToolResult[] }) {
  const [query, setQuery] = useState('')
  const q = Array.from(query.trim()).slice(0, 200).join('')
  const matches = q ? searchTools(tools, q) : []
  const directoryHref = '/directory' + (q ? `?${new URLSearchParams({ q })}` : '')
  return (
    <div className="mt-8 max-w-2xl rounded-2xl border border-white/10 bg-white/[0.04] p-3 shadow-2xl">
      <form action="/directory" role="search" aria-label="Find AI tools" className="flex flex-wrap items-center gap-3 rounded-xl bg-black/30 px-4 py-3">
        <Search aria-hidden="true" className="h-5 w-5 shrink-0 text-cyan-200" />
        <label htmlFor="home-tool-search" className="sr-only">Search tools by name, category or keywords</label>
        <input id="home-tool-search" name="q" type="search" value={query} maxLength={200}
          onChange={event => setQuery(event.target.value)} aria-describedby="home-search-help"
          placeholder="Search tools, categories or keywords"
          className="min-w-0 flex-1 bg-transparent text-sm text-white placeholder:text-slate-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200" />
        <button type="submit" className="rounded-lg border border-cyan-200/30 px-3 py-2 text-sm text-cyan-100 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">Search</button>
      </form>
      <p id="home-search-help" className="sr-only">Matching tools link directly to their directory pages. Submit to see all directory results.</p>
      {q && (
        <div className="mt-3 border-t border-white/10 pt-3">
          <p role="status" className="mb-2 text-xs text-slate-300">{matches.length} matching {matches.length === 1 ? 'tool' : 'tools'}</p>
          <ul className="space-y-1">
            {matches.slice(0, 6).map(tool => (
              <li key={tool.slug}>
                <Link href={`/tools/${tool.slug}`} className="block rounded-lg p-3 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">
                  <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-white">
                    {tool.name}<span className="text-xs font-normal text-cyan-200">{isExactToolMatch(tool, q) ? 'Exact match' : tool.category}</span>
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-slate-300">{tool.tagline}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!matches.length && <p className="text-sm text-slate-300">No matching tools. Try a product name or a shorter keyword.</p>}
          <Link href={directoryHref} className="mt-3 inline-block rounded text-sm text-cyan-200 underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">View all directory results</Link>
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map(({ label, q: keyword, pricing }) => (
          <Link key={label} href={`/directory?${new URLSearchParams({ q: keyword, ...(pricing ? { pricing } : {}) })}`}
            className="rounded-full border border-white/10 px-3 py-2 text-xs text-slate-300 transition hover:border-cyan-300/40 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-200">{label}</Link>
        ))}
      </div>
    </div>
  )
}
