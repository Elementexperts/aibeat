'use client'
import { useEffect, useState } from 'react'

export function TopBar() {
  const [date, setDate] = useState('')

  useEffect(() => {
    setDate(new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    }))
  }, [])

  return (
    <div className="bg-ink text-white py-1.5 px-6 flex justify-between items-center text-[11px] font-mono">
      <div className="flex gap-4 text-ink-4">
        <span>{date}</span>
        <span>|</span>
        <span className="flex items-center gap-1.5">
          <span className="live-dot w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
          Live updates
        </span>
      </div>
      <div className="text-ink-4">
        500+ AI tools reviewed · Free forever
      </div>
    </div>
  )
}
