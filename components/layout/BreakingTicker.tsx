const TICKER_ITEMS = [
  'OpenAI announces GPT-5 pricing update',
  'Google Gemini Ultra beats all benchmarks',
  'Anthropic raises $3B Series E',
  'Meta releases open-source Llama 4',
  'Microsoft Copilot now free for all users',
  'AI writing tool market hits $2.4B valuation',
  'Cursor surpasses GitHub Copilot in developer surveys',
  'HubSpot adds AI assistant to free CRM tier',
]

export function BreakingTicker() {
  const repeated = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <div className="bg-beat-red text-white py-1.5 px-6 flex items-center gap-3 overflow-hidden text-xs">
      <span className="bg-white text-beat-red px-2 py-0.5 font-mono text-[10px] font-bold tracking-widest uppercase shrink-0">
        BREAKING
      </span>
      <div className="overflow-hidden flex-1">
        <div className="ticker-animate flex gap-8">
          {repeated.map((item, i) => (
            <span key={i} className="shrink-0">
              {item} &nbsp;·
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
