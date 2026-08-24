'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Calculator, CircleDollarSign, ShieldAlert, TrendingUp } from 'lucide-react'
import { BUSINESS_ANALYTICS_EVENTS } from '@/lib/analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const OPTIMIZATION_OPTIONS = [
  { label: 'Conservative', rate: 0.1 },
  { label: 'Moderate', rate: 0.2 },
  { label: 'High-overlap', rate: 0.3 },
]

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
})

function track(eventName: string, detail?: Record<string, unknown>) {
  window.gtag?.('event', eventName, {
    event_category: 'aibeat_business',
    ...detail,
  })
}

function ResultCard({ label, value, tone = 'default', featured = false }: { label: string; value: string; tone?: 'default' | 'green' | 'cyan'; featured?: boolean }) {
  const valueClass = tone === 'green' ? 'text-emerald-300' : tone === 'cyan' ? 'text-cyan-100' : 'text-white'

  return (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 ${featured ? 'sm:col-span-2' : ''}`}>
      <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</div>
      <div className={`mt-2 font-black tracking-tight ${featured ? 'text-3xl md:text-4xl' : 'text-2xl'} ${valueClass}`}>{value}</div>
    </div>
  )
}

function SliderControl({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  display,
  onChange,
  onCommit,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  display: string
  onChange: (value: number) => void
  onCommit: () => void
}) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
        <label htmlFor={id} className="text-sm font-semibold text-white">
          {label}
        </label>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-sm font-semibold text-cyan-100">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        onKeyUp={onCommit}
        onBlur={onCommit}
        className="mt-4 h-2 w-full cursor-pointer accent-cyan-300"
      />
      <div className="mt-2 flex justify-between text-xs text-slate-500">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

export function AISpendCalculator() {
  const [employeesUsingAI, setEmployeesUsingAI] = useState(35)
  const [toolsPerUser, setToolsPerUser] = useState(2)
  const [averageMonthlyCost, setAverageMonthlyCost] = useState(30)
  const [optimizationRate, setOptimizationRate] = useState(0.2)
  const completedTracked = useRef(false)
  const inputChangedTracked = useRef(false)

  const monthlySpend = employeesUsingAI * toolsPerUser * averageMonthlyCost
  const annualSpend = monthlySpend * 12
  const optimizationOpportunity = annualSpend * optimizationRate
  const shadowAIExposure = Math.round(employeesUsingAI * 0.24)

  const selectedScenario = useMemo(() => {
    return OPTIMIZATION_OPTIONS.find((option) => option.rate === optimizationRate) ?? OPTIMIZATION_OPTIONS[1]
  }, [optimizationRate])

  useEffect(() => {
    track(BUSINESS_ANALYTICS_EVENTS.calculatorViewed)
  }, [])

  function markInputChanged(inputName: string) {
    if (!inputChangedTracked.current) {
      track(BUSINESS_ANALYTICS_EVENTS.calculatorInputChanged, { input_name: inputName })
      inputChangedTracked.current = true
    }
    if (!completedTracked.current) {
      track(BUSINESS_ANALYTICS_EVENTS.calculatorCompleted, { scenario: selectedScenario.label })
      track(BUSINESS_ANALYTICS_EVENTS.businessCalculatorCompleted, { scenario: selectedScenario.label })
      completedTracked.current = true
    }
  }

  function scrollToEarlyAccess() {
    track(BUSINESS_ANALYTICS_EVENTS.earlyAccessClicked, { source: 'calculator' })
    document.getElementById('business-early-access')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
      <div className="rounded-[1.75rem] border border-white/10 bg-[#111722]/85 p-5 shadow-2xl shadow-cyan-950/20 md:p-7">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-cyan-100">
            <Calculator className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-2xl font-black text-white">AI Spend Efficiency Calculator</h2>
            <p className="mt-1 text-sm text-slate-400">Model spend, overlap scenarios, and Shadow AI exposure.</p>
          </div>
        </div>

        <div className="mt-7 space-y-7">
          <SliderControl
            id="employees-using-ai"
            label="Employees using paid AI"
            value={employeesUsingAI}
            min={10}
            max={100}
            display={`${employeesUsingAI} employees`}
            onChange={setEmployeesUsingAI}
            onCommit={() => markInputChanged('employees_using_ai')}
          />
          <SliderControl
            id="tools-per-user"
            label="Average paid AI tools per AI user"
            value={toolsPerUser}
            min={1}
            max={6}
            display={`${toolsPerUser} ${toolsPerUser === 1 ? 'tool' : 'tools'}`}
            onChange={setToolsPerUser}
            onCommit={() => markInputChanged('tools_per_user')}
          />
          <SliderControl
            id="average-monthly-cost"
            label="Average monthly cost per AI tool / seat"
            value={averageMonthlyCost}
            min={10}
            max={100}
            display={`${money.format(averageMonthlyCost)} / month`}
            onChange={setAverageMonthlyCost}
            onCommit={() => markInputChanged('average_monthly_cost')}
          />

          <fieldset>
            <legend className="text-sm font-semibold text-white">Optimization Scenario</legend>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {OPTIMIZATION_OPTIONS.map((option) => {
                const selected = option.rate === optimizationRate
                return (
                  <label
                    key={option.label}
                    className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${selected ? 'border-cyan-300/50 bg-cyan-300/10 text-white' : 'border-white/10 bg-white/[0.035] text-slate-300 hover:border-cyan-300/30'}`}
                  >
                    <input
                      type="radio"
                      name="optimizationRate"
                      value={option.rate}
                      checked={selected}
                      onChange={() => {
                        setOptimizationRate(option.rate)
                        markInputChanged('optimization_scenario')
                      }}
                      className="mt-1 h-4 w-4 shrink-0 accent-cyan-300"
                    />
                    <span>
                      <span className="block text-sm font-semibold">{option.label}</span>
                      <span className="mt-1 block text-2xl font-black">{Math.round(option.rate * 100)}%</span>
                    </span>
                  </label>
                )
              })}
            </div>
          </fieldset>
        </div>

        <div className="mt-7 rounded-3xl border border-white/10 bg-black/25 p-4 md:p-5" aria-live="polite">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResultCard label="Estimated monthly AI spend" value={`${money.format(monthlySpend)} / month`} />
            <ResultCard label="Estimated annual AI spend" value={money.format(annualSpend)} />
            <ResultCard label="Selected optimization scenario" value={`${selectedScenario.label} - ${Math.round(optimizationRate * 100)}%`} tone="cyan" />
            <ResultCard label="Potential annual optimization opportunity" value={money.format(optimizationOpportunity)} tone="green" featured />
          </div>

          <div className="mt-4 rounded-2xl border border-red-300/15 bg-red-300/[0.06] p-4">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-200" />
              <div>
                <h3 className="text-sm font-semibold text-white">Potential Shadow AI Exposure</h3>
                <p className="mt-2 text-2xl font-black text-white">~{shadowAIExposure} employees</p>
                <p className="mt-1 text-sm text-slate-300">Estimated employees potentially using unapproved AI.</p>
                <p className="mt-3 text-xs leading-5 text-slate-500">
                  Benchmark-based estimate only. Actual Shadow AI usage requires organizational discovery and connected data sources.
                </p>
              </div>
            </div>
          </div>

          <p className="mt-4 text-xs leading-5 text-slate-500">
            Illustrative estimate based on the inputs and scenario selected above. Actual AI spending, utilization, overlap, and potential savings depend on your organization&apos;s subscriptions, contracts, usage patterns, and software configuration.
          </p>
        </div>

        <div className="mt-7 rounded-3xl border border-cyan-300/20 bg-cyan-300/[0.06] p-5">
          <h3 className="text-xl font-black text-white">Want to know where the waste actually is?</h3>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            The calculator provides an estimate. AIBeat Business is being developed to help companies discover their real AI stack, understand spending patterns, and identify optimization opportunities.
          </p>
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link href="/business/demo" className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white sm:w-auto">
              Try Interactive Demo
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/business/sign-up" className="gradient-button inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold sm:w-auto">
              Start Early Access
              <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={scrollToEarlyAccess}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-cyan-300/20 px-5 py-3 text-sm font-semibold text-cyan-100 sm:w-auto"
            >
              Request guided follow-up
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {[
          {
            icon: CircleDollarSign,
            title: 'Detect Overlapping AI Spend',
            body: 'See where teams are paying for different AI products that solve substantially similar business problems and identify opportunities to consolidate.',
          },
          {
            icon: TrendingUp,
            title: 'Find Underused AI Licenses',
            body: 'Identify subscriptions and paid seats showing low usage and surface opportunities to reassign, downgrade, or cancel them.',
          },
          {
            icon: ShieldAlert,
            title: 'Gain Visibility Into Shadow AI',
            body: 'Build a clearer picture of AI applications being used across the organization and flag tools operating outside approved policies.',
          },
          {
            icon: Calculator,
            title: 'Understand AI ROI',
            body: 'Connect AI adoption, spending, and utilization with measurable business outcomes instead of relying only on employee sentiment.',
          },
        ].map((item) => (
          <div key={item.title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-5">
            <item.icon className="h-6 w-6 text-cyan-200" />
            <h3 className="mt-4 text-lg font-black text-white">{item.title}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-400">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
