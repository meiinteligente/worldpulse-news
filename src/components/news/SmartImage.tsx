'use client'

import { useState } from 'react'

interface Props {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  fallbackIcon: string
  fallbackColor: string
  fallbackSize?: 'sm' | 'md' | 'lg' | 'hero'
}

export default function SmartImage({
  src,
  alt,
  className,
  priority,
  fallbackIcon,
  fallbackColor,
  fallbackSize = 'md',
}: Props) {
  const [failed, setFailed] = useState(false)

  const iconSize = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-5xl',
    hero: 'text-8xl',
  }[fallbackSize]

  const Fallback = () => (
    <div
      className="absolute inset-0 flex items-center justify-center"
      style={{
        background: `linear-gradient(135deg, ${fallbackColor}18 0%, ${fallbackColor}35 100%)`,
      }}
    >
      <span className={`${iconSize} opacity-40 select-none`}>{fallbackIcon}</span>
    </div>
  )

  if (!src || failed) return <Fallback />

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={`absolute inset-0 w-full h-full object-cover ${className || ''}`}
    />
  )
}
