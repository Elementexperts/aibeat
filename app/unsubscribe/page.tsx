import Link from 'next/link'
import type { Metadata } from 'next'
import { ArrowLeft, MailX } from 'lucide-react'
import { UnsubscribeForm } from '@/components/subscribe/UnsubscribeForm'

export const metadata: Metadata = {
  title: 'Unsubscribe from AIBeat Daily',
  description: 'Unsubscribe from the AIBeat Daily newsletter.',
  alternates: { canonical: '/unsubscribe' },
}

export default function UnsubscribePage() {
  return (
    <main className="max-w-3xl mx-auto border-x border-border bg-paper min-h-screen">
      <div className="font-mono text-[11px] text-ink-4 px-6 py-4 border-b border-border flex items-center gap-2">
        <Link href="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <span className="text-ink">Unsubscribe</span>
      </div>

      <section className="px-6 py-12 md:px-10 md:py-16 border-b-2 border-ink">
        <div className="w-12 h-12 border border-border flex items-center justify-center mb-7 text-beat-red">
          <MailX size={22} strokeWidth={1.8} />
        </div>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-beat-red mb-3">
          Newsletter preferences
        </p>
        <h1 className="font-serif text-4xl md:text-5xl font-black text-ink leading-tight">
          Sorry to see you go.
        </h1>
        <p className="text-sm md:text-base text-ink-3 leading-relaxed mt-5 max-w-xl">
          Enter your email to leave AIBeat Daily. A short optional comment helps us understand what was not useful.
        </p>
      </section>

      <section className="px-6 py-10 md:px-10 md:py-12">
        <UnsubscribeForm />
      </section>

      <div className="px-6 py-5 border-t border-border flex items-center justify-between flex-wrap gap-3">
        <Link href="/newsletter" className="inline-flex items-center gap-2 font-mono text-[11px] text-ink-3 hover:text-beat-red">
          <ArrowLeft size={13} /> Back to newsletter
        </Link>
        <p className="text-xs text-ink-4">Questions? <span className="font-mono">hello@aibeat.dev</span></p>
      </div>
    </main>
  )
}
