'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'

const STORAGE_KEY = 'aibeat-site-theme'

type SiteTheme = 'dark' | 'light'

function applyTheme(theme: SiteTheme) {
  document.documentElement.dataset.siteTheme = theme
  document.documentElement.style.colorScheme = theme
}

export function ThemeViewToggle() {
  const [theme, setTheme] = useState<SiteTheme>('dark')

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(STORAGE_KEY)
    const initialTheme = savedTheme === 'light' ? 'light' : 'dark'
    setTheme(initialTheme)
    applyTheme(initialTheme)
  }, [])

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
    applyTheme(nextTheme)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-300/40 hover:bg-white/[0.08] hover:text-white"
      aria-label={theme === 'dark' ? 'Switch to white site preview' : 'Switch to dark site preview'}
      aria-pressed={theme === 'light'}
    >
      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="hidden sm:inline">{theme === 'dark' ? 'White' : 'Dark'}</span>
    </button>
  )
}
