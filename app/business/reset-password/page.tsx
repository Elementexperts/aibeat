import type { Metadata } from 'next'
import { ResetPasswordForm } from './ResetPasswordForm'

export const metadata: Metadata = {
  title: 'Reset Password | AIBeat Business',
  description: 'Set a new AIBeat Business password.',
  alternates: { canonical: '/business/reset-password' },
}

export default function ResetPasswordPage({ searchParams }: { searchParams: { error?: string } }) {
  return (
    <main className="dark-page flex min-h-screen items-center justify-center bg-[#0b1117] p-6">
      <ResetPasswordForm initialError={searchParams.error} />
    </main>
  )
}
