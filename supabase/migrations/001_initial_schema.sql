-- Enable pgvector extension for RAG embeddings
create extension if not exists vector;

-- Profiles
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  company_name text,
  avatar_url  text,
  is_demo     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Documents
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null,
  file_path     text,
  file_type     text not null, -- pdf, docx, txt, csv, xlsx
  file_size     bigint,
  document_type text,          -- invoice, contract, email, meeting_notes, spreadsheet, other
  status        text not null default 'uploading', -- uploading | analyzing | ready | error
  raw_text      text,
  analysis      jsonb,
  error_message text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.documents enable row level security;

create policy "Users can view own documents"
  on public.documents for select
  using (auth.uid() = user_id);

create policy "Users can insert own documents"
  on public.documents for insert
  with check (auth.uid() = user_id);

create policy "Users can update own documents"
  on public.documents for update
  using (auth.uid() = user_id);

create policy "Users can delete own documents"
  on public.documents for delete
  using (auth.uid() = user_id);

-- Updated_at trigger
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_updated_at
  before update on public.documents
  for each row execute procedure public.handle_updated_at();

-- Document chunks (RAG — pgvector)
create table public.document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents(id) on delete cascade,
  content       text not null,
  embedding     vector(1536),   -- OpenAI text-embedding-3-small
  chunk_index   int not null,
  created_at    timestamptz not null default now()
);

alter table public.document_chunks enable row level security;

create policy "Users can view own document chunks"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can insert own document chunks"
  on public.document_chunks for insert
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

create policy "Users can delete own document chunks"
  on public.document_chunks for delete
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_id and d.user_id = auth.uid()
    )
  );

-- HNSW index for fast similarity search
create index on public.document_chunks using hnsw (embedding vector_cosine_ops);

-- Match documents function for RAG
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_document_id uuid,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  chunk_index int,
  similarity float
)
language plpgsql as $$
begin
  return query
  select
    dc.id,
    dc.content,
    dc.chunk_index,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.document_id = match_document_id
  order by dc.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Chat messages
create table public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

alter table public.chat_messages enable row level security;

create policy "Users can view own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

create policy "Users can insert own chat messages"
  on public.chat_messages for insert
  with check (auth.uid() = user_id);

-- Email Drafts
create table public.email_drafts (
  id             uuid primary key default gen_random_uuid(),
  document_id    uuid not null references public.documents(id) on delete cascade,
  user_id        uuid not null references public.profiles(id) on delete cascade,
  instruction    text not null,
  draft_content  text not null,
  created_at     timestamptz not null default now()
);

alter table public.email_drafts enable row level security;

create policy "Users can view own email drafts"
  on public.email_drafts for select
  using (auth.uid() = user_id);

create policy "Users can insert own email drafts"
  on public.email_drafts for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own email drafts"
  on public.email_drafts for delete
  using (auth.uid() = user_id);

-- Storage Buckets
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Users can upload own documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can view own documents"
  on storage.objects for select
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete own documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and auth.uid()::text = (storage.foldername(name))[1]);
