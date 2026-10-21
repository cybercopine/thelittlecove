// Data helpers for the private dashboard. Everything here runs in the browser
// with the signed-in user's session; the database's row-level security only
// lets the admin account read drafts or change anything.
import { supabase } from "@/integrations/supabase/client";
import { slugify } from "@/lib/format";

export type AdminTag = { id: string; slug: string; name: string };
export type AdminCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  annotation: string | null;
  sort_order: number;
  in_nav: boolean;
};
export type GalleryItem = { url: string; caption?: string; alt?: string };
export type PostStatus = "draft" | "published" | "scheduled" | "archived";

export type AdminPost = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  template: string;
  category_id: string | null;
  status: PostStatus;
  published_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string | null;
  content_html: string;
  fields: Record<string, any>;
  gallery: GalleryItem[];
  seo_description: string | null;
  is_placeholder: boolean;
  featured: boolean;
  created_at: string;
  updated_at: string;
  category?: { id: string; slug: string; name: string } | null;
  tags: AdminTag[];
};

export type MediaItem = {
  id: string;
  path: string;
  url: string;
  alt: string | null;
  caption: string | null;
  folder: string | null;
  width: number | null;
  height: number | null;
  created_at: string;
};

const POST_SELECT = "*, category:categories(id, slug, name), post_tags(tag:tags(id, slug, name))";

function normalize(row: any): AdminPost {
  const { post_tags, ...rest } = row;
  return {
    ...rest,
    fields: rest.fields ?? {},
    gallery: Array.isArray(rest.gallery) ? rest.gallery : [],
    tags: (post_tags ?? []).map((pt: any) => pt.tag).filter(Boolean),
  };
}

function fail(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

/* ---------------- auth ---------------- */

export async function getAdminState(): Promise<{
  email: string | null;
  userId: string | null;
  isAdmin: boolean;
}> {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) return { email: null, userId: null, isAdmin: false };
  const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
  return {
    email: user.email ?? null,
    userId: user.id,
    isAdmin: (roles ?? []).some((r: any) => r.role === "admin"),
  };
}

/* ---------------- posts ---------------- */

export async function listAdminPosts(): Promise<AdminPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .order("updated_at", { ascending: false })
    .limit(1000);
  fail(error);
  return (data ?? []).map(normalize);
}

export async function getAdminPost(id: string): Promise<AdminPost | null> {
  const { data, error } = await supabase
    .from("posts")
    .select(POST_SELECT)
    .eq("id", id)
    .maybeSingle();
  fail(error);
  return data ? normalize(data) : null;
}

async function uniqueSlug(base: string, excludeId?: string) {
  const root = slugify(base);
  let candidate = root;
  for (let i = 2; i < 50; i++) {
    let q = supabase.from("posts").select("id").eq("slug", candidate);
    if (excludeId) q = q.neq("id", excludeId);
    const { data } = await q;
    if (!data?.length) return candidate;
    candidate = `${root}-${i}`;
  }
  return `${root}-${Date.now().toString(36)}`;
}

export async function createPost(input: { template: string; category_id: string | null }) {
  const slug = await uniqueSlug(`untitled-${Date.now().toString(36)}`);
  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug,
      title: "",
      template: input.template,
      category_id: input.category_id,
      status: "draft",
      content_html: "",
    })
    .select("id")
    .single();
  fail(error);
  return data!.id as string;
}

export type PostPatch = Partial<
  Pick<
    AdminPost,
    | "slug"
    | "title"
    | "subtitle"
    | "excerpt"
    | "template"
    | "category_id"
    | "status"
    | "published_at"
    | "cover_image_url"
    | "cover_image_alt"
    | "content_html"
    | "fields"
    | "gallery"
    | "seo_description"
    | "is_placeholder"
    | "featured"
  >
>;

export async function updatePost(id: string, patch: PostPatch) {
  const p: any = { ...patch };
  if (p.slug !== undefined) p.slug = await uniqueSlug(p.slug || "entry", id);
  const { error } = await supabase.from("posts").update(p).eq("id", id);
  fail(error);
  return p.slug as string | undefined;
}

