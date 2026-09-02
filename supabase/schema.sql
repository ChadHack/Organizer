-- Schéma Supabase pour Organizer — traduction 1:1 des collections
-- PocketBase (voir pb_migrations/ dans l'historique git). Noms de champs
-- conservés à l'identique, y compris les colonnes de relation ("user",
-- "priority", "action") qui stockent directement l'id lié, comme
-- PocketBase. À exécuter une fois dans le SQL Editor du projet Supabase.

create extension if not exists pgcrypto;

-- =============================================================================
-- Tables
-- =============================================================================

-- Table applicative séparée de auth.users (qui reste la source de vérité de
-- l'authentification). Alimentée automatiquement par le trigger
-- handle_new_user() ci-dessous, comme le provisioning au premier login
-- OAuth2 de PocketBase.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null default '',
  "isAdmin" boolean not null default false,
  avatar text,
  status boolean not null default true,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- Pas de colonne "user" : une priorité n'appartient à personne, elle n'est
-- liée qu'aux articles qui la référencent (articles.priority).
create table public.priorities (
  id uuid primary key default gen_random_uuid(),
  priority integer not null unique,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table public.actions (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  status text not null check (
    status in ('En attente', 'En cours', 'Terminée', 'Annulée')
  ),
  -- Dérivé automatiquement des articles liés par le trigger de synchro
  -- ci-dessous (Règles 1-4) — jamais écrit directement par l'application.
  cost numeric not null default 0 check (cost >= 0),
  "user" uuid not null references public.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

create table public.articles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text not null,
  -- URL publique Supabase Storage (bucket article-images), ou null.
  image text,
  link text,
  price numeric check (price >= 0),
  quantity integer not null,
  status text not null check (
    status in ('En attente', 'En cours', 'Bouclé', 'Annulé')
  ),
  "estimateDate" timestamptz not null,
  -- Relation requise, cascadeDelete:false côté PocketBase : bloque la
  -- suppression d'une priorité encore référencée.
  "priority" uuid not null references public.priorities (id) on delete restrict,
  -- Relation optionnelle, cascadeDelete:false côté PocketBase : la
  -- référence est simplement vidée quand l'action est supprimée.
  "action" uuid references public.actions (id) on delete set null,
  "imageUrl" text,
  "user" uuid not null references public.users (id) on delete cascade,
  created timestamptz not null default now(),
  updated timestamptz not null default now()
);

-- =============================================================================
-- updated: équivalent du champ autodate PocketBase (onCreate + onUpdate)
-- =============================================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated = now();
  return new;
end;
$$;

create trigger set_users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger set_priorities_updated_at
  before update on public.priorities
  for each row execute function public.set_updated_at();

create trigger set_actions_updated_at
  before update on public.actions
  for each row execute function public.set_updated_at();

create trigger set_articles_updated_at
  before update on public.articles
  for each row execute function public.set_updated_at();

-- =============================================================================
-- Provisioning automatique au premier login OAuth2 (équivalent PocketBase
-- authWithOAuth2 : création du compte "users" au premier login). Le compte
-- est actif par défaut (status=true) ; un admin peut le désactiver ensuite.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, email, avatar, status, "isAdmin")
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'user_name',
      split_part(new.email, '@', 1)
    ),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url',
    true,
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Synchro actions.cost/status depuis les articles liés — portage exact de
-- pb_hooks/lib/article-action-sync.cjs (Règles 1-4, cf. src/lib/article-action-sync.ts
-- pour la référence lisible/testée de ces règles).
-- security definer : s'exécute avec les mêmes privilèges que le hook JSVM
-- PocketBase, qui contournait les règles d'API.
-- =============================================================================

