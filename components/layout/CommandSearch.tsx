'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'
import { TOOLS, TRENDING } from '@/lib/data'

const PAGES = [
  { title: 'AI News', href: '/news', type: 'Page' },
  { title: 'Tool Directory', href: '/directory', type: 'Page' },
  { title: 'AIBeat Score', href: '/ai-score', type: 'Page' },
  { title: 'Submit a Tool', href: '/submit', type: 'Founder' },
  { title: 'Advertise', href: '/advertise', type: 'Founder' },
  { title: 'Newsletter', href: '/newsletter', type: 'Page' },
]

export function CommandSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const toolResults = TOOLS.filter((tool) => {
      if (!q) return tool.featured
      return [tool.name, tool.tagline, tool.category, tool.description].some((value) => value.toLowerCase().includes(q))
    }).slice(0, 6).map((tool) => ({ title: tool.name, href: `/tools/${tool.slug}`, type: tool.category }))

    const pageResults = PAGES.filter((page) => !q || page.title.toLowerCase().includes(q)).slice(0, 4)
    return [...toolResults, ...pageResults]
  }, [query])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 transition hover:border-cyan-300/40 hover:text-white lg:flex"
        aria-label="Search AIBeat"
      >
        <Search className="h-4 w-4" />
        <span>Search AIBeat</span>
        <span className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">Ctrl K</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/70 px-4 py-20 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Search AIBeat">
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0f14] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3">
              <Search className="h-5 w-5 text-cyan-300" />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tools, categories, use cases, or pages"
                className="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500"
              />
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Close search">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto p-3">
              {results.length > 0 ? (
                <div className="space-y-2">
                  {results.map((result) => (
                    <Link
                      key={`${result.type}-${result.href}`}
                      href={result.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 text-sm text-slate-200 transition hover:border-cyan-300/30 hover:bg-white/[0.07]"
                    >
                      <span>{result.title}</span>
                      <span className="text-xs text-slate-500">{result.type}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-white/10 px-4 py-10 text-center text-sm text-slate-400">
                  No matching tools found. Try another category or search by use case.
                </div>
              )}
            </div>

            <div className="border-t border-white/10 px-4 py-3 text-xs text-slate-500">
              Trending: {TRENDING.slice(0, 3).map((item) => item.query).join(' / ')}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
