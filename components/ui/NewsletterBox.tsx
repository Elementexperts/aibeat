'use client'

import { SubscribeForm } from '@/components/subscribe/SubscribeForm'

export function NewsletterBox({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`p-5 ${dark ? 'bg-ink text-white' : 'bg-paper-2 border border-border'}`}>
      <h3 className="font-serif text-xl font-bold mb-1.5 leading-tight">
        The AI Beat. Daily.
      </h3>
      <p className={`text-xs mb-4 leading-relaxed ${dark ? 'text-ink-4' : 'text-ink-3'}`}>
        Join 8,400+ founders getting AI news + top tool picks every morning. Free.
      </p>
      <SubscribeForm
        dark={dark}
        buttonLabel="Get the daily brief ->"
        className="[&_div]:flex-col [&_div]:gap-2 [&_input]:w-full [&_input]:text-xs [&_button]:w-full"
      />
      <p className={`font-mono text-[10px] mt-2 ${dark ? 'text-ink-4' : 'text-ink-4'}`}>
        Free. No spam. Unsubscribe anytime.
      </p>
    </div>
  )
}
