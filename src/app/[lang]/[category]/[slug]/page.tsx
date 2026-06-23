import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase'
import { getCategoryBySlug, formatTimeAgo, type Lang } from '@/lib/categories'
import ArticleCard from '@/components/news/ArticleCard'
import type { Article } from '@/lib/supabase'
import { ExternalLink, Clock, Globe } from 'lucide-react'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}): Promise<Metadata> {
  const { lang, category, slug } = await params
  const supabase = createServerClient()
  const { data } = await supabase
    .from('articles_with_stats')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!data) return {}
  const article = data as Article
  const isPt = lang === 'pt'
  const title = isPt ? (article.meta_title_pt || article.title_pt) : (article.meta_title_en || article.title_en)
  const desc = isPt ? (article.meta_desc_pt || article.summary_pt.slice(0, 160)) : (article.meta_desc_en || article.summary_en.slice(0, 160))
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'

  return {
    title,
    description: desc,
    openGraph: {
      type: 'article',
      title,
      description: desc,
      url: `${siteUrl}/${lang}/${category}/${slug}`,
      publishedTime: article.published_at,
      section: isPt ? article.category_name_pt : article.category_name_en,
      images: article.image_url ? [{ url: article.image_url, alt: article.image_alt || title }] : [],
      siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: article.image_url ? [article.image_url] : [],
    },
    alternates: {
      canonical: `/${lang}/${category}/${slug}`,
      languages: {
        'pt-BR': `/pt/${category}/${slug}`,
        'en-US': `/en/${category}/${slug}`,
      },
    },
  }
}

async function getArticle(slug: string) {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('articles_with_stats')
    .select('*')
    .eq('slug', slug)
    .single()
  return data as Article | null
}

async function getRelated(categorySlug: string, currentSlug: string, lang: Lang): Promise<Article[]> {
  const supabase = createServerClient()
  const { data } = await supabase
    .from('articles_with_stats')
    .select('*')
    .eq('category_slug', categorySlug)
    .neq('slug', currentSlug)
    .order('published_at', { ascending: false })
    .limit(4)
  return (data || []) as Article[]
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ lang: string; category: string; slug: string }>
}) {
  const { lang: rawLang, category, slug } = await params
  if (rawLang !== 'pt' && rawLang !== 'en') notFound()
  const lang = rawLang as Lang

  const article = await getArticle(slug)
  if (!article) notFound()

  const related = await getRelated(category, slug, lang)
  const cat = getCategoryBySlug(category)

  const isPt = lang === 'pt'
  const title = isPt ? article.title_pt : article.title_en
  const summary = isPt ? article.summary_pt : article.summary_en
  const catName = isPt ? article.category_name_pt : article.category_name_en
  const timeAgo = formatTimeAgo(article.published_at || article.created_at, lang)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main article */}
        <article className="lg:col-span-2">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-slate-400 mb-5">
            <Link href={`/${lang}`} className="hover:text-slate-600 transition-colors">
              {isPt ? 'Início' : 'Home'}
            </Link>
            <span>›</span>
            <Link
              href={`/${lang}/${category}`}
              className="hover:text-slate-600 transition-colors"
              style={{ color: cat?.color }}
            >
              {cat?.icon} {catName}
            </Link>
            <span>›</span>
            <span className="truncate max-w-xs">{title}</span>
          </nav>

          {/* Category badge */}
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/${lang}/${category}`}
              className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-white"
              style={{ backgroundColor: cat?.color || '#ef4444' }}
            >
              {cat?.icon} {catName}
            </Link>
            {article.breaking && (
              <span className="text-xs bg-red-100 text-red-600 font-bold px-2.5 py-1 rounded-full breaking-pulse">
                {isPt ? '🔴 URGENTE' : '🔴 BREAKING'}
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
            {title}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-6 pb-6 border-b border-slate-100">
            <span className="flex items-center gap-1.5">
              <Clock size={14} />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1.5">
              <Globe size={14} />
              {article.source_name}
            </span>
            <a
              href={article.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
            >
              <ExternalLink size={13} />
              {isPt ? 'Ver original' : 'View original'}
            </a>
            {/* Language switcher */}
            <Link
              href={`/${lang === 'pt' ? 'en' : 'pt'}/${category}/${slug}`}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-700 transition-colors ml-auto"
            >
              🌐 {lang === 'pt' ? 'Read in English' : 'Ler em Português'}
            </Link>
          </div>

          {/* Hero image */}
          {article.image_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-8">
              <Image
                src={article.image_url}
                alt={article.image_alt || title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, 65vw"
              />
            </div>
          )}

          {/* Article body */}
          <div className="article-body text-slate-700 text-lg leading-relaxed">
            {summary.split('\n').filter(Boolean).map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>

          {/* Source attribution */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              {isPt
                ? '📰 Este resumo foi gerado por inteligência artificial com base no artigo original de '
                : '📰 This summary was AI-generated based on the original article from '}
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-blue-600 hover:underline"
              >
                {article.source_name}
              </a>
              {'. '}
              {isPt ? 'Leia a reportagem completa no link acima.' : 'Read the full story at the link above.'}
            </p>
          </div>

          {/* Tags */}
          {article.tags?.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {article.tags.map(tag => (
                <span key={tag} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-1">
          <div className="sticky top-28">
            {related.length > 0 && (
              <div>
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <div className="w-1 h-5 rounded-full" style={{ backgroundColor: cat?.color || '#ef4444' }} />
                  {isPt ? 'Veja também' : 'Related news'}
                </h3>
                <div className="space-y-0">
                  {related.map(a => (
                    <ArticleCard key={a.id} article={a} lang={lang} size="sm" />
                  ))}
                </div>
              </div>
            )}

            {/* AdSense placeholder */}
            <div className="mt-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 text-center text-xs text-slate-400">
              📢 {isPt ? 'Espaço para anúncio' : 'Ad space'}
              <br />Google AdSense
            </div>
          </div>
        </aside>
      </div>

      {/* JSON-LD — Article structured data (crítico para SEO) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'NewsArticle',
            headline: title,
            description: summary.slice(0, 300),
            image: article.image_url ? [article.image_url] : undefined,
            datePublished: article.published_at,
            dateModified: article.published_at,
            author: {
              '@type': 'Organization',
              name: siteName,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
              url: siteUrl,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${siteUrl}/${lang}/${category}/${slug}`,
            },
            isBasedOn: {
              '@type': 'NewsArticle',
              url: article.source_url,
              publisher: {
                '@type': 'Organization',
                name: article.source_name,
              },
            },
            articleSection: catName,
            keywords: article.tags?.join(', '),
            inLanguage: lang === 'pt' ? 'pt-BR' : 'en-US',
          }),
        }}
      />
    </div>
  )
}
