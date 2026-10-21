
create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- The very first account created becomes the owner/admin. Everyone after gets no admin rights.
create or replace function public.handle_first_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.handle_first_admin();

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end $$;

-- Categories
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  annotation text,
  sort_order int not null default 0,
  in_nav boolean not null default true,
  created_at timestamptz not null default now()
);
grant select on public.categories to anon, authenticated;
grant insert, update, delete on public.categories to authenticated;
grant all on public.categories to service_role;
alter table public.categories enable row level security;
create policy "public read categories" on public.categories for select to anon, authenticated using (true);
create policy "admin write categories" on public.categories for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Tags
create table public.tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);
grant select on public.tags to anon, authenticated;
grant insert, update, delete on public.tags to authenticated;
grant all on public.tags to service_role;
alter table public.tags enable row level security;
create policy "public read tags" on public.tags for select to anon, authenticated using (true);
create policy "admin write tags" on public.tags for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Posts
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null default '',
  subtitle text,
  excerpt text,
  template text not null default 'journal',
  category_id uuid references public.categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft','published','scheduled','archived')),
  published_at timestamptz,
  cover_image_url text,
  cover_image_alt text,
  content_html text not null default '',
  fields jsonb not null default '{}'::jsonb,
  gallery jsonb not null default '[]'::jsonb,
  seo_description text,
  is_placeholder boolean not null default false,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger posts_touch before update on public.posts for each row execute function public.touch_updated_at();
grant select on public.posts to anon, authenticated;
grant insert, update, delete on public.posts to authenticated;
grant all on public.posts to service_role;
alter table public.posts enable row level security;
create policy "public read live posts" on public.posts for select to anon, authenticated
  using (status in ('published','scheduled') and published_at is not null and published_at <= now());
