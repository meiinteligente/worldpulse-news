// Cache estático das categorias (evita query extra em todo render)
export const CATEGORIES = [
  { slug: 'mundo',          name_pt: 'Mundo',          name_en: 'World',          color: '#ef4444', icon: '🌍', sort_order: 1 },
  { slug: 'politica',       name_pt: 'Política',        name_en: 'Politics',       color: '#8b5cf6', icon: '🏛️',  sort_order: 2 },
  { slug: 'economia',       name_pt: 'Economia',        name_en: 'Economy',        color: '#10b981', icon: '💰', sort_order: 3 },
  { slug: 'tecnologia',     name_pt: 'Tecnologia',      name_en: 'Technology',     color: '#3b82f6', icon: '💻', sort_order: 4 },
  { slug: 'ciencia',        name_pt: 'Ciência',         name_en: 'Science',        color: '#6366f1', icon: '🔬', sort_order: 5 },
  { slug: 'saude',          name_pt: 'Saúde',           name_en: 'Health',         color: '#14b8a6', icon: '🏥', sort_order: 6 },
  { slug: 'esportes',       name_pt: 'Esportes',        name_en: 'Sports',         color: '#f97316', icon: '⚽', sort_order: 7 },
  { slug: 'entretenimento', name_pt: 'Entretenimento',  name_en: 'Entertainment',  color: '#ec4899', icon: '🎬', sort_order: 8 },
]

export function getCategoryBySlug(slug: string) {
  return CATEGORIES.find(c => c.slug === slug)
}

export function getCategoryLabel(slug: string, lang: 'pt' | 'en') {
  const cat = getCategoryBySlug(slug)
  if (!cat) return slug
  return lang === 'pt' ? cat.name_pt : cat.name_en
}

export type Lang = 'pt' | 'en'

export const LANG_LABELS: Record<Lang, string> = {
  pt: 'PT',
  en: 'EN',
}

export function formatTimeAgo(dateStr: string, lang: Lang): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (lang === 'pt') {
    if (diffMin < 2) return 'agora mesmo'
    if (diffMin < 60) return `${diffMin} min atrás`
    if (diffHrs < 24) return `${diffHrs}h atrás`
    if (diffDays < 7) return `${diffDays}d atrás`
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  } else {
    if (diffMin < 2) return 'just now'
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHrs < 24) return `${diffHrs}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
}
