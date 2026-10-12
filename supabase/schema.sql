-- HAN O UC - SUPABASE SETUP
-- Run this once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  emoji text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  brand text,
  short_description text,
  description text,
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  image_url text,
  is_preorder boolean not null default false,
  preorder_note text,
  sale_start timestamptz,
  sale_end timestamptz,
  is_featured boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;

-- Everyone can view shop content.
drop policy if exists "Public read categories" on public.categories;
create policy "Public read categories" on public.categories for select using (true);
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products" on public.products for select using (is_active = true or auth.role() = 'authenticated');

-- Only authenticated users can change catalogue data.
-- IMPORTANT: keep Supabase self-signup disabled and create your admin account manually.
drop policy if exists "Admin insert categories" on public.categories;
create policy "Admin insert categories" on public.categories for insert to authenticated with check (true);
drop policy if exists "Admin update categories" on public.categories;
create policy "Admin update categories" on public.categories for update to authenticated using (true) with check (true);
drop policy if exists "Admin delete categories" on public.categories;
create policy "Admin delete categories" on public.categories for delete to authenticated using (true);

drop policy if exists "Admin insert products" on public.products;
create policy "Admin insert products" on public.products for insert to authenticated with check (true);
drop policy if exists "Admin update products" on public.products;
create policy "Admin update products" on public.products for update to authenticated using (true) with check (true);
drop policy if exists "Admin delete products" on public.products;
create policy "Admin delete products" on public.products for delete to authenticated using (true);

-- Product image bucket.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "Public view product images" on storage.objects;
create policy "Public view product images" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "Admin upload product images" on storage.objects;
create policy "Admin upload product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images');
drop policy if exists "Admin update product images" on storage.objects;
create policy "Admin update product images" on storage.objects for update to authenticated using (bucket_id = 'product-images');
drop policy if exists "Admin delete product images" on storage.objects;
create policy "Admin delete product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images');

-- Starter categories (safe to edit/delete later).
insert into public.categories (name, slug, emoji, sort_order) values
  ('Vitamins & Supplements', 'vitamins-supplements', '🍊', 1),
  ('Skin Care', 'skin-care', '🧴', 2),
  ('Hair Care', 'hair-care', '🫧', 3),
  ('Body Care', 'body-care', '🌸', 4),
  ('For Kids', 'for-kids', '🧸', 5),
  ('Gifts', 'gifts', '🎁', 6)
on conflict (slug) do nothing;
