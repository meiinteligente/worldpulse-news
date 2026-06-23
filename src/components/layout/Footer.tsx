import Link from 'next/link'
import { CATEGORIES } from '@/lib/categories'

const siteName = process.env.NEXT_PUBLIC_SITE_NAME || 'WorldPulse'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-slate-900 text-slate-400 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 bg-red-600 rounded flex items-center justify-center">
                <span className="text-white font-black text-xs">W</span>
              </div>
              <span className="text-white font-black text-lg">{siteName}</span>
            </div>
            <p className="text-sm leading-relaxed">
              As notícias mais relevantes do mundo, processadas por inteligência artificial e curadas por editores.
            </p>
            <p className="text-sm mt-3 text-slate-500">
              The world&apos;s most relevant news, powered by AI.
            </p>
          </div>

          {/* Editorias PT */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Editorias</h3>
            <ul className="space-y-2">
              {CATEGORIES.slice(0, 4).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/pt/${cat.slug}`} className="text-sm hover:text-white transition-colors">
                    {cat.icon} {cat.name_pt}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Editorias EN */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Sections</h3>
            <ul className="space-y-2">
              {CATEGORIES.slice(4).map(cat => (
                <li key={cat.slug}>
                  <Link href={`/en/${cat.slug}`} className="text-sm hover:text-white transition-colors">
                    {cat.icon} {cat.name_en}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Info</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/pt/sobre" className="hover:text-white transition-colors">Sobre nós</Link></li>
              <li><Link href="/en/about" className="hover:text-white transition-colors">About us</Link></li>
              <li><Link href="/pt/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link href="/pt/contato" className="hover:text-white transition-colors">Contato</Link></li>
              <li><a href="/sitemap.xml" className="hover:text-white transition-colors">Sitemap</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {year} {siteName}. Conteúdo gerado por IA com curadoria editorial. Fontes sempre citadas.
          </p>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span>🤖 Powered by Claude AI</span>
            <span>·</span>
            <span>⚡ Atualizado 24/7</span>
            <span>·</span>
            <span>🌍 100+ fontes globais</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
