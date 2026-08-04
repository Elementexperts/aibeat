'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Copy, ShieldCheck } from 'lucide-react'
import { AIBEAT_CANONICAL_URL, FOUNDER_SERVICE_PLANS, formatPlanPrice, getPlanById } from '@/data/founder-services'
import type { VerificationMethod, VerificationResult } from '@/lib/aibeat-link-verification'
import { FOUNDER_ANALYTICS_EVENTS } from '@/lib/analytics'

const CATEGORIES = ['AI Agents', 'Developer Tools', 'Marketing', 'Sales', 'Education', 'Research', 'Design', 'Video', 'Image', 'Audio', 'Productivity', 'Customer Support', 'Enterprise', 'Open Source', 'Other']
const PRICING_MODELS = ['Free', 'Freemium', 'Paid', 'Free trial', 'Open source', 'Custom pricing']
const PRODUCT_STATUSES = ['Pre-launch', 'Recently launched', 'Live product', 'Major update', 'Private beta']
const CHANNELS = ['Email', 'LinkedIn', 'X/Twitter', 'Product Hunt', 'Other']

const EMPTY_FORM = {
  website: '',
  name: '',
  url: '',
  shortDescription: '',
  description: '',
  category: '',
  secondaryCategories: '',
  pricingModel: '',
  productStatus: '',
  launchDate: '',
  logoUrl: '',
  screenshots: '',
  demoVideo: '',
  featureList: '',
  useCases: '',
  integrations: '',
  founderName: '',
  socialLinks: '',
  productHuntUrl: '',
  githubUrl: '',
  contactName: '',
  email: '',
  company: '',
  role: '',
  country: '',
  preferredChannel: '',
  selectedPlan: 'free',
  launchInterest: '',
  newsletterInterest: '',
  articleInterest: '',
  affiliateInterest: '',
  preferredTiming: '',
  notes: '',
  verificationPageUrl: '',
  verificationMethod: 'badge' as VerificationMethod,
}

const STEPS = ['Product basics', 'Media and product info', 'Founder and contact', 'Promotion preferences', 'Review and submit']

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

function badgeSnippet() {
  return `<a href="${AIBEAT_CANONICAL_URL}" target="_blank" rel="noopener noreferrer" aria-label="Listed on AIBeat"><img src="${AIBEAT_CANONICAL_URL}/badges/listed-on-aibeat.svg" alt="Listed on AIBeat" width="180" height="48" loading="lazy" /></a>`
}

function textSnippet() {
  return `<a href="${AIBEAT_CANONICAL_URL}" target="_blank" rel="noopener noreferrer">Listed on AIBeat</a>`
}

