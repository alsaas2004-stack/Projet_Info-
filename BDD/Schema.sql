-- =========================================================
-- IcamTrack - Script complet de la base de données
-- Projet : Gestion d'emprunts matériels ICAM
-- Stack  : Supabase (PostgreSQL)
-- =========================================================


-- =========================
-- 1. TABLES
-- =========================

create table if not exists categorie (
  id_categorie   uuid primary key default gen_random_uuid(),
  nom_categorie  text not null
);

create table if not exists utilisateur (
  id_utilisateur uuid primary key default gen_random_uuid(),
  nom            text not null,
  email          text unique,
  role           text not null default 'etudiant'
                 check (role in ('etudiant', 'admin', 'superadmin')),
  actif          boolean not null default true,
  telephone      text
);

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

create table if not exists kit_composant (
  id_kit       uuid not null references materiel (id_materiel),
  id_composant uuid not null references materiel (id_materiel),
  quantite     integer not null default 1,
  primary key (id_kit, id_composant)
);

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

create table if not exists historique (
  id_historique  uuid primary key default gen_random_uuid(),
  type_action    text not null,
  date_action    timestamp not null default now(),
  commentaire    text,
  id_materiel    uuid references materiel (id_materiel),
  id_utilisateur uuid references utilisateur (id_utilisateur)
);

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

alter table categorie     enable row level security;
alter table utilisateur   enable row level security;
alter table materiel      enable row level security;
alter table kit_composant enable row level security;
alter table emprunt       enable row level security;
alter table historique    enable row level security;
alter table notification  enable row level security;


-- =========================
-- 3. FONCTIONS UTILITAIRES
-- =========================

-- Retourne le rôle de l'utilisateur connecté (SECURITY DEFINER = bypasse RLS)
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path to 'public'
as $$
  select role
  from public.utilisateur
  where email = auth.jwt() ->> 'email'
    and actif = true
  limit 1;
$$;

-- Retourne les IDs de tous les admins actifs
create or replace function public.get_admin_ids()
returns table(id_utilisateur uuid)
language sql
security definer
set search_path to 'public'
as $$
  select id_utilisateur
  from utilisateur
  where role in ('admin', 'superadmin')
    and actif = true;
$$;

