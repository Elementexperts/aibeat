'use client'

import { useState } from 'react'

type ToolLogoData = {
  name: string
  logo: string
  logoInitials: string
  logoUrl?: string
}

type ToolLogoProps = {
  tool: ToolLogoData
  className?: string
  imageClassName?: string
}

export function ToolLogo({ tool, className = 'w-9 h-9 rounded-md text-sm', imageClassName = 'p-1.5' }: ToolLogoProps) {
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = Boolean(tool.logoUrl && !imageFailed)

  return (
    <div
      className={`flex items-center justify-center font-bold text-white shrink-0 overflow-hidden ${showImage ? 'bg-white border border-border' : ''} ${className}`}
      style={showImage ? undefined : { background: tool.logo }}
      aria-label={`${tool.name} logo`}
    >
      {showImage ? (
        <img
          src={tool.logoUrl}
          alt=""
          className={`w-full h-full object-contain ${imageClassName}`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        tool.logoInitials
      )}
    </div>
  )
}
