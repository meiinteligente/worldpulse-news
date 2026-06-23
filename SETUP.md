# WorldPulse — Guia de Setup

## 1. Variáveis de Ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Valores necessários:
- `NEXT_PUBLIC_SUPABASE_URL` — URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Chave anon do Supabase
- `SUPABASE_SERVICE_ROLE_KEY` — Chave service role (secreta, só no servidor)
- `ANTHROPIC_API_KEY` — Chave da API Claude (console.anthropic.com)
- `CRON_SECRET` — Qualquer string aleatória para proteger o endpoint do robô
- `NEXT_PUBLIC_SITE_NAME` — Nome do portal (ex: WorldPulse)
- `NEXT_PUBLIC_SITE_URL` — URL do site em produção

## 2. Banco de Dados (Supabase)

1. Acesse seu projeto no Supabase (supabase.com)
2. Vá em **SQL Editor**
3. Abra o arquivo `supabase/schema.sql`
4. Cole e execute — cria todas as tabelas, índices e permissões

## 3. Rodar localmente

```bash
npm install
npm run dev
```

Acesse:
- `http://localhost:3000` → redireciona para `/pt`
- `http://localhost:3000/pt` → Homepage PT
- `http://localhost:3000/en` → Homepage EN
- `http://localhost:3000/admin` → Dashboard de curadoria

## 4. Disparar o robô pela primeira vez

```bash
curl -X POST http://localhost:3000/api/robot \
  -H "Authorization: Bearer SEU_CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"maxSources": 5, "maxItemsPerSource": 3}'
```

Ou simplesmente clique em **"Rodar Robô"** no dashboard `/admin`.

## 5. Deploy no Vercel

```bash
npx vercel --prod
```

Configure as variáveis de ambiente no painel Vercel.

O `vercel.json` já configura o **Cron Job automático a cada 15 minutos** — o robô roda sozinho em produção.

## 6. Google AdSense

1. Acesse admob.google.com ou adsense.google.com
2. Adicione seu site e aguarde aprovação (normalmente 1-7 dias)
3. Insira o código do AdSense no `src/app/layout.tsx` dentro do `<head>`
4. Substitua os placeholders "Espaço para anúncio" nos componentes pelos snippets reais

## 7. Google Search Console

1. Acesse search.google.com/search-console
2. Adicione sua propriedade
3. Envie o sitemap: `https://seusite.com/sitemap.xml`
4. O sitemap é gerado automaticamente e atualizado a cada hora

## Estrutura

```
src/
├── app/
│   ├── [lang]/               # /pt e /en
│   │   ├── page.tsx          # Homepage por idioma
│   │   ├── [category]/       # /pt/tecnologia
│   │   │   ├── page.tsx      # Listagem da editoria
│   │   │   └── [slug]/
│   │   │       └── page.tsx  # Artigo individual
│   ├── admin/page.tsx        # Dashboard de curadoria
│   ├── api/robot/route.ts    # Endpoint do robô (cron)
│   └── sitemap.ts            # Sitemap XML automático
├── components/
│   ├── layout/Header.tsx     # Cabeçalho com nav de editorias
│   ├── layout/Footer.tsx     # Rodapé
│   └── news/
│       ├── ArticleCard.tsx   # Card de notícia (4 tamanhos)
│       ├── CategorySection.tsx # Seção de editoria na home
│       └── TickerBar.tsx     # Ticker de últimas notícias
└── lib/
    ├── supabase.ts           # Client + tipos
    ├── categories.ts         # Config de editorias + utilitários
    └── robot.ts              # Motor de coleta + Claude AI
```
