import { MetadataRoute } from 'next'
import { createServerClient } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/categories'

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://worldpulse.news'

export const revalidate = 3600 // regenera a cada 1 hora

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServerClient()

  // Busca todos os artigos publicados
  const { data: articles } = await supabase
    .from('articles')
    .select('slug, category_id, published_at, updated_at')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(5000)

  // Busca categorias para mapear id -> slug
  const { data: categories } = await supabase
    .from('categories')
    .select('id, slug')

  const catMap = Object.fromEntries((categories || []).map(c => [c.id, c.slug]))

  const articleUrls: MetadataRoute.Sitemap = (articles || []).flatMap(a => {
    const catSlug = catMap[a.category_id] || 'mundo'
    return ['pt', 'en'].map(lang => ({
      url: `${siteUrl}/${lang}/${catSlug}/${a.slug}`,
      lastModified: new Date(a.updated_at || a.published_at),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    }))
  })

  const categoryUrls: MetadataRoute.Sitemap = CATEGORIES.flatMap(cat =>
    ['pt', 'en'].map(lang => ({
      url: `${siteUrl}/${lang}/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    }))
  )

  const homeUrls: MetadataRoute.Sitemap = ['pt', 'en'].map(lang => ({
    url: `${siteUrl}/${lang}`,
    lastModified: new Date(),
    changeFrequency: 'always' as const,
    priority: 1.0,
  }))

  return [...homeUrls, ...categoryUrls, ...articleUrls]
}
