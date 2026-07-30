'use client'

import Script from 'next/script'

/**
 * Wraps AIBeat's Kit (ConvertKit) embed form.
 * `formKey` must be unique per mount on the page (e.g. "navbar-modal",
 * "site-popup") so React treats each instance as a distinct DOM node —
 * this avoids the Kit script getting confused if more than one instance
 * is ever mounted at once.
 */
export function KitEmbedForm({ formKey }: { formKey: string }) {
  return (
    <div key={formKey} id={`kit-form-${formKey}`} className="kit-embed-form">
      <Script
        async
        data-uid="2d832b7e5d"
        src="https://aibeat-dev.kit.com/2d832b7e5d/index.js"
        strategy="lazyOnload"
      />
    </div>
  )
}
