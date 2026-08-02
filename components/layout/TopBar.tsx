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
    <div className="border-b border-white/10 bg-black/35 px-6 py-1.5 text-[11px] font-mono text-slate-400">
      <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-4">
        <div className="flex gap-4">
          <span>{date}</span>
          <span>|</span>
          <span className="flex items-center gap-1.5">
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-cyan-300" />
            AI discovery desk
          </span>
        </div>
        <div className="hidden sm:block">
          {TOOLS.length} indexed tools Â- daily news Â- founder submissions open
        </div>
      </div>
    </div>
  )
}
