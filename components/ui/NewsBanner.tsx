type BannerVariant = 'pulse' | 'editorial' | 'global'

export function NewsBanner({
  variant,
  category,
}: {
  variant?: BannerVariant
  category?: string
}) {
  // Auto-select variant based on category
  const resolvedVariant =
    variant ??
    (category === 'breaking'
      ? 'pulse'
      : category === 'exclusive'
      ? 'editorial'
      : category === 'international'
      ? 'global'
      : 'pulse') // default fallback

  if (resolvedVariant === 'pulse') {
    return (
      <div className="w-full h-44 rounded-sm mb-4 relative overflow-hidden bg-gradient-to-r from-[#0a1338] via-[#1b1a4b] to-[#3b1a63]">
        {/* Banner picture */}
        <img
          src="/banners/ai-news-banner.png"
          alt="AI News — Latest Developments in Artificial Intelligence"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <span className="absolute bottom-2 left-2 bg-beat-red text-white text-[10px] px-2 py-0.5 font-mono">EXCLUSIVE</span>
      </div>
    )
  }

  if (resolvedVariant === 'editorial') {
    return (
      <div className="w-full h-44 rounded-sm mb-4 bg-black flex flex-col justify-center px-6">
        <h2 className="text-white font-serif text-2xl mb-1">LATEST NEWS</h2>
        <div className="w-20 h-1 bg-red-600 mb-2" />
        <p className="text-sm text-ink-3 italic">Editorial spotlight on AI developments</p>
      </div>
    )
  }

  if (resolvedVariant === 'global') {
    return (
      <div className="w-full h-44 rounded-sm mb-4 relative bg-gradient-to-r from-navy-900 to-navy-700">
        <div className="absolute inset-0 bg-[url('/world-map.svg')] bg-cover opacity-20" />
        <div className="absolute left-6 top-8">
          <p className="font-mono text-[10px] tracking-[0.3em] text-blue-200">GLOBAL UPDATES</p>
          <h2 className="mt-2 font-black text-white text-3xl">AI WORLD</h2>
          <p className="mt-1 text-[11px] italic text-yellow-300">Tracking innovation across borders</p>
        </div>
      </div>
    )
  }

  return null
}
