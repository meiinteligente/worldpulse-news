/**
 * ROBÔ DE NOTÍCIAS — Motor principal de coleta e processamento com IA
 *
 * Fluxo:
 * 1. Busca RSS feeds das fontes ativas no Supabase
 * 2. Para cada item: verifica duplicata (URL já existe?)
 * 3. Chama Claude API para: resumo PT+EN, título SEO, score de relevância, categoria, tags
 * 4. Salva no Supabase com status 'pending' (aguarda curadoria) ou 'published' (auto-publish se score >= 8)
 */

import Anthropic from '@anthropic-ai/sdk'
import Parser from 'rss-parser'
import { createClient } from '@supabase/supabase-js'

// ─── Setup ────────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
const parser = new Parser({
  customFields: { item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumbnail']] },
  timeout: 15000,
})

// ─── Types ────────────────────────────────────────────────────────────────────

interface RSSItem {
  title?: string
  link?: string
  contentSnippet?: string
  content?: string
  isoDate?: string
  pubDate?: string
  enclosure?: { url?: string }
  mediaContent?: { $?: { url?: string } }
  mediaThumbnail?: { $?: { url?: string } }
}

interface ProcessedArticle {
  title_pt: string
  title_en: string
  slug: string
  summary_pt: string
  summary_en: string
  meta_title_pt: string
  meta_title_en: string
  meta_desc_pt: string
  meta_desc_en: string
  tags: string[]
  relevance_score: number
  category_slug: string
  breaking: boolean
}

// ─── Utilidades ───────────────────────────────────────────────────────────────

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 100)
}

function extractImage(item: RSSItem): string | null {
  return (
    item.enclosure?.url ||
    item.mediaContent?.$?.url ||
    item.mediaThumbnail?.$?.url ||
    null
  )
}

function cleanText(text?: string): string {
  if (!text) return ''
  return text
    .replace(/<[^>]*>/g, '')  // remove HTML
    .replace(/&[a-z]+;/g, ' ')  // remove HTML entities
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000)
}

// ─── Verificação de duplicata ──────────────────────────────────────────────────

async function isDuplicate(url: string): Promise<boolean> {
  const { data } = await supabase
    .from('articles')
    .select('id')
    .eq('source_url', url)
    .limit(1)
  return (data?.length || 0) > 0
}

// ─── Processamento com Claude ──────────────────────────────────────────────────

async function processWithClaude(
  title: string,
  content: string,
  sourceName: string,
  sourceLang: 'pt' | 'en'
): Promise<ProcessedArticle | null> {
  const systemPrompt = `You are a professional news editor and SEO expert for a global bilingual news portal (Portuguese + English).

Your task: analyze a news article and produce structured output.

CATEGORIES available (use the slug):
- mundo (World/International)
- politica (Politics)
- economia (Economy/Finance/Business)
- tecnologia (Technology/AI/Innovation)
- ciencia (Science/Research)
- saude (Health/Medicine)
- esportes (Sports)
- entretenimento (Entertainment/Culture/Celebrity)

RULES:
1. Summaries must be ORIGINAL TEXT — do NOT copy from the source. Write in your own words.
2. PT summary: 300-500 words in Brazilian Portuguese, journalistic tone.
3. EN summary: 300-500 words in American English, journalistic tone.
4. Relevance score 1-10: global importance, reader interest, timeliness.
5. Breaking = true only for major urgent events (disasters, elections results, major deaths, wars).
6. Tags: 3-6 keywords in English, lowercase.
7. SEO titles: max 60 chars. Meta descriptions: 150-160 chars.
8. Slug: English words, no accents, hyphens only.

Respond ONLY with valid JSON, no markdown, no explanation.`

  const userPrompt = `Analyze this article:

SOURCE: ${sourceName} (language: ${sourceLang})
TITLE: ${title}
CONTENT: ${content}

Return JSON with this exact structure:
{
  "title_pt": "...",
  "title_en": "...",
  "slug": "...",
  "summary_pt": "...",
  "summary_en": "...",
  "meta_title_pt": "...",
  "meta_title_en": "...",
  "meta_desc_pt": "...",
  "meta_desc_en": "...",
  "tags": ["...", "..."],
  "relevance_score": 7.5,
  "category_slug": "tecnologia",
  "breaking": false
}`

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',  // rápido e barato para volume alto
      max_tokens: 1500,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) throw new Error('No JSON in response')
    return JSON.parse(jsonMatch[0]) as ProcessedArticle
  } catch (err) {
    console.error('Claude processing error:', err)
    return null
  }
}

