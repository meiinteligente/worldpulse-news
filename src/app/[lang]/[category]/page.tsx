import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES, getCategoryBySlug, type Lang } from '@/lib/categories'
import ArticleCard from '@/components/news/ArticleCard'
import type { Article } from '@/lib/supabase'

export const revalidate = 30 // ISR: revalida a cada 30 segundos

export async function generateStaticParams() {
  return ['pt', 'en'].flatMap(lang =>
    CATEGORIES.map(cat => ({ lang, category: cat.slug }))
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}): Promise<Metadata> {
  const { lang, category } = await params
  const cat = getCategoryBySlug(category)
  if (!cat) return {}
  const isPt = lang === 'pt'
  const name = isPt ? cat.name_pt : cat.name_en
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || ''
  return {
    title: `${cat.icon} ${name}`,
    description: isPt
      ? `Notícias de ${name} atualizadas em tempo real. As mais relevantes do mundo.`
      : `Latest ${name} news updated in real time. The most relevant from around the world.`,
    openGraph: {
      title: `${name} | ${siteName}`,
      url: `${siteUrl}/${lang}/${category}`,
    },
    alternates: {
      canonical: `/${lang}/${category}`,
      languages: {
        'pt-BR': `/pt/${category}`,
        'en-US': `/en/${category}`,
      },
    },
  }
}

async function getCategoryArticles(categorySlug: string, page = 1): Promise<Article[]> {
  const supabase = createServerClient()
  const pageSize = 24
  const from = (page - 1) * pageSize
  const { data } = await supabase
    .from('articles_with_stats')
    .select('*')
    .eq('category_slug', categorySlug)
    .order('published_at', { ascending: false })
    .range(from, from + pageSize - 1)
  return (data || []) as Article[]
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ lang: string; category: string }>
}) {
  const { lang: rawLang, category } = await params
  if (rawLang !== 'pt' && rawLang !== 'en') notFound()
  const lang = rawLang as Lang

  const cat = getCategoryBySlug(category)
  if (!cat) notFound()

  const articles = await getCategoryArticles(category)
  const isPt = lang === 'pt'
  const catName = isPt ? cat.name_pt : cat.name_en
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Category header */}
      <div className="mb-8 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-10 rounded-full" style={{ backgroundColor: cat.color }} />
          <span className="text-5xl">{cat.icon}</span>
          <div>
            <h1 className="text-3xl font-black text-slate-900">{catName}</h1>
            <p className="text-slate-500 text-sm mt-0.5">
              {isPt
                ? `Notícias de ${catName} atualizadas em tempo real`
                : `${catName} news updated in real time`}
            </p>
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">{cat.icon}</p>
          <p className="text-slate-500">
            {isPt
              ? 'Aguardando as primeiras notícias desta editoria...'
              : 'Waiting for the first articles in this section...'}
          </p>
        </div>
      ) : (
        <>
          {/* Hero + grid */}
          <div className="mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <ArticleCard article={articles[0]} lang={lang} size="lg" />
              </div>
              <div className="flex flex-col gap-4">
                {articles.slice(1, 4).map(a => (
                  <ArticleCard key={a.id} article={a} lang={lang} size="sm" />
                ))}
              </div>
            </div>
          </div>

          {/* Rest in grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {articles.slice(4).map(article => (
              <ArticleCard key={article.id} article={article} lang={lang} size="md" />
            ))}
          </div>
        </>
      )}

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'CollectionPage',
            name: `${catName} | ${siteName}`,
            description: isPt
              ? `Notícias de ${catName} atualizadas em tempo real`
              : `${catName} news in real time`,
            url: `${process.env.NEXT_PUBLIC_SITE_URL}/${lang}/${category}`,
          }),
        }}
      />
    </div>
  )
}
