'use client'

import Image from 'next/image'
import { useState } from 'react'

interface Props {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  width?: number
  height?: number
  // Fallback rendered when image fails or src is empty
  fallbackIcon: string
  fallbackColor: string
  fallbackSize?: 'sm' | 'md' | 'lg' | 'hero'
}

export default function SmartImage({
  src,
  alt,
  fill,
  className,
  sizes,
  priority,
  width,
  height,
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

  if (!src || failed) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${fallbackColor}18 0%, ${fallbackColor}35 100%)`,
        }}
      >
        <span className={`${iconSize} opacity-40 select-none`}>{fallbackIcon}</span>
      </div>
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={!fill ? width : undefined}
      height={!fill ? height : undefined}
      className={className}
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
    />
  )
}
