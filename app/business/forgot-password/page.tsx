import type { Metadata } from 'next'
import { ForgotPasswordForm } from './ForgotPasswordForm'

export const metadata: Metadata = {
  title: 'Forgot Password | AIBeat Business',
  description: 'Request a password reset link for AIBeat Business.',
  alternates: { canonical: '/business/forgot-password' },
}

export default function ForgotPasswordPage() {
  return (
    <main className="dark-page flex min-h-screen items-center justify-center bg-[#0b1117] p-6">
      <ForgotPasswordForm />
    </main>
  )
}
