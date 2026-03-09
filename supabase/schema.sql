create extension if not exists pgcrypto;

create table if not exists public.site_content (
  id text primary key,
  content jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.media_library (
  id text primary key,
  kind text not null check (kind in ('image', 'document')),
  name text not null,
  url text not null,
  storage_key text,
  mime_type text not null,
  size bigint not null default 0,
  uploaded_at timestamptz not null default now()
);

create index if not exists media_library_uploaded_at_idx
  on public.media_library (uploaded_at desc);
