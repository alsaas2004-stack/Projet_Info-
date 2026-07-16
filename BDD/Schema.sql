-- =========================================================
-- IcamTrack - Script complet de la base de données
-- Projet : Gestion d'emprunts matériels ICAM
-- Stack  : Supabase (PostgreSQL)
-- =========================================================


-- =========================
-- 1. TABLES
-- =========================

-- Catégories de matériel
create table if not exists categorie (
  id_categorie   uuid primary key default gen_random_uuid(),
  nom_categorie  text not null
);

-- Utilisateurs (complété par Supabase Auth)
create table if not exists utilisateur (
  id_utilisateur uuid primary key default gen_random_uuid(),
  nom            text not null,
  email          text unique,
  role           text not null default 'etudiant'
                 check (role in ('etudiant', 'admin', 'superadmin')),
  actif          boolean not null default true,
  telephone      text
);

-- Matériel
create table if not exists materiel (
  id_materiel      uuid primary key default gen_random_uuid(),
  nom              text not null,
  reference        text,
  description      text,
  etat             text not null default 'disponible'
                   check (etat in ('disponible', 'emprunte', 'indisponible', 'en_attente')),
  image_url        text,
  date_acquisition timestamp,
  actif            boolean not null default true,
  stock            integer not null default 1,
  is_kit           boolean not null default false,
  id_categorie     uuid references categorie (id_categorie)
);

