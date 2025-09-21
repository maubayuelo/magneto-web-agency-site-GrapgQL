"use client"
import React, { useEffect, useState, useRef } from 'react'
import Image, { ImageProps } from 'next/image'

type Sources = {
  mobile?: string
  tablet?: string
  desktop?: string
}

type WpImageSize = {
  sourceUrl?: string
  width?: number
  height?: number
}

type WpImage = {
  altText?: string
  sourceUrl?: string
  mediaDetails?: {
    sizes?: WpImageSize[]
  }
}

type Props = Omit<ImageProps, 'src' | 'alt'> & {
  sources?: Sources
  image?: WpImage
  alt?: string
  /** When true, render a plain <img> and omit width/height so CSS can control layout */
  omitSizeAttributes?: boolean
}

import { useDevice } from '@/hooks/useDevice'

function normalizeUrl(url?: string) {
  if (!url) return undefined
  if (url.startsWith('//')) return `https:${url}`
  return url
}

function deriveSourcesFromImage(image?: WpImage): Sources | undefined {
  if (!image) return undefined

  const sizes = image.mediaDetails?.sizes || []
  // Normalize entries with width
  const entries = sizes
    .map((s) => ({ src: normalizeUrl(s.sourceUrl), w: s.width || 0 }))
    .filter((e) => !!e.src)
    .sort((a, b) => a.w - b.w)

  const mobile = entries.find((e) => e.w && e.w <= 600)?.src
  const tablet = entries.find((e) => e.w && e.w > 600 && e.w <= 1024)?.src
  const desktop = entries.length ? entries[entries.length - 1].src : normalizeUrl(image.sourceUrl)

  return { mobile: mobile || normalizeUrl(image.sourceUrl), tablet: tablet || normalizeUrl(image.sourceUrl), desktop: desktop }
}

function deriveSrcSetAndSizes(image?: WpImage) {
  if (!image) return { srcSet: undefined, sizesAttr: undefined }
  const sizes = image.mediaDetails?.sizes || []
  const entries = sizes
    .map((s) => ({ src: normalizeUrl(s.sourceUrl), w: s.width || 0 }))
    .filter((e) => !!e.src && e.w > 0)
    .reduce((acc: Record<string, number>, e) => {
      // keep the largest width for a given src
      acc[e.src!] = Math.max(acc[e.src!] || 0, e.w)
      return acc
    }, {})

  const unique = Object.entries(entries)
    .map(([src, w]) => ({ src, w }))
    .sort((a, b) => a.w - b.w)

  const srcSet = unique.length ? unique.map((u) => `${u.src} ${u.w}w`).join(', ') : undefined
  const sizesAttr = unique.length
    ? '(max-width: 600px) 100vw, (max-width: 1024px) 80vw, 1024px'
    : undefined

  return { srcSet, sizesAttr }
}

function deriveEntries(image?: WpImage) {
  if (!image) return [] as { src: string; w: number; h?: number }[]
  const sizes = image.mediaDetails?.sizes || []
  const entries = sizes
    .map((s) => ({ src: normalizeUrl(s.sourceUrl), w: s.width || 0, h: s.height }))
    .filter((e) => typeof e.src === 'string' && e.w > 0) as { src: string; w: number; h?: number }[]
  const bySrc = new Map<string, { src: string; w: number; h?: number }>()
  entries.forEach((e) => {
    // e.src is guaranteed to be string by the filter above
    const existing = bySrc.get(e.src)
    if (!existing || e.w > existing.w) bySrc.set(e.src, e)
  })
  return Array.from(bySrc.values()).sort((a, b) => a.w - b.w)
}

function selectBestSizeFromImage(image?: WpImage, targetWidth = 1024, dpr = 1) {
  const entries = deriveEntries(image)
  if (!entries.length) return null
  const needed = Math.round(targetWidth * dpr)
  // choose the smallest entry that is >= needed, otherwise the largest available
  const candidate = entries.find((e) => e.w >= needed) || entries[entries.length - 1]
  return candidate || null
}

