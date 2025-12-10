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
  let result = Array.from(bySrc.values()).sort((a, b) => a.w - b.w)

  // Defensive fallback: if the largest available derived size is still very
  // small (e.g. thumbnails only), add the top-level sourceUrl as a large
  // candidate to avoid picking a tiny image variant that may not exist on
  // the remote host with the exact cropped filename pattern.
  const largest = result.length ? result[result.length - 1] : undefined
  const hasLargeEnough = largest && largest.w > 300
  const topSource = normalizeUrl(image.sourceUrl)
  if (!hasLargeEnough && topSource) {
    // Assign a conservative large width if we don't have a real width from
    // mediaDetails. If mediaDetails.top-level width is available, prefer it.
    const fallbackW = (image as any)?.mediaDetails?.width || 1200
    result.push({ src: topSource, w: fallbackW, h: (image as any)?.mediaDetails?.height })
  }

  return result
}

function selectBestSizeFromImage(image?: WpImage, targetWidth = 1024, dpr = 1) {
  const entries = deriveEntries(image)
  if (!entries.length) return null
  const needed = Math.round(targetWidth * dpr)
  // choose the smallest entry that is >= needed, otherwise the largest available
  let candidate = entries.find((e) => e.w >= needed) || entries[entries.length - 1]

  // Defensive: if the chosen candidate is very small (e.g. <= 100px) it's
  // likely a thumbnail-only dataset or a bad size selection during SSR. In
  // that case prefer the largest available variant so the optimizer doesn't
  // emit a tiny image. This threshold is conservative.
  if (candidate && candidate.w > 0 && candidate.w <= 100 && entries.length > 1) {
    candidate = entries[entries.length - 1]
  }

  // If we still don't have a sensible width, try to fall back to the
  // top-level sourceUrl (full size) with no derived dims.
  if (candidate && candidate.w > 0) return candidate
  return null
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

  // Defensive: if the chosen finalSrc is a WP-generated size filename
  // (e.g. contains "-768x768"), prefer the canonical sourceUrl when
  // available. Some CMS setups report sizes that don't exist on disk, and
  // requesting those variants causes 404s from the optimizer.
  let resolvedSrc: string = finalSrc as string
  let resolvedWidth = finalWidth
  let resolvedHeight = finalHeight
  try {
    if (image && image.sourceUrl && typeof resolvedSrc === 'string') {
      const variantRe = /-\d+x\d+(?=\.[a-zA-Z0-9]+$)/
      const srcPath = resolvedSrc
      const topSource = normalizeUrl(image.sourceUrl)
      if (variantRe.test(srcPath) && topSource && topSource !== srcPath) {
        // Prefer the top-level canonical source URL
        resolvedSrc = topSource
        // If top-level mediaDetails include width/height, use them
        const topW = (image as any)?.mediaDetails?.width
        const topH = (image as any)?.mediaDetails?.height
        if (typeof topW === 'number') resolvedWidth = topW
        if (typeof topH === 'number') resolvedHeight = topH
      }
    }
  } catch (e) {
    // Non-fatal: fall back to the previously computed values
  }

  // If the caller requested omission via prop, try to render a responsive next/image
  // using `fill` inside a positioned container when we have an aspect ratio. If
  // no reliable dimensions are available, fall back to a native <img> to avoid
  // layout shifts.
  if (omitSizeAttributes) {
    const { srcSet, sizesAttr } = deriveSrcSetAndSizes(image)
    // If we have intrinsic dimensions, prefer next/image with fill and aspect-ratio box
        if (resolvedWidth && resolvedHeight) { 
              if (className) {
                return <Image src={resolvedSrc} alt={finalAlt} width={resolvedWidth} height={resolvedHeight} className={className} style={style as React.CSSProperties} sizes={sizes} priority={priority} />
              }
              return (
                <div ref={containerRef}>
                  <Image src={resolvedSrc} alt={finalAlt} width={resolvedWidth} height={resolvedHeight} className={className} style={style as React.CSSProperties} sizes={sizes} priority={priority} />
                </div>
              )
    }

    // Best-effort: render next/image with a loose width to let the optimizer handle resizing
    if (!finalWidth && !finalHeight) {
          if (className) {
            return <Image src={resolvedSrc} alt={finalAlt} width={effectiveTarget} height={Math.round((effectiveTarget * 9) / 16)} className={className} style={style as React.CSSProperties} sizes={sizes} priority={priority} />
          }
          return (
            <div ref={containerRef} style={{ display: 'inline-block' }}>
              <Image src={resolvedSrc} alt={finalAlt} width={effectiveTarget} height={Math.round((effectiveTarget * 9) / 16)} className={className} style={style as React.CSSProperties} sizes={sizes} priority={priority} />
            </div>
          )
    }

    // Fallback to a sized next/image when possible to preserve CSS targeting.
    if (className) {
      return <Image src={resolvedSrc} alt={finalAlt} width={effectiveTarget} height={Math.round((effectiveTarget * 9) / 16)} className={className} style={style as React.CSSProperties} sizes={sizes} priority={priority} />
    }

    // Otherwise fall back to native <img> wrapped for layout safety
    return (
      <div ref={containerRef} style={{ display: 'inline-block' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedSrc} alt={finalAlt} className={className} style={style as React.CSSProperties} loading="lazy" srcSet={srcSet} sizes={sizesAttr} />
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
            <Image src={resolvedSrc} alt={finalAlt} width={effectiveTarget} height={Math.round((effectiveTarget * 9) / 16)} className={className} style={style as React.CSSProperties} sizes={sizesAttr} priority={priority} />
          </div>
    )
  }

  // Choose width/height to pass to next/image: prefer explicit props, then derived WP size
  const nextWidth = typeof width !== 'undefined' ? width : resolvedWidth
  const nextHeight = typeof height !== 'undefined' ? height : resolvedHeight

  // Build props for next/image carefully: next/image forbids providing width/height
  // together with fill. Only pass width/height when not using fill.
  const imageProps: any = {
    src: resolvedSrc,
    alt: finalAlt,
    className,
    priority,
    sizes,
    style,
    ...rest,
  }

  if (!fill) {
    // width/height should be numbers when provided
    if (typeof nextWidth !== 'undefined') imageProps.width = nextWidth
    if (typeof nextHeight !== 'undefined') imageProps.height = nextHeight
  } else {
    imageProps.fill = true
  }

  // Avoid inserting positioned wrappers or inline styles when the caller
  // provided a `className` that expects to style the image directly. Prefer
  // rendering `next/image` with explicit width/height (non-fill) so existing
  // CSS selectors keep working. Only use `fill` when the caller explicitly
  // passes `fill` and no className is present or when sizes aren't available.

  const shouldAvoidWrapper = !!className

  if (imageProps.fill && shouldAvoidWrapper) {
    // Try to render the Image with explicit width/height instead of fill so
    // the image element receives the className and CSS rules. Use derived
    // dimensions when available.
    if (nextWidth && nextHeight) {
      const sizedProps = { ...imageProps }
      delete (sizedProps as any).fill
      sizedProps.width = nextWidth
      sizedProps.height = nextHeight
            if (className) {
              return <Image {...sizedProps} style={style as React.CSSProperties} priority={priority} />
            }
            return (
              <div ref={containerRef}>
                <Image {...sizedProps} style={style as React.CSSProperties} priority={priority} />
              </div>
            )
    }

    // If we don't have dimensions, fall back to native <img> (preserves CSS)
    const { srcSet, sizesAttr } = deriveSrcSetAndSizes(image)
    return (
      <div ref={containerRef}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={resolvedSrc} alt={finalAlt} className={className} style={style as React.CSSProperties} loading="lazy" srcSet={srcSet} sizes={sizesAttr} />
      </div>
    )
  }

  return (
    <div ref={containerRef}>
      <Image {...imageProps} />
    </div>
  )
}