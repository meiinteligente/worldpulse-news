import Link from 'next/link'
import { formatTimeAgo, type Lang } from '@/lib/categories'
import type { Article } from '@/lib/supabase'
import { MessageCircle, Clock } from 'lucide-react'
import SmartImage from './SmartImage'

interface Props {
  article: Article
  lang: Lang
  size?: 'sm' | 'md' | 'lg' | 'hero'
  showImage?: boolean
}

export default function ArticleCard({ article, lang, size = 'md', showImage = true }: Props) {
  const title = lang === 'pt' ? article.title_pt : article.title_en
  const summary = lang === 'pt' ? article.summary_pt : article.summary_en
  const timeAgo = formatTimeAgo(article.published_at || article.created_at, lang)
  const href = `/${lang}/${article.category_slug || 'mundo'}/${article.slug}`
  const catColor = article.category_color || '#ef4444'
  const catName = lang === 'pt' ? article.category_name_pt : article.category_name_en
  const catIcon = article.category_icon || '🌍'

  if (size === 'hero') {
    return (
      <article className="news-card relative rounded-2xl overflow-hidden group cursor-pointer h-[480px] md:h-[520px]">
        <Link href={href} className="block h-full">
          <div className="absolute inset-0">
            <SmartImage
              src={article.image_url || ''}
              alt={article.image_alt || title || ''}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              priority
              sizes="(max-width: 768px) 100vw, 65vw"
              fallbackIcon={catIcon}
              fallbackColor={catColor}
              fallbackSize="hero"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
            <div className="flex items-center gap-2 mb-3">
              {article.breaking && (
                <span className="bg-red-600 text-white text-xs font-bold uppercase px-2 py-0.5 rounded breaking-pulse">
                  {lang === 'pt' ? 'URGENTE' : 'BREAKING'}
                </span>
              )}
              <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: catColor }}>
                {catIcon} {catName}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black leading-tight mb-3 group-hover:text-red-300 transition-colors">
              {title}
            </h1>
            <p className="text-sm text-white/75 line-clamp-2 mb-4 max-w-2xl">{summary}</p>
            <div className="flex items-center gap-4 text-xs text-white/60">
              <span className="flex items-center gap-1"><Clock size={12} />{timeAgo}</span>
              <span>{article.source_name}</span>
              {article.comment_count ? (
                <span className="flex items-center gap-1"><MessageCircle size={12} />{article.comment_count}</span>
              ) : null}
            </div>
          </div>
        </Link>
      </article>
    )
  }

  if (size === 'lg') {
    return (
      <article className="news-card rounded-xl overflow-hidden border border-slate-100 bg-white group cursor-pointer">
        <Link href={href} className="block">
          {showImage && (
            <div className="relative h-48 overflow-hidden">
              <SmartImage
                src={article.image_url || ''}
                alt={article.image_alt || title || ''}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 33vw"
                fallbackIcon={catIcon}
                fallbackColor={catColor}
                fallbackSize="lg"
              />
            </div>
          )}
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: catColor }}>
                {catIcon} {catName}
              </span>
              {article.breaking && (
                <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded breaking-pulse">
                  {lang === 'pt' ? 'URGENTE' : 'BREAKING'}
                </span>
              )}
            </div>
            <h2 className="font-bold text-base leading-snug mb-2 line-clamp-3 group-hover:text-red-600 transition-colors text-slate-900">
              {title}
            </h2>
            <p className="text-sm text-slate-500 line-clamp-2 mb-3">{summary}</p>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1"><Clock size={11} />{timeAgo}</span>
              <span>{article.source_name}</span>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  if (size === 'sm') {
    return (
      <article className="group cursor-pointer">
        <Link href={href} className="flex gap-3 items-start py-3 border-b border-slate-100 last:border-0">
          {showImage && (
            <div className="relative w-20 h-16 rounded-lg overflow-hidden shrink-0">
              <SmartImage
                src={article.image_url || ''}
                alt={article.image_alt || title || ''}
                fill
                className="object-cover"
                sizes="80px"
                fallbackIcon={catIcon}
                fallbackColor={catColor}
                fallbackSize="sm"
              />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold uppercase mb-1" style={{ color: catColor }}>{catName}</p>
            <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-red-600 transition-colors text-slate-900">
              {title}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <Clock size={10} />{timeAgo} · {article.source_name}
            </p>
          </div>
        </Link>
      </article>
    )
  }

  // Default: md
  return (
    <article className="news-card rounded-xl overflow-hidden border border-slate-100 bg-white group cursor-pointer">
      <Link href={href} className="block">
        {showImage && (
          <div className="relative h-40 overflow-hidden">
            <SmartImage
              src={article.image_url || ''}
              alt={article.image_alt || title || ''}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, 25vw"
              fallbackIcon={catIcon}
              fallbackColor={catColor}
              fallbackSize="md"
            />
          </div>
        )}
        <div className="p-3">
          <p className="text-xs font-bold uppercase mb-1.5" style={{ color: catColor }}>{catIcon} {catName}</p>
          <h2 className="font-bold text-sm leading-snug line-clamp-3 group-hover:text-red-600 transition-colors text-slate-900">
            {title}
          </h2>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock size={10} />{timeAgo}
          </p>
        </div>
      </Link>
    </article>
  )
}
