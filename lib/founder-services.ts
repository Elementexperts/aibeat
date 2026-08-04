export * from '@/data/founder-services'

export const FOUNDERS_EMAIL = 'info@aibeat.dev'

export function inquiryHref(subject: string, goal?: string) {
  const body = [
    'Hi AIBeat team,',
    '',
    'I am interested in founder services on AIBeat.',
    '',
    `Goal: ${goal || ''}`,
    'Company:',
    'Website:',
    'Product category:',
    'Launch or campaign timeline:',
    'What would you like to promote?',
    '',
    'Thanks,',
  ].join('\n')
  return `mailto:info@aibeat.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}
