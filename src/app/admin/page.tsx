'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { CATEGORIES } from '@/lib/categories'
import { formatTimeAgo } from '@/lib/categories'
import type { Article } from '@/lib/supabase'
import {
  CheckCircle, XCircle, Star, Zap, RefreshCw, Play,
  BarChart3, Clock, Globe, ArrowUpDown, Filter
} from 'lucide-react'

type StatusFilter = 'pending' | 'published' | 'all'
type SortBy = 'relevance' | 'time'

export default function AdminDashboard() {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [sortBy, setSortBy] = useState<SortBy>('relevance')
  const [stats, setStats] = useState({ pending: 0, published: 0, total: 0 })
  const [lastRun, setLastRun] = useState<string | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const fetchArticles = useCallback(async () => {
    setLoading(true)
    let query = supabase
      .from('articles')
      .select(`
        *,
        categories:category_id (slug, name_pt, name_en, color, icon)
      `)

    if (statusFilter !== 'all') query = query.eq('status', statusFilter)
    if (categoryFilter !== 'all') {
      const cat = CATEGORIES.find(c => c.slug === categoryFilter)
      if (cat) query = query.eq('category_id', cat.slug)
    }

    query = sortBy === 'relevance'
      ? query.order('relevance_score', { ascending: false })
      : query.order('created_at', { ascending: false })

    query = query.limit(100)

    const { data } = await query
    setArticles((data || []) as Article[])
    setLoading(false)
  }, [statusFilter, categoryFilter, sortBy])

  const fetchStats = useCallback(async () => {
    const [pending, published, total] = await Promise.all([
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
      supabase.from('articles').select('id', { count: 'exact', head: true }),
    ])
    setStats({
      pending: pending.count || 0,
      published: published.count || 0,
      total: total.count || 0,
    })
  }, [])

  useEffect(() => {
    fetchArticles()
    fetchStats()
  }, [fetchArticles, fetchStats])

  async function triggerRobot() {
    setRunning(true)
    try {
      const res = await fetch('/api/robot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || ''}`,
        },
        body: JSON.stringify({ maxSources: 20, maxItemsPerSource: 5 }),
      })
      const data = await res.json()
      setLastRun(`Processados: ${data.processed}, Publicados: ${data.published}, Pendentes: ${data.pending}`)
      fetchArticles()
      fetchStats()
    } catch {
      setLastRun('Erro ao executar o robô')
    }
    setRunning(false)
  }

  async function updateStatus(id: string, status: 'published' | 'rejected' | 'archived') {
    const update: Record<string, unknown> = { status }
    if (status === 'published') update.published_at = new Date().toISOString()
    await supabase.from('articles').update(update).eq('id', id)
    setArticles(prev => prev.filter(a => a.id !== id))
    fetchStats()
  }

  async function toggleFeatured(id: string, featured: boolean) {
    await supabase.from('articles').update({ featured: !featured }).eq('id', id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, featured: !featured } : a))
  }

  async function toggleBreaking(id: string, breaking: boolean) {
    await supabase.from('articles').update({ breaking: !breaking }).eq('id', id)
    setArticles(prev => prev.map(a => a.id === id ? { ...a, breaking: !breaking } : a))
  }

  async function bulkPublish() {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => updateStatus(id, 'published')))
    setSelected(new Set())
  }

  async function bulkReject() {
    const ids = Array.from(selected)
    await Promise.all(ids.map(id => updateStatus(id, 'rejected')))
    setSelected(new Set())
  }

  const scoreColor = (score: number) => {
    if (score >= 8) return '#10b981'
    if (score >= 6) return '#f59e0b'
    return '#94a3b8'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <div>
              <h1 className="font-black text-xl text-slate-900">Curadoria</h1>
              <p className="text-xs text-slate-500">Dashboard editorial</p>
            </div>
          </div>
          <button
            onClick={triggerRobot}
            disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {running ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
            {running ? 'Coletando...' : 'Rodar Robô'}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <Clock size={16} className="text-amber-500" />
              <span className="text-sm text-slate-500">Pendentes</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-emerald-500" />
              <span className="text-sm text-slate-500">Publicados</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.published}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-100">
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 size={16} className="text-blue-500" />
              <span className="text-sm text-slate-500">Total</span>
            </div>
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
          </div>
        </div>

        {lastRun && (
          <div className="mb-4 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
            ✅ {lastRun}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-4">
          {/* Status */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
            {(['pending', 'published', 'all'] as StatusFilter[]).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  statusFilter === s ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {s === 'pending' ? 'Pendentes' : s === 'published' ? 'Publicados' : 'Todos'}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg px-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-sm text-slate-700 border-none bg-transparent py-1.5 focus:outline-none"
            >
              <option value="all">Todas editorias</option>
              {CATEGORIES.map(cat => (
                <option key={cat.slug} value={cat.slug}>{cat.icon} {cat.name_pt}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSortBy(s => s === 'relevance' ? 'time' : 'relevance')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
          >
            <ArrowUpDown size={14} />
            {sortBy === 'relevance' ? 'Por relevância' : 'Por data'}
          </button>

          {/* Bulk actions */}
          {selected.size > 0 && (
            <div className="flex gap-2 ml-auto">
              <span className="self-center text-sm text-slate-500">{selected.size} selecionados</span>
              <button
                onClick={bulkPublish}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
              >
                Publicar todos
              </button>
              <button
                onClick={bulkReject}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200"
              >
                Rejeitar todos
              </button>
            </div>
          )}
        </div>

        {/* Articles list */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Carregando...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-slate-500">Nenhuma notícia nesta fila.</p>
            <p className="text-sm text-slate-400 mt-1">Rode o robô para coletar novas notícias.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {articles.map(article => {
              const catColor = article.category_color || '#6366f1'
              const catName = article.category_name_pt || 'Geral'
              const catIcon = article.category_icon || '📰'
              const isSelected = selected.has(article.id)

              return (
                <div
                  key={article.id}
                  className={`bg-white rounded-xl border transition-all ${
                    isSelected ? 'border-blue-300 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-start gap-4 p-4">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        const next = new Set(selected)
                        isSelected ? next.delete(article.id) : next.add(article.id)
                        setSelected(next)
                      }}
                      className="mt-1 rounded"
                    />

                    {/* Relevance score */}
                    <div
                      className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-white font-black text-sm"
                      style={{ backgroundColor: scoreColor(article.relevance_score) }}
                    >
                      {article.relevance_score.toFixed(1)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="text-xs font-bold uppercase px-2 py-0.5 rounded-full text-white"
                          style={{ backgroundColor: catColor }}
                        >
                          {catIcon} {catName}
                        </span>
                        {article.breaking && (
                          <span className="text-xs bg-red-100 text-red-600 font-bold px-1.5 py-0.5 rounded">
                            URGENTE
                          </span>
                        )}
                        {article.featured && (
                          <span className="text-xs bg-amber-100 text-amber-700 font-bold px-1.5 py-0.5 rounded">
                            ⭐ DESTAQUE
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-slate-900 text-sm leading-snug mb-0.5">
                        {article.title_pt}
                      </h3>
                      <p className="text-xs text-slate-400 mb-2 line-clamp-1">
                        🇺🇸 {article.title_en}
                      </p>
                      <p className="text-xs text-slate-500 line-clamp-2 mb-2">{article.summary_pt}</p>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1"><Globe size={11} />{article.source_name}</span>
                        <span className="flex items-center gap-1"><Clock size={11} />{formatTimeAgo(article.created_at, 'pt')}</span>
                        <a
                          href={article.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline"
                        >
                          Ver original
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => toggleFeatured(article.id, article.featured)}
                        title="Destaque"
                        className={`p-2 rounded-lg transition-colors ${
                          article.featured
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-slate-100 text-slate-400 hover:text-amber-500'
                        }`}
                      >
                        <Star size={15} />
                      </button>
                      <button
                        onClick={() => toggleBreaking(article.id, article.breaking)}
                        title="Urgente"
                        className={`p-2 rounded-lg transition-colors ${
                          article.breaking
                            ? 'bg-red-100 text-red-600'
                            : 'bg-slate-100 text-slate-400 hover:text-red-500'
                        }`}
                      >
                        <Zap size={15} />
                      </button>
                      {article.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateStatus(article.id, 'published')}
                            className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                            title="Publicar"
                          >
                            <CheckCircle size={15} />
                          </button>
                          <button
                            onClick={() => updateStatus(article.id, 'rejected')}
                            className="p-2 bg-red-100 text-red-500 rounded-lg hover:bg-red-200 transition-colors"
                            title="Rejeitar"
                          >
                            <XCircle size={15} />
                          </button>
                        </>
                      )}
                      {article.status === 'published' && (
                        <button
                          onClick={() => updateStatus(article.id, 'archived')}
                          className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-lg text-xs hover:bg-slate-200 transition-colors"
                        >
                          Arquivar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
