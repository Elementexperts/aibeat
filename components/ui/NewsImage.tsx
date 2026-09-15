'use client'

import Image, { type ImageLoaderProps } from 'next/image'
import { useState } from 'react'

const FALLBACK = '/news-images/fallback.svg'
const localImage = (url?: string) => /^\/news-images\/[a-f0-9]{20}-1200\.webp$/.test(url || '') ? url! : FALLBACK

// All sizes are generated in Actions, so serving images needs no runtime transforms.
function newsImageLoader({ src, width }: ImageLoaderProps) {
  return src.replace(/-1200\.webp$/, `-${width <= 240 ? 240 : width <= 640 ? 640 : 1200}.webp`)
}

export function NewsImage({ src, title, thumbnail = false, priority = false }: {
  src?: string; title: string; thumbnail?: boolean; priority?: boolean
}) {
  const [failedSrc, setFailedSrc] = useState<string>()
  const resolved = failedSrc === src ? FALLBACK : localImage(src)
  return (
    <div className={thumbnail ? 'relative h-[63px] w-[96px] shrink-0 overflow-hidden rounded-md bg-slate-900 sm:w-[120px]' : 'relative mb-5 aspect-[1200/630] w-full overflow-hidden rounded-lg bg-slate-900'}>
      <Image
        src={thumbnail ? resolved.replace('-1200.webp', '-240.webp') : resolved}
        loader={newsImageLoader}
        unoptimized={thumbnail || resolved === FALLBACK}
        alt={thumbnail ? '' : `${title} — ${resolved === FALLBACK ? 'AIBeat news illustration' : 'article cover'}`}
        fill
        sizes={thumbnail ? '(max-width: 640px) 96px, 120px' : '(max-width: 768px) 100vw, 720px'}
        priority={priority}
        className="object-cover"
        onError={() => setFailedSrc(src)}
      />
    </div>
  )
}
