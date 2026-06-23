import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client com service role (apenas em server components/API routes)
export function createServerClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

// ====== Types ======
export type Category = {
  id: string
  slug: string
  name_pt: string
  name_en: string
  description_pt?: string
  description_en?: string
  color: string
  icon: string
  sort_order: number
  active: boolean
}

export type Article = {
  id: string
  title_pt: string
  title_en: string
  slug: string
  summary_pt: string
  summary_en: string
  meta_title_pt?: string
  meta_title_en?: string
  meta_desc_pt?: string
  meta_desc_en?: string
  tags: string[]
  source_url: string
  source_name: string
  image_url?: string
  image_alt?: string
  relevance_score: number
  status: 'pending' | 'published' | 'archived' | 'rejected'
  featured: boolean
  featured_order?: number
  breaking: boolean
  published_at?: string
  original_pub_at?: string
  created_at: string
  // Joined
  category_id?: string
  category_slug?: string
  category_name_pt?: string
  category_name_en?: string
  category_color?: string
  category_icon?: string
  comment_count?: number
}

export type Comment = {
  id: string
  article_id: string
  user_id: string
  content: string
  parent_id?: string
  likes: number
  status: string
  created_at: string
  profiles?: {
    name: string
    avatar_url?: string
  }
}

export type Profile = {
  id: string
  email?: string
  name?: string
  avatar_url?: string
  role: 'reader' | 'editor' | 'admin'
}

// ====== Helper: nome da categoria no idioma correto ======
export function getCategoryName(cat: Category | null | undefined, lang: 'pt' | 'en') {
  if (!cat) return ''
  return lang === 'pt' ? cat.name_pt : cat.name_en
}

export function getArticleTitle(article: Article, lang: 'pt' | 'en') {
  return lang === 'pt' ? article.title_pt : article.title_en
}

export function getArticleSummary(article: Article, lang: 'pt' | 'en') {
  return lang === 'pt' ? article.summary_pt : article.summary_en
}
