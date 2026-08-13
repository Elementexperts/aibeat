'use client'

import { useState } from 'react'
import { Copy, Facebook, Link2, Linkedin, Mail, Twitter } from 'lucide-react'

type ToolShareLinksProps = {
  name: string
  tagline: string
  path: string
  heading?: string
  description?: string
  subject?: string
}

const SITE_URL = 'https://www.aibeat.dev'

export function ToolShareLinks({
  name,
  tagline,
  path,
  heading = 'Share this listing',
  description = `Link people back to the AIBeat page for ${name}.`,
  subject = `${name} on AIBeat`,
}: ToolShareLinksProps) {
  const [copied, setCopied] = useState(false)
  const toolUrl = `${SITE_URL}${path}`
  const shareText = `${name} on AIBeat: ${tagline}`
  const encodedUrl = encodeURIComponent(toolUrl)
  const encodedText = encodeURIComponent(shareText)

  async function copyLink() {
    await navigator.clipboard.writeText(toolUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  const links = [
    {
      label: 'Share on X',
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: Twitter,
    },
    {
      label: 'Share on LinkedIn',
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: Linkedin,
    },
    {
      label: 'Share on Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: Facebook,
    },
    {
      label: 'Share by email',
      href: `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${shareText}\n\n${toolUrl}`)}`,
      icon: Mail,
    },
  ]

  return (
    <div className="border border-border p-4">
      <div className="section-label">{heading}</div>
      <p className="mb-3 text-[11px] leading-relaxed text-ink-3">
        {description}
      </p>
      <div className="flex flex-wrap gap-2">
        {links.map(({ label, href, icon: Icon }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={label}
            title={label}
            className="flex h-9 w-9 items-center justify-center border border-border bg-paper text-ink-3 transition-colors hover:border-ink hover:text-ink"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
          </a>
        ))}
        <a
          href={toolUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${name} page`}
          title={`Open ${name} page`}
          className="flex h-9 w-9 items-center justify-center border border-border bg-paper text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          <Link2 className="h-4 w-4" aria-hidden="true" />
        </a>
        <button
          type="button"
          onClick={copyLink}
          aria-label={copied ? 'Copied listing link' : 'Copy listing link'}
          title={copied ? 'Copied' : 'Copy listing link'}
          className="flex h-9 w-9 items-center justify-center border border-border bg-paper text-ink-3 transition-colors hover:border-ink hover:text-ink"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 break-all font-mono text-[10px] text-ink-4">{copied ? 'Copied' : toolUrl}</div>
    </div>
  )
}
