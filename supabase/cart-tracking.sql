-- Extension "Paniers" — tracking des paniers d'achat en ligne.
-- À exécuter une fois dans le SQL Editor du projet Supabase, APRÈS
-- schema.sql (dépend de public.users et public.set_updated_at()).
--
-- Conventions reprises de schema.sql : colonnes camelCase entre
-- guillemets, colonne de relation "user" stockant directement l'id lié,
-- created/updated + trigger set_updated_at, RLS ouverte aux authentifiés
-- (l'outil reste un outil d'équipe, comme articles/actions).

-- =============================================================================
-- Tables
-- =============================================================================

create table public.cart_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- URL de la page produit (source de vérité pour le re-scraping).
  url text not null,
  -- Marchand normalisé (hostname sans "www.", ex: "amazon.fr") — sert de
  -- clé de regroupement des paniers côté client.
  merchant text not null,
  -- URL absolue de l'image produit (og:image / JSON-LD), jamais un upload.
  image text,
  price numeric check (price >= 0),
  currency text not null default 'XAF',
  quantity integer not null default 1 check (quantity >= 1),
  status text not null default 'À acheter' check (
    status in ('À acheter', 'Acheté', 'Abandonné')
  ),
  notes text,
  "user" uuid not null references public.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- Historique de prix : un point par changement de price détecté (ajout
-- initial inclus), alimenté uniquement par le trigger ci-dessous.
create table public.cart_item_prices (
  id uuid primary key default gen_random_uuid(),
  "cartItem" uuid not null references public.cart_items (id) on delete cascade,
  price numeric not null check (price >= 0),
  recorded timestamptz not null default now()
);

create index cart_item_prices_item_idx
  on public.cart_item_prices ("cartItem", recorded desc);

-- =============================================================================
-- updated (cf. set_updated_at() dans schema.sql)
-- =============================================================================

create trigger set_cart_items_updated_at
  before update on public.cart_items
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Historisation automatique du prix : à l'insertion et à chaque
-- changement effectif de price, un point est ajouté dans
-- cart_item_prices. L'application ne doit jamais écrire cette table
-- directement.
-- =============================================================================

create or replace function public.record_cart_item_price()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.price is null then
    return new;
  end if;

  if tg_op = 'INSERT' or new.price is distinct from old.price then
    insert into public.cart_item_prices ("cartItem", price)
    values (new.id, new.price);
  end if;

  return new;
end;
$$;

drop trigger if exists cart_items_price_history_trigger on public.cart_items;
create trigger cart_items_price_history_trigger
  after insert or update on public.cart_items
  for each row execute function public.record_cart_item_price();

-- =============================================================================
-- RLS — même règle que priorities/actions/articles : CRUD ouvert à tout
-- compte authentifié. cart_item_prices est en lecture seule côté client
-- (écriture uniquement via le trigger security definer ci-dessus).
-- =============================================================================

alter table public.cart_items enable row level security;
alter table public.cart_item_prices enable row level security;

create policy "cart_items_all_authenticated" on public.cart_items
  for all to authenticated using (true) with check (true);

create policy "cart_item_prices_select_authenticated" on public.cart_item_prices
  for select to authenticated using (true);
