'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { Article } from '@/lib/supabase'
import type { Lang } from '@/lib/categories'

interface Props {
  articles: Article[]
  lang: Lang
}

export default function TickerBar({ articles, lang }: Props) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    let pos = 0
    const speed = 0.5
    const tick = () => {
      pos -= speed
      if (pos < -el.scrollWidth / 2) pos = 0
      el.style.transform = `translateX(${pos}px)`
      requestAnimationFrame(tick)
    }
    const raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  if (!articles.length) return null

  const doubled = [...articles, ...articles]

  return (
    <div className="bg-slate-900 text-white overflow-hidden py-2">
      <div className="flex items-center">
        <div className="shrink-0 bg-red-600 px-4 py-1 text-xs font-black uppercase tracking-widest z-10">
          {lang === 'pt' ? 'ÚLTIMAS' : 'LATEST'}
        </div>
        <div className="overflow-hidden flex-1">
          <div ref={ref} className="flex gap-8 whitespace-nowrap will-change-transform">
            {doubled.map((a, i) => {
              const title = lang === 'pt' ? a.title_pt : a.title_en
              return (
                <Link
                  key={`${a.id}-${i}`}
                  href={`/${lang}/${a.category_slug || 'mundo'}/${a.slug}`}
                  className="text-xs text-slate-300 hover:text-white transition-colors shrink-0 flex items-center gap-2"
                >
                  <span className="text-red-400">●</span>
                  {title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