-- Composition de kits (matériel composé d'autres matériels)
create table if not exists kit_composant (
  id_kit       uuid not null references materiel (id_materiel),
  id_composant uuid not null references materiel (id_materiel),
  quantite     integer not null default 1,
  primary key (id_kit, id_composant)
);

-- Emprunts
create table if not exists emprunt (
  id_emprunt          uuid primary key default gen_random_uuid(),
  date_emprunt        timestamp not null default now(),
  date_retour_prevue  timestamp,
  date_retour_reelle  timestamp,
  statut              text not null default 'en_attente'
                      check (statut in ('en_attente', 'refuse', 'en_cours', 'rendu')),
  motif_refus         text,
  date_validation     timestamp,
  quantite            integer not null default 1,
  groupe_id           uuid,
  id_materiel         uuid not null references materiel (id_materiel),
  id_utilisateur      uuid not null references utilisateur (id_utilisateur),
  valide_par          uuid references utilisateur (id_utilisateur)
);

-- Historique des actions
create table if not exists historique (
  id_historique  uuid primary key default gen_random_uuid(),
  type_action    text not null,
  date_action    timestamp not null default now(),
  commentaire    text,
  id_materiel    uuid references materiel (id_materiel),
  id_utilisateur uuid references utilisateur (id_utilisateur)
);

-- Notifications
create table if not exists notification (
  id_notification uuid primary key default gen_random_uuid(),
  type_notif      text not null,
  message         text,
  lu              boolean not null default false,
  date_creation   timestamp not null default now(),
  id_utilisateur  uuid not null references utilisateur (id_utilisateur),
  id_emprunt      uuid references emprunt (id_emprunt)
);


-- =========================
-- 2. ROW LEVEL SECURITY
-- =========================

alter table categorie    enable row level security;
alter table utilisateur  enable row level security;
alter table materiel     enable row level security;
alter table kit_composant enable row level security;
alter table emprunt      enable row level security;
alter table historique   enable row level security;
alter table notification enable row level security;


-- =========================
-- 3. POLICIES RLS
-- =========================

-- ---- CATEGORIE ----
create policy "categorie_select_all"
  on categorie for select to authenticated using (true);

-- ---- MATERIEL ----
create policy "materiel_select_all"
  on materiel for select to authenticated using (true);

create policy "materiel_insert_admin"
  on materiel for insert to authenticated
  with check (
    exists (select 1 from utilisateur
            where id_utilisateur = auth.uid()
            and role in ('admin','superadmin') and actif = true)
  );

create policy "materiel_update_admin"
  on materiel for update to authenticated
  using (
    exists (select 1 from utilisateur
            where id_utilisateur = auth.uid()
            and role in ('admin','superadmin') and actif = true)
  );

-- ---- KIT_COMPOSANT ----
create policy "kit_composant_select_all"
  on kit_composant for select to authenticated using (true);

-- ---- UTILISATEUR ----
create policy "utilisateur_select_own"
  on utilisateur for select to authenticated
  using (id_utilisateur = auth.uid()
    or exists (select 1 from utilisateur u2
               where u2.id_utilisateur = auth.uid()
               and u2.role in ('admin','superadmin') and u2.actif = true));

create policy "utilisateur_update_own"
  on utilisateur for update to authenticated
  using (id_utilisateur = auth.uid());

-- ---- EMPRUNT ----
create policy "emprunt_select"
  on emprunt for select to authenticated
  using (
    id_utilisateur = auth.uid()
    or exists (select 1 from utilisateur
               where id_utilisateur = auth.uid()
               and role in ('admin','superadmin') and actif = true)
  );

create policy "emprunt_insert_own"
  on emprunt for insert to authenticated
  with check (id_utilisateur = auth.uid());

create policy "emprunt_update_admin"
  on emprunt for update to authenticated
  using (
    exists (select 1 from utilisateur
            where id_utilisateur = auth.uid()
            and role in ('admin','superadmin') and actif = true)
  );

-- ---- HISTORIQUE ----
create policy "historique_select_admin"
  on historique for select to authenticated
  using (
    exists (select 1 from utilisateur
            where id_utilisateur = auth.uid()
            and role in ('admin','superadmin') and actif = true)
  );

create policy "historique_insert_admin"
  on historique for insert to authenticated
  with check (
    exists (select 1 from utilisateur
            where id_utilisateur = auth.uid()
            and role in ('admin','superadmin') and actif = true)
  );

-- ---- NOTIFICATION ----
create policy "notification_select_own"
  on notification for select to authenticated
  using (
    id_utilisateur = auth.uid()
    or exists (select 1 from utilisateur
               where id_utilisateur = auth.uid()
               and role in ('admin','superadmin') and actif = true)
  );

create policy "notification_insert_demande"
  on notification for insert to authenticated
  with check (true);

create policy "notification_update_own"
  on notification for update to authenticated
  using (id_utilisateur = auth.uid());

create policy "notification_delete_own"
  on notification for delete to authenticated
  using (id_utilisateur = auth.uid());


-- =========================
-- 4. FONCTIONS
-- =========================

-- Retourne les IDs des admins actifs (SECURITY DEFINER = bypasse RLS)
create or replace function get_admin_ids()
returns table(id uuid)
language sql
security definer
as $$
  select id_utilisateur as id
  from utilisateur
  where role in ('admin', 'superadmin')
    and actif = true;
$$;

-- Réserve un matériel (réduit disponibilité selon stock)
create or replace function reserver_materiel(
  p_id_materiel uuid,
  p_quantite    integer default 1
)
returns void
language plpgsql
security definer
as $$
begin
  update materiel
  set etat = case
    when coalesce(stock, 1) - p_quantite <= 0 then 'indisponible'
    else etat
  end
  where id_materiel = p_id_materiel;
end;
$$;

-- Libère un matériel (remet disponible)
create or replace function liberer_materiel(p_id_materiel uuid)
returns void
language plpgsql
security definer
as $$
begin
  update materiel
  set etat = 'disponible'
  where id_materiel = p_id_materiel;
end;
$$;

-- Libère plusieurs matériels en une seule fois
create or replace function liberer_materiels(p_ids uuid[])
returns void
language plpgsql
security definer
as $$
begin
  update materiel
  set etat = 'disponible'
  where id_materiel = any(p_ids);
end;
$$;