-- Fonction de debug (retourne les infos d'auth JWT)
create or replace function public.debug_auth()
returns json
language sql
as $$
  select json_build_object(
    'current_user', current_user::text,
    'auth_role',    auth.role(),
    'auth_uid',     auth.uid(),
    'jwt_claims',   auth.jwt()
  );
$$;

-- Marque un matériel en_attente si le stock serait épuisé après réservation
create or replace function public.reserver_materiel(
  p_id_materiel uuid,
  p_quantite    integer default 1
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update materiel set etat = 'en_attente'
  where id_materiel = p_id_materiel
    and etat = 'disponible'
    and coalesce(stock, 1) - p_quantite <= 0;

  -- Propagation aux composants si c'est un kit
  update materiel m set etat = 'en_attente'
  from kit_composant kc
  where m.id_materiel = kc.id_composant
    and kc.id_kit = p_id_materiel
    and m.etat = 'disponible'
    and coalesce(m.stock, 1) - p_quantite * kc.quantite <= 0;
end;
$$;

-- Libère un matériel (remet disponible)
create or replace function public.liberer_materiel(p_id_materiel uuid)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update materiel set etat = 'disponible'
  where id_materiel = p_id_materiel and etat = 'en_attente';

  update materiel set etat = 'disponible'
  where id_materiel in (
    select id_composant from kit_composant where id_kit = p_id_materiel
  ) and etat = 'en_attente';
end;
$$;

-- Libère plusieurs matériels en une seule fois
create or replace function public.liberer_materiels(p_ids uuid[])
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  update materiel set etat = 'disponible'
  where id_materiel = any(p_ids) and etat = 'en_attente';

  update materiel set etat = 'disponible'
  where id_materiel in (
    select id_composant from kit_composant where id_kit = any(p_ids)
  ) and etat = 'en_attente';
end;
$$;


-- =========================
-- 4. TRIGGER
-- =========================

-- Fonction déclenchée après chaque UPDATE sur emprunt
-- Gère le stock et l'état du matériel selon le changement de statut
create or replace function public.trigger_emprunt_update_materiel()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_stock     integer;
  v_etat      text;
  v_new_stock integer;
  v_comp      record;
begin
  -- Acceptation (en_attente → en_cours) : décrémente le stock
  if new.statut = 'en_cours' and old.statut = 'en_attente' then
    select stock into v_stock from materiel where id_materiel = new.id_materiel;
    v_new_stock := greatest(0, coalesce(v_stock, 1) - coalesce(new.quantite, 1));
    update materiel
    set stock = v_new_stock,
        etat  = case when v_new_stock = 0 then 'emprunte' else 'disponible' end
    where id_materiel = new.id_materiel;

    for v_comp in select id_composant, quantite from kit_composant where id_kit = new.id_materiel loop
      select stock into v_stock from materiel where id_materiel = v_comp.id_composant;
      v_new_stock := greatest(0, coalesce(v_stock, 1) - coalesce(new.quantite, 1) * v_comp.quantite);
      update materiel
      set stock = v_new_stock,
          etat  = case when v_new_stock = 0 then 'emprunte' else 'disponible' end
      where id_materiel = v_comp.id_composant;
    end loop;
  end if;

  -- Refus (en_attente → refuse) : remet disponible
  if new.statut = 'refuse' and old.statut = 'en_attente' then
    update materiel set etat = 'disponible'
    where id_materiel = new.id_materiel
      and etat in ('en_attente', 'emprunte');
    update materiel set etat = 'disponible'
    where id_materiel in (
      select id_composant from kit_composant where id_kit = new.id_materiel
    ) and etat in ('en_attente', 'emprunte');
  end if;

  -- Retour (en_cours → rendu) : réincrémente le stock
  if new.statut = 'rendu' and old.statut = 'en_cours' then
    select stock, etat into v_stock, v_etat from materiel where id_materiel = new.id_materiel;
    v_new_stock := coalesce(v_stock, 0) + coalesce(new.quantite, 1);
    update materiel
    set stock = v_new_stock,
        etat  = case when v_etat = 'indisponible' then 'indisponible' else 'disponible' end
    where id_materiel = new.id_materiel;

    for v_comp in select id_composant, quantite from kit_composant where id_kit = new.id_materiel loop
      select stock, etat into v_stock, v_etat from materiel where id_materiel = v_comp.id_composant;
      v_new_stock := coalesce(v_stock, 0) + coalesce(new.quantite, 1) * v_comp.quantite;
      update materiel
      set stock = v_new_stock,
          etat  = case when v_etat = 'indisponible' then 'indisponible' else 'disponible' end
      where id_materiel = v_comp.id_composant;
    end loop;
  end if;

  return new;
end;
$$;

-- Attache le trigger à la table emprunt
create or replace trigger on_emprunt_update
  after update on emprunt
  for each row
  execute function trigger_emprunt_update_materiel();


-- =========================
-- 5. POLICIES RLS
-- =========================

-- ---- CATEGORIE ----
create policy "categorie_select"
  on categorie as permissive for select to authenticated
  using (true);

create policy "categorie_admin_write"
  on categorie as permissive for all to authenticated
  using (current_user_role() = any(array['admin','superadmin']))
  with check (current_user_role() = any(array['admin','superadmin']));

-- ---- UTILISATEUR ----
create policy "utilisateur_select"
  on utilisateur as permissive for select to authenticated
  using (
    email = (auth.jwt() ->> 'email')
    or current_user_role() = any(array['admin','superadmin'])
  );

create policy "utilisateur_insert_own"
  on utilisateur as permissive for insert to authenticated
  with check (
    email = (auth.jwt() ->> 'email')
    and role = 'etudiant'
  );

create policy "utilisateur_update_admin"
  on utilisateur as permissive for update to authenticated
  using (current_user_role() = 'superadmin')
  with check (current_user_role() = 'superadmin');

-- ---- MATERIEL ----
create policy "materiel_select"
  on materiel as permissive for select to authenticated
  using (true);

create policy "materiel_admin_insert"
  on materiel as permissive for insert to authenticated
  with check (current_user_role() = any(array['admin','superadmin']));

create policy "materiel_admin_update"
  on materiel as permissive for update to authenticated
  using (current_user_role() = any(array['admin','superadmin']))
  with check (current_user_role() = any(array['admin','superadmin']));

-- ---- KIT_COMPOSANT ----
create policy "kit_composant_select"
  on kit_composant as permissive for select to authenticated
  using (true);

create policy "kit_composant_admin"
  on kit_composant as permissive for all to authenticated
  using (
    exists (
      select 1 from utilisateur
      where id_utilisateur = auth.uid()
        and role = any(array['admin','superadmin'])
        and actif = true
    )
  )
  with check (
    exists (
      select 1 from utilisateur
      where id_utilisateur = auth.uid()
        and role = any(array['admin','superadmin'])
        and actif = true
    )
  );

-- ---- EMPRUNT ----
create policy "emprunt_select"
  on emprunt as permissive for select to authenticated
  using (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
    or current_user_role() = any(array['admin','superadmin'])
  );

create policy "emprunt_student_insert"
  on emprunt as permissive for insert to authenticated
  with check (
    statut = 'en_attente'
    and id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
  );

create policy "emprunt_admin_update"
  on emprunt as permissive for update to authenticated
  using (current_user_role() = any(array['admin','superadmin']))
  with check (current_user_role() = any(array['admin','superadmin']));

-- ---- HISTORIQUE ----
create policy "historique_select"
  on historique as permissive for select to authenticated
  using (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
    or current_user_role() = any(array['admin','superadmin'])
  );

create policy "historique_insert"
  on historique as permissive for insert to authenticated
  with check (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
    or current_user_role() = any(array['admin','superadmin'])
  );

-- ---- NOTIFICATION ----
create policy "notification_select"
  on notification as permissive for select to authenticated
  using (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
  );

create policy "allow_insert_notification_any"
  on notification as permissive for insert to authenticated
  with check (true);

create policy "notification_admin_insert"
  on notification as permissive for insert to authenticated
  with check (current_user_role() = any(array['admin','superadmin']));

create policy "notification_insert_demande"
  on notification as permissive for insert to authenticated
  with check (
    type_notif = 'demande_recue'
    and id_utilisateur in (
      select id_utilisateur from utilisateur
      where role = any(array['admin','superadmin'])
        and actif = true
    )
  );

create policy "notification_update_own"
  on notification as permissive for update to authenticated
  using (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
  )
  with check (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
  );

create policy "notification_delete_own"
  on notification as permissive for delete to authenticated
  using (
    id_utilisateur in (
      select id_utilisateur from utilisateur
      where email = (auth.jwt() ->> 'email')
    )
  );
