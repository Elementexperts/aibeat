'use client'

import { useEffect, useState } from 'react'
import { TOOLS } from '@/lib/data'

export function TopBar() {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }))
  }, [])

  return (
    <div className="border-b border-[var(--aibeat-border)] bg-[var(--aibeat-card)] py-1.5 font-mono text-[11px] tracking-[0.01em] text-[var(--aibeat-text-secondary)]">
      <div className="site-shell flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-3">
          <span>{date}</span>
          <span aria-hidden="true">|</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
            AI discovery desk
          </span>
        </div>
        <div className="hidden lg:block">
          {TOOLS.length} indexed tools - daily news - founder submissions open
        </div>
      </div>
    </div>
  )
}
