import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './OnboardingForm'
import { privateBusinessRobots } from '@/lib/business/metadata'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Onboarding | AIBeat Business',
  description: 'Create and configure your AIBeat Business organization.',
  robots: privateBusinessRobots,
}

export default async function BusinessOnboardingPage({ searchParams }: { searchParams: { next?: string } }) {
  const supabase = createClient()
  const { data } = await supabase.auth.getUser()
  if (!data.user) redirect('/business/sign-in?next=/business/onboarding')

  const defaults = {
    companyName: typeof data.user.user_metadata?.pending_company_name === 'string' ? data.user.user_metadata.pending_company_name : undefined,
    companySize: typeof data.user.user_metadata?.pending_company_size === 'string' ? data.user.user_metadata.pending_company_size : undefined,
  }

  return (
    <main className="dark-page min-h-screen bg-[#0b1117] text-white">
      <div className="site-shell grid min-h-screen items-center gap-10 py-12 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-100">AIBeat Business</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">Your protected workspace starts with one organization.</h2>
          <p className="mt-4 text-lg leading-8 text-slate-300">The first legitimate member becomes the organization owner. Demo organizations are never used for real accounts.</p>
        </section>
        <OnboardingForm nextPath={searchParams.next} defaults={defaults} />
      </div>
    </main>
  )
}