export async function setPostTags(postId: string, tagIds: string[]) {
  const { error: delErr } = await supabase.from("post_tags").delete().eq("post_id", postId);
  fail(delErr);
  if (tagIds.length) {
    const { error } = await supabase
      .from("post_tags")
      .insert(tagIds.map((tag_id) => ({ post_id: postId, tag_id })));
    fail(error);
  }
}

export async function duplicatePost(id: string) {
  const src = await getAdminPost(id);
  if (!src) throw new Error("Post not found");
  const slug = await uniqueSlug(`${src.slug}-copy`);
  const { data, error } = await supabase
    .from("posts")
    .insert({
      slug,
      title: src.title ? `${src.title} (copy)` : "",
      subtitle: src.subtitle,
      excerpt: src.excerpt,
      template: src.template,
      category_id: src.category_id,
      status: "draft",
      published_at: null,
      cover_image_url: src.cover_image_url,
      cover_image_alt: src.cover_image_alt,
      content_html: src.content_html,
      fields: src.fields,
      gallery: src.gallery as any,
      seo_description: src.seo_description,
      is_placeholder: src.is_placeholder,
      featured: false,
    })
    .select("id")
    .single();
  fail(error);
  await setPostTags(
    data!.id,
    src.tags.map((t) => t.id),
  );
  return data!.id as string;
}

export async function deletePost(id: string) {
  const { error } = await supabase.from("posts").delete().eq("id", id);
  fail(error);
}

/** Only one post is "featured" on the homepage at a time. */
export async function setFeatured(id: string | null) {
  const { error } = await supabase.from("posts").update({ featured: false }).eq("featured", true);
  fail(error);
  if (id) {
    const { error: e2 } = await supabase.from("posts").update({ featured: true }).eq("id", id);
    fail(e2);
  }
}

/* ---------------- tags & categories ---------------- */

export async function listTagsWithCounts(): Promise<(AdminTag & { count: number })[]> {
  const { data, error } = await supabase
    .from("tags")
    .select("id, slug, name, post_tags(post_id)")
    .order("name");
  fail(error);
  return (data ?? []).map((t: any) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    count: (t.post_tags ?? []).length,
  }));
}

export async function createTag(name: string): Promise<AdminTag> {
  const clean = name.trim();
  const slug = slugify(clean);
  const { data: existing } = await supabase
    .from("tags")
    .select("id, slug, name")
    .eq("slug", slug)
    .maybeSingle();
  if (existing) return existing as AdminTag;
  const { data, error } = await supabase
    .from("tags")
    .insert({ name: clean, slug })
    .select("id, slug, name")
    .single();
  fail(error);
  return data as AdminTag;
}

export async function updateTag(id: string, patch: { name?: string; slug?: string }) {
  const p: any = { ...patch };
  if (p.slug !== undefined) p.slug = slugify(p.slug);
  const { error } = await supabase.from("tags").update(p).eq("id", id);
  fail(error);
}

export async function deleteTag(id: string) {
  const { error } = await supabase.from("tags").delete().eq("id", id);
  fail(error);
}

export async function listCategories(): Promise<(AdminCategory & { count: number })[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*, posts(id)")
    .order("sort_order");
  fail(error);
  return (data ?? []).map(({ posts, ...c }: any) => ({ ...c, count: (posts ?? []).length }));
}

export async function saveCategory(c: Partial<AdminCategory> & { name: string }) {
  const row: any = {
    name: c.name.trim(),
    slug: slugify(c.slug || c.name),
    description: c.description ?? null,
    annotation: c.annotation ?? null,
    sort_order: c.sort_order ?? 0,
    in_nav: c.in_nav ?? true,
  };
  if (c.id) {
    const { error } = await supabase.from("categories").update(row).eq("id", c.id);
    fail(error);
  } else {
    const { error } = await supabase.from("categories").insert(row);
    fail(error);
  }
}

export async function deleteCategory(id: string) {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  fail(error);
}

/* ---------------- settings ---------------- */

export async function getSettings(): Promise<Record<string, any>> {
  const { data, error } = await supabase.from("site_settings").select("key, value");
  fail(error);
  const s: Record<string, any> = {};
  for (const r of data ?? []) s[r.key] = r.value;
  return s;
}