create policy "admin read all posts" on public.posts for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "admin insert posts" on public.posts for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));
create policy "admin update posts" on public.posts for update to authenticated using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create policy "admin delete posts" on public.posts for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.post_tags (
  post_id uuid not null references public.posts(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (post_id, tag_id)
);
grant select on public.post_tags to anon, authenticated;
grant insert, update, delete on public.post_tags to authenticated;
grant all on public.post_tags to service_role;
alter table public.post_tags enable row level security;
create policy "public read post tags of live posts" on public.post_tags for select to anon, authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "admin write post tags" on public.post_tags for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Media library
create table public.media (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  url text not null,
  alt text,
  caption text,
  folder text,
  width int,
  height int,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.media to authenticated;
grant all on public.media to service_role;
alter table public.media enable row level security;
create policy "admin manage media" on public.media for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Site settings (key/value)
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);
grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;
grant all on public.site_settings to service_role;
alter table public.site_settings enable row level security;
create policy "public read settings" on public.site_settings for select to anon, authenticated using (true);
create policy "admin write settings" on public.site_settings for all to authenticated
  using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- Seed
insert into public.categories (slug, name, description, annotation, sort_order) values
 ('journal','Journal','Pages from a personal diary — reflections, memories, small and large thoughts.','life, slowly',1),
 ('entomology','Entomology','A naturalist''s field notebook of insects, observations and quiet curiosity.','field notes',2),
 ('food','Food','Recipes, kitchen experiments and the memories that live inside meals.','from the stove',3),
 ('japanese','Japanese','Ikebana, haiku and other gentle traditions I am learning to love.','ikebana & haiku',4);

insert into public.tags (slug, name) values
 ('ikebana','Ikebana'),('haiku','Haiku'),('reflections','Reflections'),('moths','Moths'),('recipes','Recipes'),('autumn','Autumn');

insert into public.site_settings (key, value) values
 ('site', '{"tagline":"a quiet corner for slow living, memories & observations ~","seo_description":"The Little Cove — a personal scrapbook of journal pages, insect field notes, recipes, ikebana and haiku.","footer_note":"Every page gathered by hand in The Little Cove · Est. 2026"}'),
 ('home', '{"intro_date":"From my wooden desk","intro_title":"Welcome to my quiet harbor on the web","intro_body":"[Placeholder welcome — replace in Settings] This is where small, lovely fragments of days might be gathered: a field note on an evening moth, a kettle steaming on the stove, or three lines of verse copied under lamplight.\n\nThis space is meant to feel like opening an old, well-loved notebook — imperfect, tactile, and made by hand. Pull up a chair and wander through the pages at your own pace.","signature":"warmly, Hana ~","sticky_note":"tea is poured · take your time","polaroid_caption":"the garden · oct 19","quote":"\"The quieter you become, the more you can hear.\"","quote_author":"— placeholder quote","dreams":"[Placeholder] Little dreams & aspirations: to keep a field notebook for a full year, to arrange flowers every Sunday, to write one haiku a week."}'),
 ('lately', '{"items":[{"label":"Reading","value":"The Sound of Waves"},{"label":"Brewing","value":"Hojicha roasted tea"},{"label":"Watching","value":"Late autumn garden moss"},{"label":"Learning","value":"Japanese kana"}]}'),
 ('about', '{"title":"About The Little Cove","body":"<p>[Placeholder About page — write your own words in Dashboard → Settings.]</p><p>The Little Cove is a personal corner of the internet: a scrapbook of thoughts about life, dreams, hobbies and small discoveries — insects, food, ikebana and haiku.</p>"}');

insert into public.posts (slug,title,subtitle,excerpt,template,category_id,status,published_at,cover_image_url,cover_image_alt,content_html,fields,gallery,is_placeholder,featured) values
 ('geometry-of-cedar-trees','The Geometry of Cedar Trees & Late Afternoon Sunlight','A sample journal page','[Sample placeholder] A peculiar stillness settles in late October, when cedar needles turn copper and the light slants low across the wooden deck…','journal',(select id from public.categories where slug='journal'),'published',now() - interval '7 days','/images/cedar.jpg','Low sunlight through cedar branches',
  '<p><em>This is a sample placeholder post to show the Personal Journal template. Replace or delete it from your dashboard.</em></p><p>There is a peculiar stillness that settles in late October, when the cedar needles turn copper and the light slants low across the wooden deck.</p><h2>On noticing</h2><p>Some afternoons ask nothing of us except attention.</p><blockquote><p>A sample highlighted passage, set like a pressed flower between pages.</p></blockquote><p>The light moves on; the notebook stays open.</p>','{}','[]',true,true),
 ('a-little-note-on-rain','A little note on rain',null,'[Sample placeholder] Rain on the window — a short thought, kept on a paper note.','note',(select id from public.categories where slug='journal'),'published',now() - interval '3 days',null,null,
  '<p>[Sample placeholder] Rain on the window this morning. Nothing to do but listen.</p>','{}','[]',true,false),
 ('cecropia-moth-field-note','Cecropia Moth',null,'[Sample placeholder] Found drying its wings beneath the cedar eaves. Wingspan nearly 14cm.','field_note',(select id from public.categories where slug='entomology'),'published',now() - interval '5 days','/images/moth.jpg','Illustrated pale green moth with open wings',
  '<p><em>Sample placeholder field note.</em></p><p>Found drying its wings beneath the cedar eaves. Released at twilight.</p><h3>Notes</h3><ul><li>Largest native moth in North America.</li><li>Adults do not feed; they live only about two weeks.</li></ul>',
  '{"common_name":"Cecropia moth","scientific_name":"Hyalophora cecropia","observed_on":"2026-10-14","location":"Back garden, under the eaves","specimen_no":"04","references":[{"label":"Wikipedia — Hyalophora cecropia","url":"https://en.wikipedia.org/wiki/Hyalophora_cecropia"}]}','[]',true,false),
 ('hojicha-milk-tea','Hojicha Milk Tea','A sample recipe card','[Sample placeholder] A roasted, toasty tea for cold evenings.','recipe',(select id from public.categories where slug='food'),'published',now() - interval '4 days','/images/tea.jpg','A cup of hojicha milk tea on a linen cloth',
  '<p><em>Sample placeholder recipe.</em> A roasted, toasty tea for cold evenings.</p>',
  '{"prep_time":"5 min","cook_time":"5 min","servings":"2","ingredients":["2 tbsp hojicha leaves","200 ml water","300 ml milk","1–2 tsp honey"],"steps":["Bring the water to a simmer and add the hojicha leaves.","Steep for 3 minutes, then add the milk and warm gently.","Strain into cups and sweeten with honey."],"notes":"Sample note: a pinch of cinnamon is lovely too."}','[]',true,false),
 ('autumn-branch-arrangement','Autumn Branch Arrangement',null,'[Sample placeholder] An asymmetrical arrangement of maple and chrysanthemum.','ikebana',(select id from public.categories where slug='japanese'),'published',now() - interval '2 days','/images/ikebana.jpg','Ikebana arrangement with a maple branch and white chrysanthemum',
  '<p><em>Sample placeholder.</em> A study in empty space and one leaning branch.</p>',
  '{"arrangement_title":"Leaning toward winter","materials":["Maple branch","White chrysanthemum","Kenzan","Shallow ceramic suiban"],"arranged_on":"2026-10-18"}',
  '[{"url":"/images/ikebana.jpg","caption":"Front view (sample)","alt":"Ikebana arrangement"}]',true,false),
 ('autumn-deepens','Autumn Deepens',null,'A haiku by Matsuo Bashō, shared as a sample of the Haiku template.','haiku',(select id from public.categories where slug='japanese'),'published',now() - interval '1 day',null,null,
  '<p><em>Sample placeholder reflection.</em> A poem about wondering how a neighbour lives, as the year turns quiet.</p>',
  '{"japanese":"秋深き\n隣は何を\nする人ぞ","romaji":"aki fukaki\ntonari wa nani o\nsuru hito zo","english":"autumn deepens —\nthe neighbor, what does\nhe do?","poet":"Matsuo Bashō"}','[]',true,false),
 ('a-draft-in-progress','A draft still in progress',null,'Drafts like this one are private and never shown publicly.','journal',(select id from public.categories where slug='journal'),'draft',null,null,null,'<p>This draft is only visible in your dashboard.</p>','{}','[]',true,false);

insert into public.post_tags (post_id, tag_id)
select p.id, t.id from public.posts p join public.tags t on
 (p.slug='geometry-of-cedar-trees' and t.slug in ('reflections','autumn')) or
 (p.slug='a-little-note-on-rain' and t.slug='reflections') or
 (p.slug='cecropia-moth-field-note' and t.slug='moths') or
 (p.slug='hojicha-milk-tea' and t.slug='recipes') or
 (p.slug='autumn-branch-arrangement' and t.slug in ('ikebana','autumn')) or
 (p.slug='autumn-deepens' and t.slug in ('haiku','autumn'));
