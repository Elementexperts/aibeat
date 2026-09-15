import type { Metadata } from 'next'
export const metadata: Metadata = {
  title: 'AI Tool ROI Calculator', description: 'Estimate the time saved and return on investment from AI tools.',
  alternates: { canonical: '/free-tools/roi-calculator' },
}
export default function Layout({ children }: { children: React.ReactNode }) { return children }