// ─── Busca categorias do Supabase ─────────────────────────────────────────────

async function getCategoryId(slug: string): Promise<string | null> {
  const { data } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', slug)
    .single()
  return data?.id || null
}

// ─── Processa um item RSS ────────────────────────────────────────────────────

async function processItem(item: RSSItem, source: { id: string; name: string; language: string }) {
  const url = item.link
  if (!url || !item.title) return null

  // Verifica duplicata
  if (await isDuplicate(url)) return null

  const title = cleanText(item.title)
  const content = cleanText(item.contentSnippet || item.content || item.title)

  console.log(`  Processing: ${title.slice(0, 60)}...`)

  // Processa com Claude
  const processed = await processWithClaude(title, content, source.name, source.language as 'pt' | 'en')
  if (!processed) return null

  // Busca category_id
  const categoryId = await getCategoryId(processed.category_slug)

  // Garante slug único
  let finalSlug = processed.slug || slugify(processed.title_en)
  const { data: existing } = await supabase
    .from('articles')
    .select('id')
    .eq('slug', finalSlug)
    .limit(1)
  if (existing?.length) {
    finalSlug = `${finalSlug}-${Date.now().toString(36)}`
  }

  // Determina status automático
  const autoPublish = processed.relevance_score >= 8.0
  const status = autoPublish ? 'published' : 'pending'
  const publishedAt = autoPublish ? new Date().toISOString() : null

  // Salva no Supabase
  const { error } = await supabase.from('articles').insert({
    title_pt: processed.title_pt,
    title_en: processed.title_en,
    slug: finalSlug,
    summary_pt: processed.summary_pt,
    summary_en: processed.summary_en,
    meta_title_pt: processed.meta_title_pt,
    meta_title_en: processed.meta_title_en,
    meta_desc_pt: processed.meta_desc_pt,
    meta_desc_en: processed.meta_desc_en,
    tags: processed.tags,
    source_url: url,
    source_name: source.name,
    source_id: source.id,
    original_lang: source.language,
    category_id: categoryId,
    image_url: extractImage(item),
    relevance_score: processed.relevance_score,
    breaking: processed.breaking,
    status,
    published_at: publishedAt,
    original_pub_at: item.isoDate || item.pubDate || null,
    ai_model: 'claude-haiku-4-5',
  })

  if (error) {
    console.error('  Supabase insert error:', error.message)
    return null
  }

  return { title: finalSlug, status }
}

// ─── Função principal do robô ─────────────────────────────────────────────────

export async function runRobot(options: { maxSources?: number; maxItemsPerSource?: number } = {}) {
  const { maxSources = 50, maxItemsPerSource = 10 } = options

  console.log(`🤖 Robot starting — ${new Date().toISOString()}`)

  // Busca fontes ativas
  const { data: sources, error: sourcesErr } = await supabase
    .from('sources')
    .select('id, name, url, rss_url, language, priority')
    .eq('active', true)
    .order('priority', { ascending: true })
    .limit(maxSources)

  if (sourcesErr || !sources?.length) {
    console.error('No active sources found:', sourcesErr?.message)
    return { processed: 0, published: 0, pending: 0 }
  }

  let processed = 0
  let published = 0
  let pending = 0

  for (const source of sources) {
    const rssUrl = source.rss_url || source.url
    console.log(`\n📡 Fetching: ${source.name} (${rssUrl})`)

    try {
      const feed = await parser.parseURL(rssUrl)
      const items = feed.items.slice(0, maxItemsPerSource)

      for (const item of items) {
        const result = await processItem(item as RSSItem, source)
        if (result) {
          processed++
          if (result.status === 'published') published++
          else pending++
        }
        // Rate limiting — não sobrecarrega a API
        await new Promise(r => setTimeout(r, 500))
      }

      // Atualiza last_fetched
      await supabase
        .from('sources')
        .update({ last_fetched: new Date().toISOString() })
        .eq('id', source.id)

    } catch (err) {
      console.error(`  Error fetching ${source.name}:`, (err as Error).message)
      await supabase
        .from('sources')
        .update({ error_count: supabase.rpc('increment', { row_id: source.id }) })
        .eq('id', source.id)
    }
  }

  console.log(`\n✅ Robot done — Processed: ${processed}, Published: ${published}, Pending: ${pending}`)
  return { processed, published, pending }
}
