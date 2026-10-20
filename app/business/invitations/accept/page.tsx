import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { invitationPath } from '@/lib/business/invitations'
import { acceptBusinessInvitation } from './actions'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Accept invitation | AIBeat Business', robots: { index: false, follow: false }, referrer: 'no-referrer' }

export default async function AcceptInvitationPage({ searchParams }: { searchParams: { invitation?: string; error?: string } }) {
  const path = invitationPath(searchParams.invitation)
  if (!path) return <main className="site-shell py-12"><h1>Invalid invitation</h1><p>Ask the workspace owner for a new invitation link.</p></main>
  const { data, error } = await createClient().auth.getUser()
  if (error || !data.user) redirect('/business/sign-in?next=' + encodeURIComponent(path))
  return <main className="site-shell py-12">
    <h1 className="text-2xl font-bold">Accept workspace invitation</h1>
    <p className="mt-4">Accept using the verified account email that the workspace owner invited.</p>
    {searchParams.error && <p role="alert" className="mt-4">{searchParams.error.slice(0, 240)}</p>}
    {!data.user.email_confirmed_at ? <p className="mt-4">Verify your account email before accepting.</p> :
      <form action={acceptBusinessInvitation} className="mt-6">
        <input type="hidden" name="invitation" value={searchParams.invitation} />
        <button type="submit" className="rounded bg-emerald-600 px-4 py-2 text-white">Accept invitation</button>
      </form>}
    <Link href="/business/sign-in" className="mt-6 block">Return to sign in</Link>
  </main>
}
