'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { CATEGORIES, type Lang } from '@/lib/categories'
import { Menu, X, Search, Globe } from 'lucide-react'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'

export default function Header() {
  const [lang, setLang] = useState<Lang>('pt')
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('lang') as Lang
    if (stored === 'en' || stored === 'pt') setLang(stored)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function toggleLang() {
    const next = lang === 'pt' ? 'en' : 'pt'
    setLang(next)
    localStorage.setItem('lang', next)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/${lang}/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className={`sticky top-0 z-50 bg-white transition-shadow ${scrolled ? 'shadow-md' : 'border-b border-slate-100'}`}>
      {/* Top bar — breaking news ticker */}
      <div className="bg-red-600 text-white text-xs py-1 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3">
          <span className="font-bold uppercase tracking-wider breaking-pulse shrink-0">
            {lang === 'pt' ? '🔴 AO VIVO' : '🔴 LIVE'}
          </span>
          <span className="truncate opacity-90">
            {lang === 'pt'
              ? 'Notícias atualizadas em tempo real de todo o mundo · 24 horas por dia'
              : 'Real-time news from around the world · 24 hours a day'}
          </span>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href={`/${lang}`} className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center">
              <span className="text-white font-black text-sm">W</span>
            </div>
            <span className="font-black text-xl text-slate-900 group-hover:text-red-600 transition-colors">
              {siteName}
            </span>
          </Link>

          {/* Desktop nav actions */}
          <div className="hidden md:flex items-center gap-3">
            {/* Search */}
            {searchOpen ? (
              <form onSubmit={handleSearch} className="flex items-center gap-2">
                <input
                  autoFocus
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder={lang === 'pt' ? 'Buscar notícias...' : 'Search news...'}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                <button type="button" onClick={() => setSearchOpen(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={18} />
                </button>
              </form>
            ) : (
              <button
                onClick={() => setSearchOpen(true)}
                className="p-2 text-slate-500 hover:text-red-600 transition-colors"
                aria-label="Buscar"
              >
                <Search size={18} />
              </button>
            )}

            {/* Language toggle */}
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 text-sm font-medium text-slate-600 hover:border-red-400 hover:text-red-600 transition-all"
            >
              <Globe size={14} />
              {lang === 'pt' ? 'EN' : 'PT'}
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Category nav */}
      <nav className="border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto scrollbar-none">
            <Link
              href={`/${lang}`}
              className="shrink-0 px-4 py-3 text-sm font-semibold text-slate-700 hover:text-red-600 border-b-2 border-transparent hover:border-red-600 transition-all"
            >
              {lang === 'pt' ? 'Início' : 'Home'}
            </Link>
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/${lang}/${cat.slug}`}
                className="shrink-0 px-3 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 border-b-2 border-transparent transition-all"
                style={{ ['--cat-color' as string]: cat.color }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderBottomColor = cat.color
                  el.style.color = cat.color
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLAnchorElement
                  el.style.borderBottomColor = 'transparent'
                  el.style.color = ''
                }}
              >
                <span className="mr-1">{cat.icon}</span>
                {lang === 'pt' ? cat.name_pt : cat.name_en}
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white py-4 px-4">
          <form onSubmit={handleSearch} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={lang === 'pt' ? 'Buscar notícias...' : 'Search news...'}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
            />
            <button type="submit" className="px-3 py-2 bg-red-600 text-white rounded-lg text-sm">
              <Search size={16} />
            </button>
          </form>
          <div className="grid grid-cols-2 gap-2">
            {CATEGORIES.map(cat => (
              <Link
                key={cat.slug}
                href={`/${lang}/${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                <span>{cat.icon}</span>
                {lang === 'pt' ? cat.name_pt : cat.name_en}
              </Link>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100">
            <button onClick={toggleLang} className="flex items-center gap-2 text-sm text-slate-600">
              <Globe size={14} />
              {lang === 'pt' ? 'Switch to English' : 'Mudar para Português'}
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
