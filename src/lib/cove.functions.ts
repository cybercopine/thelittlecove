import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function pub() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

export const POST_FIELDS =
  "id, slug, title, subtitle, excerpt, template, status, published_at, cover_image_url, cover_image_alt, content_html, fields, gallery, seo_description, is_placeholder, featured, updated_at, category:categories(id, slug, name), post_tags(tag:tags(id, slug, name))";
const CARD_FIELDS =
  "id, slug, title, subtitle, excerpt, template, published_at, cover_image_url, cover_image_alt, fields, is_placeholder, featured, content_html, category:categories(id, slug, name), post_tags(tag:tags(id, slug, name))";

type Tag = { id: string; slug: string; name: string };
export type PublicPost = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  template: string;
  published_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  content_html: string;
  fields: Record<string, any>;
  gallery: { url: string; caption?: string; alt?: string }[];
  seo_description?: string | null;
  is_placeholder: boolean;
  featured: boolean;
  category: { id: string; slug: string; name: string } | null;
  tags: Tag[];
};

function normalize(row: any): PublicPost {
  const { post_tags, ...rest } = row;
  return {
    ...rest,
    fields: rest.fields ?? {},
    gallery: rest.gallery ?? [],
    tags: (post_tags ?? []).map((pt: any) => pt.tag).filter(Boolean),
  };
}

const live = (q: any) =>
  q.in("status", ["published", "scheduled"]).not("published_at", "is", null).lte("published_at", new Date().toISOString());

export const getSiteData = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pub();
  const [{ data: settings }, { data: categories }] = await Promise.all([
    sb.from("site_settings").select("key, value"),
    sb.from("categories").select("*").order("sort_order"),
  ]);
  const s: Record<string, any> = {};
  for (const r of settings ?? []) s[r.key] = r.value;
  return { settings: s, categories: categories ?? [] };
});

export const getHome = createServerFn({ method: "GET" }).handler(async () => {
  const sb = pub();
  const { data } = await live(sb.from("posts").select(CARD_FIELDS)).order("published_at", { ascending: false }).limit(12);
  const posts = (data ?? []).map(normalize);
  const featured = posts.find((p) => p.featured) ?? posts[0] ?? null;
  return { featured, recent: posts.filter((p) => p.id !== featured?.id).slice(0, 6) };
});

export const listPosts = createServerFn({ method: "GET" })
  .inputValidator((d: { category?: string; tag?: string; q?: string }) => d)
  .handler(async ({ data }) => {
    const sb = pub();
    let q = live(sb.from("posts").select(CARD_FIELDS)).order("published_at", { ascending: false }).limit(200);
    if (data.category) {
      const { data: c } = await sb.from("categories").select("id").eq("slug", data.category).maybeSingle();
      if (!c) return [];
      q = q.eq("category_id", c.id);
    }
    if (data.tag) {
      const { data: t } = await sb.from("tags").select("id").eq("slug", data.tag).maybeSingle();
      if (!t) return [];
      const { data: pts } = await sb.from("post_tags").select("post_id").eq("tag_id", t.id);
      const ids = (pts ?? []).map((p) => p.post_id);
      if (!ids.length) return [];
      q = q.in("id", ids);
    }
    if (data.q) {
      const term = data.q.replace(/[%,()]/g, " ").trim().slice(0, 80);
      if (!term) return [];
      const { data: tags } = await sb.from("tags").select("id").ilike("name", `%${term}%`);
      let tagPostIds: string[] = [];
      if (tags?.length) {
        const { data: pts } = await sb.from("post_tags").select("post_id").in("tag_id", tags.map((t) => t.id));
        tagPostIds = (pts ?? []).map((p) => p.post_id);
      }
      const ors = [`title.ilike.%${term}%`, `excerpt.ilike.%${term}%`, `content_html.ilike.%${term}%`, `subtitle.ilike.%${term}%`];
      if (tagPostIds.length) ors.push(`id.in.(${tagPostIds.join(",")})`);
      q = q.or(ors.join(","));
    }
    const { data: rows } = await q;
    return (rows ?? []).map(normalize);
  });

export const getTag = createServerFn({ method: "GET" })
  .inputValidator((d: { slug: string }) => d)
  .handler(async ({ data }) => {
    const { data: t } = await pub().from("tags").select("*").eq("slug", data.slug).maybeSingle();
    return t;
  });

export const getPost = createServerFn({ method: "GET" })
  .inputValidator((d: { category: string; slug: string }) => d)
  .handler(async ({ data }) => {
    const sb = pub();
    const { data: row } = await live(sb.from("posts").select(POST_FIELDS)).eq("slug", data.slug).maybeSingle();
    if (!row) return null;
    const post = normalize(row);
    if (post.category && post.category.slug !== data.category) return { post, related: [], wrongCategory: true };
    let related: PublicPost[] = [];
    const tagIds = post.tags.map((t) => t.id);
    if (tagIds.length) {
      const { data: pts } = await sb.from("post_tags").select("post_id").in("tag_id", tagIds).neq("post_id", post.id);
      const ids = [...new Set((pts ?? []).map((p) => p.post_id))].slice(0, 12);
      if (ids.length) {
        const { data: r } = await live(sb.from("posts").select(CARD_FIELDS)).in("id", ids).limit(3);
        related = (r ?? []).map(normalize);
      }
    }
    if (related.length < 3 && post.category) {
      const { data: r } = await live(sb.from("posts").select(CARD_FIELDS))
        .eq("category_id", post.category.id)
        .neq("id", post.id)
        .order("published_at", { ascending: false })
        .limit(3);
      for (const p of (r ?? []).map(normalize)) if (related.length < 3 && !related.find((x) => x.id === p.id)) related.push(p);
    }
    return { post, related, wrongCategory: false };
  });

export const getArchive = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await live(pub().from("posts").select("id, slug, title, published_at, template, is_placeholder, category:categories(slug, name)"))
    .order("published_at", { ascending: false })
    .limit(1000);
  return data ?? [];
});

export const getAllTags = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await pub().from("tags").select("*").order("name");
  return data ?? [];
});