export async function saveSetting(key: string, value: any) {
  const { error } = await supabase
    .from("site_settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  fail(error);
}

/* ---------------- media ---------------- */

export const MEDIA_BUCKET = "media";
/** Public address an uploaded photo is served from (see src/routes/img.$.tsx). */
export const mediaUrl = (path: string) => `/img/${path}`;

export async function listMedia(): Promise<MediaItem[]> {
  const { data, error } = await supabase
    .from("media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(2000);
  fail(error);
  return (data ?? []) as MediaItem[];
}

/** Shrinks a photo in the browser so large camera files load quickly on the site. */
async function optimize(
  file: File,
  maxSide = 2000,
): Promise<{ blob: Blob; width: number; height: number; ext: string; type: string }> {
  if (
    !file.type.startsWith("image/") ||
    file.type === "image/gif" ||
    file.type === "image/svg+xml"
  ) {
    const ext = (file.name.split(".").pop() || "bin").toLowerCase();
    return { blob: file, width: 0, height: 0, ext, type: file.type };
  }
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, width: 0, height: 0, ext, type: file.type };
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, width, height);
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
  if (!blob || (blob.size > file.size && scale === 1)) {
    const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
    return { blob: file, width, height, ext, type: file.type };
  }
  const realType = blob.type || "image/webp";
  return {
    blob,
    width,
    height,
    ext: realType.split("/")[1].replace("jpeg", "jpg"),
    type: realType,
  };
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}

const BROWSER_IMAGE = /^image\/(jpeg|png|webp|gif|avif|svg\+xml)$/;

export async function uploadMedia(
  file: File,
  meta: { folder?: string | null; alt?: string; caption?: string } = {},
): Promise<MediaItem> {
  const opt = await withTimeout(
    optimize(file),
    30_000,
    "Couldn't prepare this photo. Try saving it as a JPEG first.",
  );
  const { blob, width, height, ext } = opt;
  let { type } = opt;
  // Some browsers (e.g. older Safari) silently return PNG when asked for WebP.
  if (blob.type && blob.type !== type) type = blob.type;
  if (!BROWSER_IMAGE.test(type)) {
    throw new Error(
      "This photo format (often HEIC from iPhones) can't be shown on websites. Export it as JPEG and upload again.",
    );
  }
  const base = slugify(file.name.replace(/\.[^.]+$/, "")).slice(0, 40) || "photo";
  const d = new Date();
  const path = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${base}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error: upErr } = await withTimeout(
    supabase.storage
      .from(MEDIA_BUCKET)
      .upload(path, blob, { contentType: type, cacheControl: "31536000", upsert: false }),
    120_000,
    "The upload timed out. Check your internet connection, refresh the page and try again.",
  );
  if (upErr) throw new Error(`Upload failed: ${upErr.message}`);
  const { data, error } = await supabase
    .from("media")
    .insert({
      path,
      url: mediaUrl(path),
      alt: meta.alt ?? null,
      caption: meta.caption ?? null,
      folder: meta.folder || null,
      width: width || null,
      height: height || null,
    })
    .select("*")
    .single();
  fail(error);
  return data as MediaItem;
}

export async function updateMedia(
  id: string,
  patch: { alt?: string | null; caption?: string | null; folder?: string | null },
) {
  const { error } = await supabase.from("media").update(patch).eq("id", id);
  fail(error);
}

export async function deleteMedia(item: MediaItem) {
  await supabase.storage.from(MEDIA_BUCKET).remove([item.path]);
  const { error } = await supabase.from("media").delete().eq("id", item.id);
  fail(error);
}

/* ---------------- export ---------------- */

export async function exportEverything() {
  const [posts, tags, categories, settings, media] = await Promise.all([
    supabase.from("posts").select("*, post_tags(tag_id)"),
    supabase.from("tags").select("*"),
    supabase.from("categories").select("*"),
    supabase.from("site_settings").select("*"),
    supabase.from("media").select("*"),
  ]);
  return {
    exported_at: new Date().toISOString(),
    site: "The Little Cove",
    posts: posts.data ?? [],
    tags: tags.data ?? [],
    categories: categories.data ?? [],
    settings: settings.data ?? [],
    media: media.data ?? [],
  };
}
