import type { Metadata } from 'next'
import { SignInForm } from './SignInForm'

export const metadata: Metadata = {
  title: 'Sign In | AIBeat Business',
  description: 'Sign in to AIBeat Business with your Supabase account.',
}

export default function BusinessSignInPage({ searchParams }: { searchParams: { next?: string; error?: string } }) {
  return <SignInForm nextPath={searchParams.next} initialError={searchParams.error} />
}