create or replace function public.sync_action_from_articles(p_action_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cost numeric;
  v_current_status text;
  v_new_status text;
  v_has_active boolean;
  v_all_boucle boolean;
  v_has_progress boolean;
begin
  if p_action_id is null then
    return;
  end if;

  select status into v_current_status from public.actions where id = p_action_id;
  if not found then
    return;
  end if;

  -- Règle 1 : somme des price des articles non "Annulé" (sans price = 0).
  select coalesce(sum(price) filter (where status <> 'Annulé'), 0)
    into v_cost
    from public.articles
    where "action" = p_action_id;

  -- Règles 2-4 : statut dérivé, en ignorant les articles "Annulé". Le
  -- statut "Annulée" de l'action n'est jamais écrasé, et si l'action n'a
  -- aucun article exploitable, son statut actuel est conservé.
  if v_current_status = 'Annulée' then
    v_new_status := v_current_status;
  else
    select exists(
      select 1 from public.articles
      where "action" = p_action_id and status <> 'Annulé'
    ) into v_has_active;

    if not v_has_active then
      v_new_status := v_current_status;
    else
      select bool_and(status = 'Bouclé')
        into v_all_boucle
        from public.articles
        where "action" = p_action_id and status <> 'Annulé';

      if v_all_boucle then
        v_new_status := 'Terminée';
      else
        select bool_or(status in ('En cours', 'Bouclé'))
          into v_has_progress
          from public.articles
          where "action" = p_action_id and status <> 'Annulé';

        v_new_status := case when v_has_progress then 'En cours' else 'En attente' end;
      end if;
    end if;
  end if;

  update public.actions
    set cost = v_cost, status = v_new_status
    where id = p_action_id
      and (cost is distinct from v_cost or status is distinct from v_new_status);
end;
$$;

create or replace function public.articles_action_sync()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.sync_action_from_articles(old."action");
    return old;
  end if;

  perform public.sync_action_from_articles(new."action");

  -- Sur une mise à jour, l'article peut avoir changé d'action : l'ancienne
  -- action doit aussi être recalculée (elle a perdu cet article).
  if tg_op = 'UPDATE' and old."action" is distinct from new."action" then
    perform public.sync_action_from_articles(old."action");
  end if;

  return new;
end;
$$;

drop trigger if exists articles_action_sync_trigger on public.articles;
create trigger articles_action_sync_trigger
  after insert or update or delete on public.articles
  for each row execute function public.articles_action_sync();

-- =============================================================================
-- RLS — reproduit pb_migrations/1788260300_secured_business_collections.js
-- et 1788260400_secured_users_mutations.js
-- =============================================================================

alter table public.users enable row level security;
alter table public.priorities enable row level security;
alter table public.actions enable row level security;
alter table public.articles enable row level security;

-- users : lecture ouverte à tout compte authentifié (plusieurs écrans
-- expand la relation "user" d'enregistrements d'autres membres), mais
-- écriture (update/delete) réservée aux admins. Le provisioning normal
-- passe par le trigger handle_new_user (security definer, contourne RLS),
-- mais une policy insert "sur soi-même" existe aussi : PocketBase, avec sa
-- collection users unifiée, permet à authWithOAuth2 de re-provisionner un
-- compte à la volée si l'admin l'a supprimé entre-temps (createRule resté
-- ouvert, cf. pb_migrations/1788260400). Ici, supprimer public.users ne
-- supprime pas l'identité auth.users sous-jacente (pas de clé service_role
-- côté client pour ça) ; cette policy reproduit le même comportement de
-- ré-provisioning au login suivant, géré côté client dans auth.store.ts.
create policy "users_select_authenticated" on public.users
  for select to authenticated using (true);

create policy "users_insert_self" on public.users
  for insert to authenticated with check (auth.uid() = id);

create policy "users_update_admin_only" on public.users
  for update to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u."isAdmin"))
  with check (exists (select 1 from public.users u where u.id = auth.uid() and u."isAdmin"));

create policy "users_delete_admin_only" on public.users
  for delete to authenticated
  using (exists (select 1 from public.users u where u.id = auth.uid() and u."isAdmin"));

-- priorities/actions/articles : accès ouvert (CRUD) à tout compte
-- authentifié, non limité au propriétaire — fidèle à la règle PocketBase
-- d'origine, qui n'a jamais scoppé par "user".
create policy "priorities_all_authenticated" on public.priorities
  for all to authenticated using (true) with check (true);

create policy "actions_all_authenticated" on public.actions
  for all to authenticated using (true) with check (true);

create policy "articles_all_authenticated" on public.articles
  for all to authenticated using (true) with check (true);

-- =============================================================================
-- Storage
-- =============================================================================

-- article-images : lecture publique (les fichiers PocketBase de ce champ
-- n'étaient pas marqués "protected", donc déjà accessibles par URL directe
-- sans auth), écriture réservée aux authentifiés. Contraintes reprises du
-- champ PocketBase (5 Mo, jpeg/png/webp/gif).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'article-images', 'article-images', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

create policy "article_images_public_read" on storage.objects
  for select using (bucket_id = 'article-images');

create policy "article_images_authenticated_write" on storage.objects
  for insert to authenticated with check (bucket_id = 'article-images');

create policy "article_images_authenticated_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'article-images')
  with check (bucket_id = 'article-images');

create policy "article_images_authenticated_delete" on storage.objects
  for delete to authenticated using (bucket_id = 'article-images');

-- avatars : utilisé uniquement par scripts/migrate-pocketbase-data.mjs pour
-- re-héberger l'avatar déjà stocké localement par PocketBase au moment de
-- la migration des données existantes. Le code applicatif n'y écrit jamais
-- (les nouveaux comptes utilisent l'URL Google/GitHub directe). Écriture
-- réservée à service_role (clé utilisée uniquement par ce script ponctuel,
-- jamais côté client).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
  for select using (bucket_id = 'avatars');

create policy "avatars_service_role_write" on storage.objects
  for insert to service_role with check (bucket_id = 'avatars');
