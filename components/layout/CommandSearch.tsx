'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
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
  const trigger = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const searchField = useRef<HTMLInputElement>(null)

  function closeSearch() {
    dialog.current?.close()
    setOpen(false)
    trigger.current?.focus()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (open && dialog.current && !dialog.current.open) {
      dialog.current.showModal()
      searchField.current?.focus()
    }
  }, [open])

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
        ref={trigger}
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex h-10 min-w-10 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-sm text-slate-300 transition-colors hover:border-cyan-300/40 hover:text-white"
        aria-label="Search AIBeat"
        aria-keyshortcuts="Control+K Meta+K"
        title="Search AIBeat (Ctrl or ⌘ + K)"
      >
        <Search className="h-4 w-4" />
        <span className="hidden lg:inline min-[1440px]:hidden">Search AIBeat</span>
        <kbd className="hidden whitespace-nowrap rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 xl:inline min-[1440px]:hidden">Ctrl K</kbd>
      </button>

      {open && createPortal(
        <dialog
          ref={dialog}
          className="fixed inset-0 m-0 h-full max-h-none w-full max-w-none overflow-y-auto bg-black/70 px-4 py-12 backdrop-blur-sm backdrop:bg-transparent sm:py-20"
          aria-label="Search AIBeat"
          onCancel={(event) => { event.preventDefault(); closeSearch() }}
        >
          <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[var(--aibeat-border-strong)] bg-[var(--aibeat-bg-elevated)] text-[var(--aibeat-text)] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-[var(--aibeat-border)] px-4 py-3">
              <Search className="h-5 w-5 shrink-0 text-[var(--aibeat-text-secondary)]" />
              <input
                ref={searchField}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search tools, categories, use cases, or pages"
                placeholder="Search tools, categories, use cases, or pages"
                className="min-w-0 flex-1 rounded bg-transparent text-base placeholder:text-[var(--aibeat-text-muted)]"
              />
              <button type="button" onClick={closeSearch} className="rounded-full p-2 text-[var(--aibeat-text-secondary)] hover:bg-[var(--aibeat-card)]" aria-label="Close search">
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
                      className="flex items-center justify-between gap-3 rounded-xl border border-[var(--aibeat-border)] bg-[var(--aibeat-card)] px-4 py-3 text-sm transition-colors hover:border-cyan-500"
                    >
                      <span>{result.title}</span>
                      <span className="text-xs text-[var(--aibeat-text-secondary)]">{result.type}</span>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-[var(--aibeat-border)] px-4 py-10 text-center text-sm text-[var(--aibeat-text-secondary)]">
                  No matching tools found. Try another category or search by use case.
                </div>
              )}
            </div>

            <div className="border-t border-[var(--aibeat-border)] px-4 py-3 text-xs text-[var(--aibeat-text-secondary)]">
              Trending: {TRENDING.slice(0, 3).map((item) => item.query).join(' / ')}
            </div>
          </div>
        </dialog>,
        document.body,
      )}
    </>
  )
}