export function SubmitToolForm() {
  const searchParams = useSearchParams()
  const initialPlan = getPlanById(searchParams.get('plan'))
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({ ...EMPTY_FORM, selectedPlan: initialPlan.id })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verification, setVerification] = useState<VerificationResult>({ ok: false, status: 'pending' })
  const [started, setStarted] = useState(false)

  const selectedPlan = useMemo(() => getPlanById(form.selectedPlan), [form.selectedPlan])
  const freeRequiresVerification = selectedPlan.verificationRequired === true

  function set(field: keyof typeof EMPTY_FORM, value: string) {
    if (!started) {
      window.gtag?.('event', FOUNDER_ANALYTICS_EVENTS.founderFormStart, { event_category: 'founder_services', plan_id: form.selectedPlan })
      setStarted(true)
    }
    setForm((prev) => ({ ...prev, [field]: value }))
    if (field === 'verificationPageUrl' || field === 'verificationMethod' || field === 'url' || field === 'selectedPlan') {
      setVerification({ ok: false, status: selectedPlan.verificationRequired ? 'pending' : 'not_required' })
    }
  }

  async function copy(value: string) {
    await navigator.clipboard.writeText(value)
  }

  async function verifyPlacement() {
    setVerifying(true)
    setError(null)
    try {
      const res = await fetch('/api/submissions/verify-aibeat-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: form.url,
          verificationPageUrl: form.verificationPageUrl,
          verificationMethod: form.verificationMethod,
        }),
      })
      const result = await res.json() as VerificationResult
      setVerification(result)
      if (!result.ok) setError(result.reason || 'Verification failed. Please check the badge or text link and try again.')
    } catch {
      setError('Verification timed out or could not be completed. Please try again.')
      setVerification({ ok: false, status: 'failed', reason: 'Verification timed out or could not be completed.' })
    } finally {
      setVerifying(false)
    }
  }

  function currentStepValid() {
    if (step === 0) return form.name && form.url && form.shortDescription && form.description && form.category && form.pricingModel && form.productStatus
    if (step === 2) return form.contactName && form.email && form.company
    if (step === 4 && freeRequiresVerification) return verification.ok
    return true
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (freeRequiresVerification && !verification.ok) {
      setError('Free Listing requires verified AIBeat badge or text-link placement before review.')
      return
    }
    setLoading(true)

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type: form.selectedPlan, category: form.category, description: `${form.shortDescription}\n\n${form.description}` }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || 'Could not submit right now. Please try again.')
        return
      }
      window.gtag?.('event', FOUNDER_ANALYTICS_EVENTS.founderFormComplete, { event_category: 'founder_services', plan_id: selectedPlan.id })
      setSubmitted(true)
    } catch {
      setError('Could not submit right now. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="premium-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-10 w-10 text-green-300" />
        <h2 className="mt-5 text-3xl font-black text-white">Thanks - your request is in review.</h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-400">
          AIBeat reviews every request before listing, featuring, publishing, or confirming payment steps.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/for-founders" className="inline-flex justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black">Compare plans</Link>
          <button type="button" onClick={() => { setSubmitted(false); setForm({ ...EMPTY_FORM, selectedPlan: 'free' }); setStep(0); setError(null) }} className="inline-flex justify-center rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white">Submit another</button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="premium-card p-5 md:p-6">
      <div className="mb-6 grid gap-2 sm:grid-cols-5">
        {STEPS.map((label, index) => (
          <button key={label} type="button" onClick={() => setStep(index)} className={`rounded-full border px-3 py-2 text-xs ${step === index ? 'border-cyan-300/50 bg-cyan-300/10 text-cyan-100' : 'border-white/10 text-slate-500'}`}>
            {index + 1}. {label}
          </button>
        ))}
      </div>

      <input type="text" value={form.website} onChange={(e) => set('website', e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {step === 0 && (
        <div className="grid gap-5">
          <FormInput label="Tool name *" value={form.name} onChange={(value) => set('name', value)} placeholder="e.g. TapVid" required />
          <FormInput label="Website URL *" type="url" value={form.url} onChange={(value) => set('url', value)} placeholder="https://yourtool.com" required />
          <FormInput label="Short description *" value={form.shortDescription} onChange={(value) => set('shortDescription', value)} placeholder="One clear sentence about what the product does" required />
          <FormTextarea label="Detailed description *" value={form.description} onChange={(value) => set('description', value)} placeholder="Who is it for? What workflow does it improve? What makes it different?" required />
          <FormSelect label="Primary category *" value={form.category} onChange={(value) => set('category', value)} options={CATEGORIES} required />
          <FormInput label="Secondary categories" value={form.secondaryCategories} onChange={(value) => set('secondaryCategories', value)} placeholder="Marketing, video, productivity" />
          <div className="grid gap-5 sm:grid-cols-2">
            <FormSelect label="Pricing model *" value={form.pricingModel} onChange={(value) => set('pricingModel', value)} options={PRICING_MODELS} required />
            <FormSelect label="Product status *" value={form.productStatus} onChange={(value) => set('productStatus', value)} options={PRODUCT_STATUSES} required />
          </div>
          <FormInput label="Launch date" type="date" value={form.launchDate} onChange={(value) => set('launchDate', value)} />
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-5">
          <FormInput label="Logo URL" type="url" value={form.logoUrl} onChange={(value) => set('logoUrl', value)} placeholder="https://..." />
          <FormTextarea label="Screenshots" value={form.screenshots} onChange={(value) => set('screenshots', value)} placeholder="Paste public screenshot URLs, one per line" />
          <FormInput label="Demo video" type="url" value={form.demoVideo} onChange={(value) => set('demoVideo', value)} placeholder="YouTube, Loom, product demo URL" />
          <FormTextarea label="Feature list" value={form.featureList} onChange={(value) => set('featureList', value)} placeholder="List key features, one per line" />
          <FormTextarea label="Use cases" value={form.useCases} onChange={(value) => set('useCases', value)} placeholder="List practical use cases" />
          <FormInput label="Integrations" value={form.integrations} onChange={(value) => set('integrations', value)} placeholder="Slack, Shopify, GitHub, Zapier..." />
          <FormInput label="Founder or company name" value={form.founderName} onChange={(value) => set('founderName', value)} />
          <FormTextarea label="Public social links" value={form.socialLinks} onChange={(value) => set('socialLinks', value)} placeholder="LinkedIn, X, founder profile URLs" />
          <FormInput label="Product Hunt link" type="url" value={form.productHuntUrl} onChange={(value) => set('productHuntUrl', value)} />
          <FormInput label="GitHub link" type="url" value={form.githubUrl} onChange={(value) => set('githubUrl', value)} />
        </div>
      )}

      {step === 2 && (
        <div className="grid gap-5">
          <FormInput label="Contact name *" value={form.contactName} onChange={(value) => set('contactName', value)} required />
          <FormInput label="Business email *" type="email" value={form.email} onChange={(value) => set('email', value)} placeholder="Use a domain email when possible" required />
          <FormInput label="Company *" value={form.company} onChange={(value) => set('company', value)} required />
          <FormInput label="Role" value={form.role} onChange={(value) => set('role', value)} placeholder="Founder, marketer, partnerships..." />
          <FormInput label="Country" value={form.country} onChange={(value) => set('country', value)} />
          <FormSelect label="Preferred communication channel" value={form.preferredChannel} onChange={(value) => set('preferredChannel', value)} options={CHANNELS} />
        </div>
      )}

      {step === 3 && (
        <div className="grid gap-5">
          <FormSelect label="Selected plan" value={form.selectedPlan} onChange={(value) => set('selectedPlan', value)} options={FOUNDER_SERVICE_PLANS.filter((plan) => plan.active).map((plan) => ({ label: `${plan.name} - ${formatPlanPrice(plan)}`, value: plan.id }))} />
          <ToggleSelect label="Launch interest" value={form.launchInterest} onChange={(value) => set('launchInterest', value)} />
          <ToggleSelect label="Newsletter interest" value={form.newsletterInterest} onChange={(value) => set('newsletterInterest', value)} />
          <ToggleSelect label="Sponsored article interest" value={form.articleInterest} onChange={(value) => set('articleInterest', value)} />
          <ToggleSelect label="Affiliate partnership interest" value={form.affiliateInterest} onChange={(value) => set('affiliateInterest', value)} />
          <FormInput label="Preferred timing" value={form.preferredTiming} onChange={(value) => set('preferredTiming', value)} placeholder="This week, next month, launch date..." />
          <FormTextarea label="Notes" value={form.notes} onChange={(value) => set('notes', value)} placeholder="Anything else AIBeat should know?" />
        </div>
      )}

      {step === 4 && (
        <div className="grid gap-5">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5">
            <div className="text-sm font-semibold uppercase tracking-[0.16em] text-cyan-200">Selected plan</div>
            <h2 className="mt-3 text-2xl font-black text-white">{selectedPlan.name}</h2>
            <p className="mt-2 text-sm text-slate-400">{formatPlanPrice(selectedPlan)} - {selectedPlan.shortDescription}</p>
            <ul className="mt-4 grid gap-2">
              {selectedPlan.features.slice(0, 6).map((feature) => <li key={feature} className="text-sm text-slate-300">- {feature}</li>)}
            </ul>
            <p className="mt-4 text-xs leading-6 text-slate-500">{selectedPlan.disclosure}</p>
          </div>

          {freeRequiresVerification && (
            <div className="rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-5">
              <ShieldCheck className="h-5 w-5 text-cyan-100" />
              <h3 className="mt-4 text-xl font-black text-white">Free Listing Verification Required</h3>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                To qualify for a free AIBeat listing, add the supplied Listed on AIBeat badge or text link to a publicly accessible page on your official website. AIBeat will verify the link before reviewing or publishing the listing.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <SnippetBox title="Visual badge" value={badgeSnippet()} onCopy={() => copy(badgeSnippet())} />
                <SnippetBox title="Text link" value={textSnippet()} onCopy={() => copy(textSnippet())} />
              </div>

              <div className="mt-5 grid gap-5">
                <FormSelect label="Verification method" value={form.verificationMethod} onChange={(value) => set('verificationMethod', value as VerificationMethod)} options={[{ label: 'Visual badge', value: 'badge' }, { label: 'Text link', value: 'text' }]} />
                <FormInput label="Verification page URL" type="url" value={form.verificationPageUrl} onChange={(value) => set('verificationPageUrl', value)} placeholder="https://yourtool.com/about" />
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button type="button" onClick={verifyPlacement} disabled={verifying || !form.url || !form.verificationPageUrl} className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">
                  {verifying ? 'Checking...' : verification.status === 'failed' ? 'Check Again' : 'Verify Placement'}
                </button>
                <span className={`text-sm ${verification.ok ? 'text-green-200' : 'text-slate-400'}`}>
                  Status: {verification.ok ? 'Verified' : verification.status}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {error && <div role="alert" className="mt-5 rounded-2xl border border-red-300/30 bg-red-300/10 px-4 py-3 text-sm text-red-100">{error}</div>}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        {step > 0 && <button type="button" onClick={() => setStep((value) => value - 1)} className="rounded-full border border-white/10 px-5 py-3 text-sm font-semibold text-white">Back</button>}
        {step < STEPS.length - 1 ? (
          <button type="button" disabled={!currentStepValid()} onClick={() => setStep((value) => value + 1)} className="gradient-button rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50">Continue</button>
        ) : (
          <button type="submit" disabled={loading || !currentStepValid()} className="gradient-button rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-50">{loading ? 'Submitting...' : selectedPlan.billingType === 'free' ? 'Submit Free Listing Request' : 'Request This Plan'}</button>
        )}
      </div>
    </form>
  )
}

function FormInput({ label, value, onChange, placeholder, type = 'text', required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <input required={required} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="mt-2 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
    </label>
  )
}

function FormTextarea({ label, value, onChange, placeholder, required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <textarea required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={4} className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-white outline-none placeholder:text-slate-600 focus:border-cyan-300/50" />
    </label>
  )
}

function FormSelect({ label, value, onChange, options, required = false }: { label: string; value: string; onChange: (value: string) => void; options: Array<string | { label: string; value: string }>; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">{label}</span>
      <select required={required} value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-[#0d0f14] px-4 py-3 text-sm text-white outline-none focus:border-cyan-300/50">
        <option value="">Select an option</option>
        {options.map((option) => {
          const value = typeof option === 'string' ? option : option.value
          const label = typeof option === 'string' ? option : option.label
          return <option key={value} value={value}>{label}</option>
        })}
      </select>
    </label>
  )
}

function ToggleSelect({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <FormSelect label={label} value={value} onChange={onChange} options={['No', 'Yes', 'Not sure']} />
}

function SnippetBox({ title, value, onCopy }: { title: string; value: string; onCopy: () => void }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-semibold text-white">{title}</div>
        <button type="button" onClick={onCopy} className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-300">
          <Copy className="h-3 w-3" />
          Copy
        </button>
      </div>
      <code className="mt-3 block max-h-28 overflow-auto rounded-xl bg-black/40 p-3 text-[11px] leading-5 text-slate-400">{value}</code>
    </div>
  )
}
