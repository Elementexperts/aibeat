'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

function fmt(n: number, opts?: Intl.NumberFormatOptions) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 0, ...opts }).format(n)
}

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

function SliderInput({
  label, sublabel, value, min, max, step, unit, onChange,
}: {
  label: string; sublabel: string; value: number; min: number; max: number; step: number; unit: string; onChange: (v: number) => void
}) {
  return (
    <div className="mb-6">
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="text-sm font-semibold text-ink">{label}</div>
          <div className="font-mono text-[10px] text-ink-4">{sublabel}</div>
        </div>
        <div className="font-serif text-xl font-bold text-ink">
          {unit === '$' ? `$${fmt(value)}` : `${fmt(value)} ${unit}`}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-beat-red"
      />
      <div className="flex justify-between font-mono text-[10px] text-ink-4 mt-1">
        <span>{unit === '$' ? `$${min}` : `${min} ${unit}`}</span>
        <span>{unit === '$' ? `$${fmt(max)}` : `${fmt(max)} ${unit}`}</span>
      </div>
    </div>
  )
}

export default function ROICalculatorPage() {
  const [monthlyCost, setMonthlyCost] = useState(50)
  const [hoursSaved, setHoursSaved] = useState(4)
  const [hourlyRate, setHourlyRate] = useState(75)

  const results = useMemo(() => {
    const monthlyHoursSaved = hoursSaved * 4.33
    const monthlyValueOfTime = monthlyHoursSaved * hourlyRate
    const netMonthlyBenefit = monthlyValueOfTime - monthlyCost
    const annualSavings = netMonthlyBenefit * 12
    const roi = monthlyCost > 0 ? (netMonthlyBenefit / monthlyCost) * 100 : null
    const paybackDays = monthlyValueOfTime > 0 ? (monthlyCost / monthlyValueOfTime) * 30 : null
    const breaksEven = netMonthlyBenefit >= 0

    return { monthlyHoursSaved, monthlyValueOfTime, netMonthlyBenefit, annualSavings, roi, paybackDays, breaksEven }
  }, [monthlyCost, hoursSaved, hourlyRate])

  return (
    <div className="max-w-5xl mx-auto px-0 border-x border-border">

      {/* PAGE HEADER */}
      <div className="px-6 py-5 border-b-2 border-ink">
        <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1 flex items-center gap-1">
          <Link href="/" className="hover:text-beat-red">Home</Link>
          <span>/</span>
          <Link href="/free-tools" className="hover:text-beat-red">Free Tools</Link>
          <span>/</span>
          <span>ROI Calculator</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-ink mb-1">SaaS ROI Calculator</h1>
        <p className="text-sm text-ink-3">
          Does a paid tool pay for itself? Enter your numbers and find out instantly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] border-b-2 border-ink">

        {/* INPUTS */}
        <div className="p-6 border-r border-border">
          <div className="section-label">Your numbers</div>
          <div className="mt-5">
            <SliderInput
              label="Tool monthly cost"
              sublabel="What you pay per month"
              value={monthlyCost}
              min={0}
              max={500}
              step={5}
              unit="$"
              onChange={setMonthlyCost}
            />
            <SliderInput
              label="Hours saved per week"
              sublabel="Time the tool frees up"
              value={hoursSaved}
              min={0}
              max={40}
              step={0.5}
              unit="hrs"
              onChange={setHoursSaved}
            />
            <SliderInput
              label="Your hourly rate"
              sublabel="What your time is worth"
              value={hourlyRate}
              min={10}
              max={500}
              step={5}
              unit="$"
              onChange={setHourlyRate}
            />
          </div>
        </div>

        {/* RESULTS */}
        <div className="p-6">
          <div className="section-label">Your results</div>

          {/* Verdict banner */}
          <div className={`mt-4 mb-5 p-4 border-l-4 ${results.breaksEven ? 'border-beat-green bg-beat-green-light' : 'border-beat-red bg-red-50'}`}>
            <div className={`font-mono text-[10px] uppercase tracking-widest mb-1 ${results.breaksEven ? 'text-beat-green' : 'text-beat-red'}`}>
              {results.breaksEven ? 'Worth it' : 'Not yet worth it'}
            </div>
            <p className="text-sm font-semibold text-ink">
              {results.breaksEven
                ? `This tool saves you ${fmtCurrency(results.netMonthlyBenefit)}/mo more than it costs.`
                : `You'd need to save more time for this to pay off.`}
            </p>
          </div>

          {/* Metric cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-border p-3">
              <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">Monthly time value</div>
              <div className="font-serif text-2xl font-bold text-ink">
                {fmtCurrency(results.monthlyValueOfTime)}
              </div>
              <div className="font-mono text-[10px] text-ink-3 mt-0.5">
                {fmt(results.monthlyHoursSaved, { maximumFractionDigits: 1 })} hrs × ${hourlyRate}/hr
              </div>
            </div>

            <div className={`border p-3 ${results.netMonthlyBenefit >= 0 ? 'border-beat-green' : 'border-beat-red'}`}>
              <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">Net monthly benefit</div>
              <div className={`font-serif text-2xl font-bold ${results.netMonthlyBenefit >= 0 ? 'text-beat-green' : 'text-beat-red'}`}>
                {results.netMonthlyBenefit >= 0 ? '+' : ''}{fmtCurrency(results.netMonthlyBenefit)}
              </div>
              <div className="font-mono text-[10px] text-ink-3 mt-0.5">
                After ${monthlyCost}/mo cost
              </div>
            </div>

            <div className="border border-border p-3">
              <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">Annual savings</div>
              <div className={`font-serif text-2xl font-bold ${results.annualSavings >= 0 ? 'text-ink' : 'text-beat-red'}`}>
                {fmtCurrency(results.annualSavings)}
              </div>
              <div className="font-mono text-[10px] text-ink-3 mt-0.5">Over 12 months</div>
            </div>

            <div className="border border-border p-3">
              <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">
                {results.roi !== null ? 'Monthly ROI' : 'ROI'}
              </div>
              <div className={`font-serif text-2xl font-bold ${(results.roi ?? 0) >= 0 ? 'text-beat-green' : 'text-beat-red'}`}>
                {monthlyCost === 0
                  ? '∞'
                  : results.roi !== null
                    ? `${fmt(results.roi)}%`
                    : 'N/A'}
              </div>
              <div className="font-mono text-[10px] text-ink-3 mt-0.5">
                {results.paybackDays !== null && results.paybackDays <= 30
                  ? `Pays back in ${fmt(results.paybackDays, { maximumFractionDigits: 0 })} days`
                  : results.paybackDays !== null
                    ? `Pays back in ${fmt(results.paybackDays / 30, { maximumFractionDigits: 1 })} months`
                    : 'No savings to calculate'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* EXPLANATION */}
      <div className="px-6 py-6 border-b border-border">
        <div className="section-label">How this works</div>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { n: '1', title: 'Enter your cost', body: 'The monthly subscription price of the tool you\'re evaluating.' },
            { n: '2', title: 'Enter hours saved', body: 'How many hours per week does this tool realistically free up for you?' },
            { n: '3', title: 'Enter your rate', body: 'Your effective hourly rate — what your time is worth, billed or otherwise.' },
          ].map((step) => (
            <div key={step.n} className="flex gap-3">
              <span className="font-mono text-lg font-bold text-ink-4 min-w-[24px]">{step.n}.</span>
              <div>
                <div className="text-sm font-semibold text-ink mb-1">{step.title}</div>
                <p className="text-xs text-ink-3 leading-relaxed">{step.body}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-ink-4 mt-4 font-mono">
          Formula: Monthly value = (hours/week × 4.33) × hourly rate. Net benefit = Monthly value − Monthly cost. ROI = Net benefit ÷ Cost × 100.
        </p>
      </div>

      {/* CTA to free tools */}
      <div className="px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="font-mono text-[10px] text-ink-4 uppercase tracking-widest mb-1">Next step</div>
          <p className="text-sm text-ink-2">Browse our list of tools with a free plan — no cost to try.</p>
        </div>
        <Link href="/free-tools" className="font-mono text-xs text-white bg-ink px-5 py-2.5 hover:bg-beat-red transition-colors whitespace-nowrap">
          Browse free tools →
        </Link>
      </div>
    </div>
  )
}
