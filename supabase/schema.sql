-- ============================================================
-- NEWSBOT — Schema completo do banco de dados
-- Execute no Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: categories (editorias)
-- ============================================================
create table if not exists public.categories (
  id          uuid primary key default uuid_generate_v4(),
  slug        text not null unique,
  name_pt     text not null,
  name_en     text not null,
  description_pt text,
  description_en text,
  color       text not null default '#6366f1',  -- hex color for UI
  icon        text not null default '🌍',
  sort_order  int not null default 0,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

insert into public.categories (slug, name_pt, name_en, color, icon, sort_order) values
  ('mundo',          'Mundo',          'World',           '#ef4444', '🌍', 1),
  ('politica',       'Política',        'Politics',        '#8b5cf6', '🏛️',  2),
  ('economia',       'Economia',        'Economy',         '#10b981', '💰', 3),
  ('tecnologia',     'Tecnologia',      'Technology',      '#3b82f6', '💻', 4),
  ('ciencia',        'Ciência',         'Science',         '#6366f1', '🔬', 5),
  ('saude',          'Saúde',           'Health',          '#14b8a6', '🏥', 6),
  ('esportes',       'Esportes',        'Sports',          '#f97316', '⚽', 7),
  ('entretenimento', 'Entretenimento',  'Entertainment',   '#ec4899', '🎬', 8)
on conflict (slug) do nothing;

-- ============================================================
-- TABELA: sources (fontes de notícias)
-- ============================================================
create table if not exists public.sources (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  url          text not null,
  rss_url      text,
  language     text not null default 'en' check (language in ('pt', 'en', 'es')),
  category_id  uuid references public.categories(id),
  active       boolean not null default true,
  priority     int not null default 5,  -- 1=highest, 10=lowest
  last_fetched timestamptz,
  fetch_count  int not null default 0,
  error_count  int not null default 0,
  created_at   timestamptz not null default now()
);

-- RSS feeds pré-configurados
insert into public.sources (name, url, rss_url, language, priority) values
  -- Fontes globais em inglês
  ('Reuters',            'https://reuters.com',          'https://feeds.reuters.com/reuters/topNews',                     'en', 1),
  ('BBC World',          'https://bbc.com',              'http://feeds.bbci.co.uk/news/world/rss.xml',                    'en', 1),
  ('CNN',                'https://cnn.com',              'http://rss.cnn.com/rss/edition.rss',                           'en', 1),
  ('AP News',            'https://apnews.com',           'https://rsshub.app/apnews/topics/apf-topnews',                  'en', 1),
  ('The Guardian',       'https://theguardian.com',      'https://www.theguardian.com/world/rss',                         'en', 2),
  ('Al Jazeera',         'https://aljazeera.com',        'https://www.aljazeera.com/xml/rss/all.xml',                     'en', 2),
  ('NPR News',           'https://npr.org',              'https://feeds.npr.org/1001/rss.xml',                           'en', 2),
  -- Tecnologia
  ('TechCrunch',         'https://techcrunch.com',       'https://techcrunch.com/feed/',                                  'en', 1),
  ('The Verge',          'https://theverge.com',         'https://www.theverge.com/rss/index.xml',                        'en', 1),
  ('Wired',              'https://wired.com',            'https://www.wired.com/feed/rss',                                'en', 2),
  ('Ars Technica',       'https://arstechnica.com',      'http://feeds.arstechnica.com/arstechnica/index',                'en', 2),
  -- Economia
  ('Financial Times',    'https://ft.com',               'https://www.ft.com/rss/home',                                   'en', 1),
  ('Bloomberg',          'https://bloomberg.com',        'https://feeds.bloomberg.com/markets/news.rss',                  'en', 1),
  -- Ciência
  ('Nature',             'https://nature.com',           'https://www.nature.com/nature.rss',                             'en', 1),
  ('Science Daily',      'https://sciencedaily.com',     'https://www.sciencedaily.com/rss/all.xml',                      'en', 1),
  -- Esportes
  ('ESPN',               'https://espn.com',             'https://www.espn.com/espn/rss/news',                           'en', 1),
  ('BBC Sport',          'https://bbc.com/sport',        'http://feeds.bbci.co.uk/sport/rss.xml',                         'en', 2),
  -- Fontes em português
  ('G1',                 'https://g1.globo.com',         'https://g1.globo.com/rss/g1/index.xml',                         'pt', 1),
  ('Folha de S.Paulo',   'https://folha.uol.com.br',     'https://feeds.folha.uol.com.br/emcimadahora/rss091.xml',        'pt', 1),
  ('UOL Notícias',       'https://noticias.uol.com.br',  'https://rss.uol.com.br/feed/noticias.xml',                      'pt', 1),
  ('BBC Brasil',         'https://bbc.com/portuguese',   'http://www.bbc.co.uk/portuguese/index.xml',                     'pt', 1),
  ('Correio Braziliense','https://correiobraziliense.com.br', 'https://www.correiobraziliense.com.br/rss/',                'pt', 2)
on conflict do nothing;

-- ============================================================
-- TABELA: articles (notícias)
-- ============================================================
create table if not exists public.articles (
  id              uuid primary key default uuid_generate_v4(),
  -- Conteúdo bilíngue
  title_pt        text not null,
  title_en        text not null,
  slug            text not null unique,
  summary_pt      text not null,  -- resumo gerado pela IA em PT
  summary_en      text not null,  -- resumo gerado pela IA em EN
  -- SEO
  meta_title_pt   text,
  meta_title_en   text,
  meta_desc_pt    text,
  meta_desc_en    text,
  tags            text[] default '{}',
  -- Fonte original
  source_url      text not null,
  source_name     text not null,
  source_id       uuid references public.sources(id),
  original_lang   text default 'en',
  -- Categorização
  category_id     uuid references public.categories(id),
  -- Mídia
  image_url       text,
  image_alt       text,
  -- IA / Curadoria
  relevance_score numeric(4,2) default 0,  -- 0-10
  ai_model        text default 'claude',
  -- Status
  status          text not null default 'pending' check (status in ('pending', 'published', 'archived', 'rejected')),
  featured        boolean not null default false,
  featured_order  int,
  breaking        boolean not null default false,
  -- Datas
  published_at    timestamptz,
  original_pub_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- Índices para performance
create index if not exists articles_status_idx on public.articles(status);
create index if not exists articles_category_idx on public.articles(category_id);
create index if not exists articles_published_at_idx on public.articles(published_at desc);
create index if not exists articles_relevance_idx on public.articles(relevance_score desc);
create index if not exists articles_featured_idx on public.articles(featured, featured_order);
create index if not exists articles_slug_idx on public.articles(slug);

-- Trigger para atualizar updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_updated_at
  before update on public.articles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- TABELA: profiles (usuários)
-- ============================================================
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  avatar_url  text,
  role        text not null default 'reader' check (role in ('reader', 'editor', 'admin')),
  created_at  timestamptz not null default now()
);

-- Auto-criar perfil quando usuário faz signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- TABELA: comments (comentários)
-- ============================================================
create table if not exists public.comments (
  id          uuid primary key default uuid_generate_v4(),
  article_id  uuid not null references public.articles(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  content     text not null check (char_length(content) between 1 and 2000),
  parent_id   uuid references public.comments(id) on delete cascade,  -- para replies
  likes       int not null default 0,
  status      text not null default 'published' check (status in ('published', 'hidden', 'flagged')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists comments_article_idx on public.comments(article_id);
create index if not exists comments_user_idx on public.comments(user_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Articles: públicos para leitura, só admin/editor para escrita
alter table public.articles enable row level security;

create policy "articles_public_read" on public.articles
  for select using (status = 'published');

create policy "articles_admin_all" on public.articles
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('admin', 'editor')
    )
  );

-- Sources: leitura pública, escrita apenas admin
alter table public.sources enable row level security;

create policy "sources_public_read" on public.sources
  for select using (true);

create policy "sources_admin_write" on public.sources
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Categories: públicas para leitura
alter table public.categories enable row level security;

create policy "categories_public_read" on public.categories
  for select using (true);

-- Profiles: usuário vê/edita só o próprio; admin vê todos
alter table public.profiles enable row level security;

create policy "profiles_own_read" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles_own_update" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_admin_all" on public.profiles
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Comments: publicados são públicos, usuário gerencia os próprios
alter table public.comments enable row level security;

create policy "comments_public_read" on public.comments
  for select using (status = 'published');

create policy "comments_authenticated_insert" on public.comments
  for insert with check (auth.uid() = user_id);

create policy "comments_own_update" on public.comments
  for update using (auth.uid() = user_id);

create policy "comments_admin_all" on public.comments
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and role in ('admin', 'editor'))
  );

-- ============================================================
-- VIEW: articles com contagem de comentários
-- ============================================================
create or replace view public.articles_with_stats as
select
  a.*,
  c.slug         as category_slug,
  c.name_pt      as category_name_pt,
  c.name_en      as category_name_en,
  c.color        as category_color,
  c.icon         as category_icon,
  count(cm.id)   as comment_count
from public.articles a
left join public.categories c on a.category_id = c.id
left join public.comments cm on a.id = cm.article_id and cm.status = 'published'
where a.status = 'published'
group by a.id, c.id;

-- ============================================================
-- FUNÇÃO: busca full-text nas notícias
-- ============================================================
alter table public.articles add column if not exists
  search_vector tsvector
  generated always as (
    to_tsvector('portuguese', coalesce(title_pt, '')) ||
    to_tsvector('english', coalesce(title_en, '')) ||
    to_tsvector('portuguese', coalesce(summary_pt, '')) ||
    to_tsvector('english', coalesce(summary_en, ''))
  ) stored;

create index if not exists articles_search_idx on public.articles using gin(search_vector);
