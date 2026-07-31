type BannerVariant = 'pulse' | 'editorial' | 'global' | 'tools' | 'funding'

type NewsBannerProps = {
  category?: string
  title?: string
  variant?: BannerVariant
}

const CATEGORY_TONE: Record<string, { label: string; variant: BannerVariant; accent: string; kicker: string }> = {
  breaking: {
    label: 'Breaking',
    variant: 'pulse',
    accent: 'bg-beat-red',
    kicker: 'Live signal',
  },
  compare: {
    label: 'Compare',
    variant: 'editorial',
    accent: 'bg-beat-blue',
    kicker: 'Decision brief',
  },
  tools: {
    label: 'Tools',
    variant: 'tools',
    accent: 'bg-beat-green',
    kicker: 'Tool watch',
  },
  funding: {
    label: 'Funding',
    variant: 'funding',
    accent: 'bg-beat-red',
    kicker: 'Capital flow',
  },
  international: {
    label: 'Global',
    variant: 'global',
    accent: 'bg-beat-blue',
    kicker: 'World scan',
  },
  exclusive: {
    label: 'Exclusive',
    variant: 'editorial',
    accent: 'bg-beat-red',
    kicker: 'Editorial brief',
  },
}

export function NewsBanner({ variant, category, title }: NewsBannerProps) {
  const tone = CATEGORY_TONE[(category ?? '').toLowerCase()] ?? {
    label: 'AI News',
    variant: 'pulse' as BannerVariant,
    accent: 'bg-beat-red',
    kicker: 'Daily brief',
  }
  const resolvedVariant = variant ?? tone.variant

  return (
    <div className="w-full h-44 rounded-sm mb-4 relative overflow-hidden border-2 border-ink bg-paper">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(10,10,10,0.055)_1px,transparent_1px),linear-gradient(to_bottom,rgba(10,10,10,0.055)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute inset-x-0 top-0 h-10 border-b-2 border-ink bg-paper/90">
        <div className={`absolute left-0 top-0 h-full w-28 ${tone.accent}`} />
        <div className="relative flex h-full items-center justify-between px-4">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white">
            {tone.label}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
            AIBeat.dev
          </span>
        </div>
      </div>

      {resolvedVariant === 'pulse' && (
        <div className="absolute right-5 top-16 flex h-16 w-32 items-center justify-center border border-ink bg-ink text-paper">
          <span className="font-serif text-4xl font-black">AI</span>
          <span className="absolute -bottom-2 -right-2 h-4 w-4 bg-beat-red" />
        </div>
      )}

      {resolvedVariant === 'editorial' && (
        <div className="absolute right-5 top-16 grid w-36 grid-cols-3 gap-1.5">
          {[80, 48, 64, 36, 72, 54].map((height, i) => (
            <span
              key={i}
              className="block border border-ink bg-paper-2"
              style={{ height }}
            />
          ))}
        </div>
      )}

      {resolvedVariant === 'tools' && (
        <div className="absolute right-5 top-16 grid w-36 grid-cols-3 gap-2">
          {['AI', 'UX', 'SEO', 'CRM', 'DEV', 'OPS'].map((label) => (
            <span key={label} className="flex h-8 items-center justify-center border border-ink bg-white font-mono text-[10px]">
              {label}
            </span>
          ))}
        </div>
      )}

      {resolvedVariant === 'funding' && (
        <div className="absolute right-5 top-16 w-40 border border-ink bg-white p-3">
          <div className="mb-2 flex items-end gap-1">
            {[28, 42, 34, 58, 74, 62].map((height, i) => (
              <span key={i} className="w-4 bg-beat-green" style={{ height }} />
            ))}
          </div>
          <div className="font-mono text-[10px] uppercase text-ink-3">Funding radar</div>
        </div>
      )}

      {resolvedVariant === 'global' && (
        <div className="absolute right-5 top-16 h-20 w-36 border border-ink bg-ink text-paper">
          <div className="absolute left-4 top-4 h-3 w-3 rounded-full bg-beat-red" />
          <div className="absolute right-5 top-8 h-2 w-2 rounded-full bg-beat-green" />
          <div className="absolute bottom-5 left-14 h-2.5 w-2.5 rounded-full bg-beat-blue" />
          <div className="absolute inset-x-4 top-1/2 border-t border-paper/40" />
          <div className="absolute inset-y-4 left-1/2 border-l border-paper/40" />
        </div>
      )}

      <div className="relative z-10 flex h-full max-w-[72%] flex-col justify-end px-5 pb-5 pt-12">
        <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">
          {tone.kicker}
        </p>
        <h3 className="mt-1 font-serif text-2xl font-black leading-tight text-ink line-clamp-2">
          {title || 'AI News Briefing'}
        </h3>
        <div className="mt-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-ink-4">
          <span className={`h-2 w-2 ${tone.accent}`} />
          <span>News, launches, policy, tools</span>
        </div>
      </div>
    </div>
  )
}