export default function WpResponsiveImage({ sources, image, alt, className, priority, sizes, style, omitSizeAttributes = false, width, height, fill, ...rest }: Props) {
  // Defensive: allow callers to pass undefined sources and support legacy `image` prop.
  const safeSources: Partial<Sources> = sources || deriveSourcesFromImage(image) || {}

  const device = useDevice()

  const containerRef = useRef<HTMLDivElement | null>(null)
  // measuredWidth and dpr must be stable during initial render to avoid hydration
  // differences. Start with deterministic values and update after mount.
  const [measuredWidth, setMeasuredWidth] = useState<number | null>(null)
  const [dpr, setDpr] = useState<number>(1)

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return
    const el = containerRef.current
    const setSize = () => setMeasuredWidth(el.clientWidth || null)
    setSize()

    // update DPR after mount
    setDpr(window.devicePixelRatio || 1)

    let ro: any = null
    if ((window as any).ResizeObserver) {
      ro = new (window as any).ResizeObserver(() => setSize())
      ro.observe(el)
    } else {
      window.addEventListener('resize', setSize)
    }

    return () => {
      if (ro && ro.disconnect) ro.disconnect()
      else window.removeEventListener('resize', setSize)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = device === 'mobile' ? safeSources.mobile : device === 'tablet' ? safeSources.tablet : safeSources.desktop
  const fallback = safeSources.desktop || safeSources.tablet || safeSources.mobile
  // Prefer measured width when available (more accurate for responsive layouts)
  const effectiveTarget = measuredWidth || (device === 'mobile' ? 360 : device === 'tablet' ? 768 : 1200)
  const best = selectBestSizeFromImage(image, effectiveTarget, dpr)
  const finalSrc = best?.src || selected || fallback
  const finalWidth = best?.w
  const finalHeight = best?.h

  const finalAlt = alt || (image && image.altText) || ''

  if (!finalSrc) {
    if (process.env.NODE_ENV !== 'production') {
      // eslint-disable-next-line no-console
      console.warn('WpResponsiveImage: no image source provided in `sources` or `image` prop')
    }
    return null
  }

  // If the caller requested omission via prop, render a plain <img>
  if (omitSizeAttributes) {
    const { srcSet, sizesAttr } = deriveSrcSetAndSizes(image)
    return (
      <div ref={containerRef} style={{ display: 'inline-block' }}>
        {/* plain image lets external CSS size the image (matches previous behaviour) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={finalSrc} alt={finalAlt} className={className} style={style as React.CSSProperties} loading="lazy" srcSet={srcSet} sizes={sizesAttr} />
      </div>
    )
  }
  // If using next/image, ensure we have valid sizing info. next/image requires either
  // both width and height, or the `fill` prop. If neither is present, render a native <img>.
  // Prefer using width/height from the chosen WP size if present
  const hasBothDimensions = typeof width !== 'undefined' && typeof height !== 'undefined' || (typeof finalWidth !== 'undefined' && typeof finalHeight !== 'undefined')
  const useNextImage = !!fill || hasBothDimensions

  if (!useNextImage) {
    const { srcSet, sizesAttr } = deriveSrcSetAndSizes(image)
    return (
      <div ref={containerRef} style={{ display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={finalSrc} alt={finalAlt} className={className} style={style as React.CSSProperties} loading="lazy" srcSet={srcSet} sizes={sizesAttr} />
      </div>
    )
  }

  // Choose width/height to pass to next/image: prefer explicit props, then derived WP size
  const nextWidth = typeof width !== 'undefined' ? width : finalWidth
  const nextHeight = typeof height !== 'undefined' ? height : finalHeight

  return (
    <div ref={containerRef} style={{ display: 'inline-block' }}>
      <Image
        src={finalSrc}
        alt={finalAlt}
        className={className}
        priority={priority}
        sizes={sizes}
        style={style}
        width={nextWidth}
        height={nextHeight}
        {...(fill ? { fill: true } : {})}
        {...rest}
      />
    </div>
  )
}