import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarClock,
  Eye,
  ImagePlus,
  Monitor,
  MoreHorizontal,
  Plus,
  Smartphone,
  Trash2,
  X,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  createTag,
  deletePost,
  duplicatePost,
  getAdminPost,
  listCategories,
  listTagsWithCounts,
  setFeatured,
  setPostTags,
  updatePost,
  type AdminPost,
  type AdminTag,
  type GalleryItem,
  type PostStatus,
} from "@/lib/admin-data";
import { getTemplate, TEMPLATES, type FieldDef } from "@/lib/templates";
import { fmtDate, readingTime, slugify, stripHtml } from "@/lib/format";
import { RichEditor } from "@/components/admin/RichEditor";
import { useMediaPicker } from "@/components/admin/MediaPicker";
import { TagPicker } from "@/components/admin/TagPicker";
import {
  btnGhost,
  btnPrimary,
  Confirm,
  effectiveStatus,
  inputCls,
  Labeled,
  StatusBadge,
} from "@/components/admin/bits";
import { Leaf } from "@/components/site/Botanicals";

export const Route = createFileRoute("/admin/posts/$id")({
  component: EditorPage,
});

type Draft = {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  template: string;
  category_id: string | null;
  status: PostStatus;
  published_at: string | null;
  cover_image_url: string | null;
  cover_image_alt: string;
  content_html: string;
  fields: Record<string, any>;
  gallery: GalleryItem[];
  seo_description: string;
  is_placeholder: boolean;
  featured: boolean;
  tags: AdminTag[];
};

const toDraft = (p: AdminPost): Draft => ({
  slug: p.slug,
  title: p.title ?? "",
  subtitle: p.subtitle ?? "",
  excerpt: p.excerpt ?? "",
  template: p.template,
  category_id: p.category_id,
  status: p.status,
  published_at: p.published_at,
  cover_image_url: p.cover_image_url,
  cover_image_alt: p.cover_image_alt ?? "",
  content_html: p.content_html ?? "",
  fields: p.fields ?? {},
  gallery: p.gallery ?? [],
  seo_description: p.seo_description ?? "",
  is_placeholder: p.is_placeholder,
  featured: p.featured,
  tags: p.tags,
});

const backupKey = (id: string) => `cove-backup:${id}`;
export const previewKey = (id: string) => `cove-preview:${id}`;

function safeSet(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}
function safeGet(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeRemove(key: string) {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function EditorPage() {
  const { id } = Route.useParams();
  const {
    data: post,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin", "post", id],
    queryFn: () => getAdminPost(id),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  if (isLoading)
    return (
      <div className="grid min-h-screen place-items-center font-hand text-2xl text-muted-foreground">
        opening the page…
      </div>
    );
  if (error || !post)
    return (
      <div className="grid min-h-screen place-items-center text-center">
        <div>
          <p className="font-hand text-2xl text-muted-foreground">this page couldn't be found</p>
          <Link to="/admin" className={`${btnGhost} mt-4`}>
            Back to posts
          </Link>
        </div>
      </div>
    );
  return <Editor key={post.id} post={post} />;
}

function Editor({ post }: { post: AdminPost }) {
  const id = post.id;
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { pick, element: pickerEl } = useMediaPicker();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listCategories,
  });
  const { data: allTags = [] } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: listTagsWithCounts,
  });

  const [draft, setDraft] = useState<Draft>(() => toDraft(post));
  const [saved, setSaved] = useState<string>(() => JSON.stringify(toDraft(post)));
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [recovery, setRecovery] = useState<{ draft: Draft; at: string } | null>(null);
  const [preview, setPreview] = useState<null | "desktop" | "mobile">(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const savingRef = useRef(false);

  const dirty = JSON.stringify(draft) !== saved;
  const live = effectiveStatus(draft.status, draft.published_at);
  const savedSnap = useMemo(() => JSON.parse(saved) as Draft, [saved]);
  const savedLive = effectiveStatus(savedSnap.status, savedSnap.published_at);
  const tpl = getTemplate(draft.template);
  const set = useCallback(
    <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v })),
    [],
  );
  const setField = (k: string, v: any) =>
    setDraft((d) => ({ ...d, fields: { ...d.fields, [k]: v } }));

  // offer to recover unsaved work left in this browser
  useEffect(() => {
    const raw = safeGet(backupKey(id));
    if (!raw) return;
    try {
      const b = JSON.parse(raw) as { draft: Draft; at: string };
      if (
        new Date(b.at) > new Date(post.updated_at) &&
        JSON.stringify(b.draft) !== JSON.stringify(toDraft(post))
      )
        setRecovery(b);
      else safeRemove(backupKey(id));
    } catch {
      safeRemove(backupKey(id));
    }
  }, [id, post]);

  // keep a local backup + feed the live preview
  const categoryObj = categories.find((c) => c.id === draft.category_id) ?? null;
  useEffect(() => {
    if (dirty) safeSet(backupKey(id), JSON.stringify({ draft, at: new Date().toISOString() }));
    safeSet(
      previewKey(id),
      JSON.stringify({
        id,
        ...draft,
        subtitle: draft.subtitle || null,
        excerpt: draft.excerpt || null,
        cover_image_alt: draft.cover_image_alt || null,
        published_at: draft.published_at ?? new Date().toISOString(),
        category: categoryObj
          ? { id: categoryObj.id, slug: categoryObj.slug, name: categoryObj.name }
          : null,
      }),
    );
  }, [draft, dirty, id, categoryObj]);

  const save = useCallback(
    async (override: Partial<Draft> = {}, opts: { quiet?: boolean } = {}) => {
      if (savingRef.current) return false;
      savingRef.current = true;
      setSaving(true);
      const d = { ...draft, ...override };
      try {
        let slug = d.slug;
        if (slug.startsWith("untitled-") && d.title.trim()) slug = slugify(d.title);
        const finalSlug = await updatePost(id, {
          ...(slug !== savedSnap.slug ? { slug } : {}),
          title: d.title.trim(),
          subtitle: d.subtitle.trim() || null,
          excerpt: d.excerpt.trim() || null,
          template: d.template,
          category_id: d.category_id,
          status: d.status,
          published_at: d.published_at,
          cover_image_url: d.cover_image_url,
          cover_image_alt: d.cover_image_alt.trim() || null,
          content_html: d.content_html,
          fields: d.fields,
          gallery: d.gallery,
          seo_description: d.seo_description.trim() || null,
          is_placeholder: d.is_placeholder,
          featured: d.featured,
        });
        await setPostTags(
          id,
          d.tags.map((t) => t.id),
        );
        if (d.featured && !JSON.parse(saved).featured) await setFeatured(id);
        const next = { ...d, slug: finalSlug ?? savedSnap.slug };
        setDraft((cur) =>
          JSON.stringify(cur) === JSON.stringify(draft)
            ? next
            : { ...cur, slug: next.slug, status: next.status, published_at: next.published_at },
        );
        setSaved(JSON.stringify(next));
        setSavedAt(new Date());
        safeRemove(backupKey(id));
        qc.invalidateQueries({ queryKey: ["admin", "posts"] });
        qc.invalidateQueries({ queryKey: ["admin", "tags"] });
        qc.invalidateQueries({ queryKey: ["home"] });
        qc.invalidateQueries({ queryKey: ["list"] });
        qc.invalidateQueries({ queryKey: ["post"] });
        if (!opts.quiet) toast.success("Saved");
        return true;
      } catch (e: any) {
        toast.error(`Couldn't save: ${e.message}`);
        return false;
      } finally {
        savingRef.current = false;
        setSaving(false);
      }
    },
    [draft, id, saved, savedSnap, qc],
  );

  // autosave drafts quietly; live posts wait for "Update" so half-finished edits never appear
  useEffect(() => {
    if (!dirty || savedLive !== "draft" || live !== "draft") return;
    const t = setTimeout(() => save({}, { quiet: true }), 2000);
    return () => clearTimeout(t);
  }, [draft, dirty, savedLive, live, save]);

  // ask before leaving with unsaved changes
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  // Ctrl/Cmd+S saves
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [save]);

  function checkReady() {
    if (!draft.title.trim() && draft.template !== "note" && draft.template !== "haiku") {
      toast.error("Give your post a title before publishing");
      return false;
    }
    if (!draft.category_id) {
      toast.error("Choose a category so readers can find it");
      return false;
    }
    return true;
  }

  async function publish() {
    if (!checkReady()) return;
    const when = draft.published_at ? new Date(draft.published_at) : null;
    const future = when && when > new Date();
    const ok = await save(
      {
        status: future ? "scheduled" : "published",
        published_at:
          when && (future || savedLive !== "draft") ? when.toISOString() : new Date().toISOString(),
      },
      { quiet: true },
    );
    if (ok)
      toast.success(
        future
          ? `Scheduled — it will appear on ${fmtDate(when!.toISOString())}`
          : "Published — it's live on the blog ✿",
      );
  }
  async function unpublish() {
    if (await save({ status: "draft" }, { quiet: true }))
      toast.success("Unpublished — readers can no longer see it");
  }

  async function pickCover() {
    const r = await pick({ title: "Choose a cover photo" });
    if (r?.[0])
      setDraft((d) => ({
        ...d,
        cover_image_url: r[0].url,
        cover_image_alt: d.cover_image_alt || r[0].caption || r[0].alt || "",
      }));
  }
  async function addGallery() {
    const r = await pick({ multiple: true, title: "Add photos to the gallery" });
    if (r?.length)
      setDraft((d) => ({
        ...d,
        gallery: [
          ...d.gallery,
          ...r.map((m) => ({ url: m.url, caption: m.caption ?? "", alt: m.alt ?? "" })),
        ],
      }));
  }
  const moveGallery = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      const g = [...d.gallery];
      const j = i + dir;
      if (j < 0 || j >= g.length) return d;
      [g[i], g[j]] = [g[j], g[i]];
      return { ...d, gallery: g };
    });

  const statusLine = saving
    ? "Saving…"
    : dirty
      ? live === "draft" && savedLive === "draft"
        ? "Unsaved changes · autosaving"
        : "Unsaved changes"
      : savedAt
        ? `Saved ${savedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
        : "All changes saved";

  const publicHref = categoryObj ? `/${categoryObj.slug}/${draft.slug}` : null;
  const localDate = draft.published_at ? toLocalInput(draft.published_at) : "";
  const futureDate = !!draft.published_at && new Date(draft.published_at) > new Date();

  const words = useMemo(
    () => stripHtml(draft.content_html).split(" ").filter(Boolean).length,
    [draft.content_html],
  );

  return (
    <div className="min-h-screen" style={{ ["--toolbar-top" as any]: "61px" }}>
      {/* top bar */}
      <header className="sticky top-0 z-20 flex h-[61px] items-center gap-2 border-b border-border bg-ivory/95 px-3 backdrop-blur sm:px-5">
        <Link
          to="/admin"
          className="inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm text-foreground/75 hover:bg-pale hover:text-moss"
          aria-label="Back to posts"
        >
          <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Posts</span>
        </Link>
        <Leaf className="hidden h-5 w-5 text-moss md:block" />
        <StatusBadge status={savedLive} />
        <span
          className={`truncate text-sm ${dirty ? "text-stamp" : "text-muted-foreground"}`}
          aria-live="polite"
        >
          {statusLine}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <button onClick={() => setPreview("desktop")} className={`${btnGhost} px-3`}>
            <Eye className="h-4 w-4" /> <span className="hidden sm:inline">Preview</span>
          </button>
          {savedLive === "draft" || savedLive === "archived" ? (
            <>
              <button
                onClick={() => save()}
                disabled={saving}
                className={`${btnGhost} hidden sm:inline-flex`}
              >
                Save draft
              </button>
              <button onClick={publish} disabled={saving} className={btnPrimary}>
                {futureDate ? (
                  <>
                    <CalendarClock className="h-4 w-4" /> Schedule
                  </>
                ) : (
                  "Publish"
                )}
              </button>
            </>
          ) : (
            <button
              onClick={() => (futureDate !== (savedLive === "scheduled") ? publish() : save())}
              disabled={saving || !dirty}
              className={btnPrimary}
            >
              {futureDate && savedLive !== "scheduled" ? "Schedule" : "Update"}
            </button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded-full p-2 text-foreground/70 hover:bg-pale"
              aria-label="More actions"
            >
              <MoreHorizontal className="h-5 w-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-paper">
              <DropdownMenuItem onClick={() => save()} className="sm:hidden">
                Save
              </DropdownMenuItem>
              {(savedLive === "published" || savedLive === "scheduled") && (
                <DropdownMenuItem onClick={unpublish}>Unpublish (back to drafts)</DropdownMenuItem>
              )}
              {savedLive === "published" && publicHref && (
                <DropdownMenuItem onClick={() => window.open(publicHref, "_blank")}>
                  View on the blog
                </DropdownMenuItem>
              )}
              {savedLive !== "archived" && (
                <DropdownMenuItem
                  onClick={async () => {
                    if (await save({ status: "archived" }, { quiet: true }))
                      toast.success("Archived");
                  }}
                >
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={async () => {
                  if (dirty) await save({}, { quiet: true });
                  const nid = await duplicatePost(id);
                  toast.success("Copy created as a draft");
                  navigate({ to: "/admin/posts/$id", params: { id: nid } });
                }}
              >
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => setConfirmDelete(true)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="h-4 w-4" /> Delete…
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {recovery && (
        <div className="flex flex-wrap items-center justify-center gap-3 border-b border-oat bg-note px-4 py-2.5 text-sm">
          <span>
            You have unsaved changes from {new Date(recovery.at).toLocaleString()} in this browser.
          </span>
          <button
            className="rounded-full bg-primary px-3 py-1 text-primary-foreground"
            onClick={() => {
              setDraft(recovery.draft);
              setEditorKey((k) => k + 1);
              setRecovery(null);
              toast.success("Recovered — remember to save");
            }}
          >
            Recover them
          </button>
          <button
            className="underline underline-offset-4"
            onClick={() => {
              safeRemove(backupKey(id));
              setRecovery(null);
            }}
          >
            Discard
          </button>
        </div>
      )}

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        {/* writing column */}
        <div className="min-w-0 space-y-5">
          <p className="font-hand text-xl text-muted-foreground">
            {tpl.label} · template {tpl.letter}
          </p>
          <label className="block">
            <span className="sr-only">Title</span>
            <textarea
              rows={1}
              value={draft.title}
              onChange={(e) => set("title", e.target.value.replace(/\n/g, ""))}
              placeholder={
                draft.template === "note" || draft.template === "haiku"
                  ? "Title (optional)"
                  : "Your title…"
              }
              className="w-full resize-none overflow-hidden bg-transparent font-display text-4xl leading-tight text-moss outline-none placeholder:text-moss/35 sm:text-5xl [field-sizing:content]"
            />
          </label>
          {draft.template !== "note" && (
            <label className="block">
              <span className="sr-only">Subtitle</span>
              <input
                value={draft.subtitle}
                onChange={(e) => set("subtitle", e.target.value)}
                placeholder="Add a subtitle (optional)"
                className="w-full bg-transparent font-display text-xl italic text-muted-foreground outline-none placeholder:text-muted-foreground/50 sm:text-2xl"
              />
            </label>
          )}

          {tpl.fields.length > 0 && (
            <section className="rounded-sm border border-dashed border-sage bg-pale/40 p-5">
              <h2 className="mb-4 font-display text-2xl text-moss">{tpl.label} details</h2>
              <FieldsEditor fields={tpl.fields} values={draft.fields} onChange={setField} />
            </section>
          )}

          <div>
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-2xl text-moss">
                {draft.template === "haiku"
                  ? "Reflection beneath the poem"
                  : draft.template === "recipe"
                    ? "Introduction & notes"
                    : draft.template === "paper"
                      ? "My thoughts & chatter"
                      : "Your writing"}
              </h2>
              <span className="text-xs text-muted-foreground">
                {words} words · {readingTime(draft.content_html)} min read
              </span>
            </div>
            <RichEditor
              key={editorKey}
              value={draft.content_html}
              onChange={(html) => set("content_html", html)}
              pickImages={() => pick({ multiple: true, title: "Insert photos into your writing" })}
              placeholder={
                draft.template === "note"
                  ? "Jot down a little thought…"
                  : "Start writing… Use the toolbar for headings, quotes, photos and dividers."
              }
              className={draft.template === "note" ? "font-hand !text-2xl" : ""}
            />
          </div>
        </div>

        {/* settings column */}
        <aside className="space-y-5 lg:sticky lg:top-[77px] lg:max-h-[calc(100vh-93px)] lg:overflow-y-auto lg:pb-6">
          <Box title="Publishing">
            <Labeled
              label="Publication date"
              hint={
                futureDate
                  ? "In the future — the post will appear automatically then."
                  : "Leave empty to use the moment you publish. Pick a future date to schedule."
              }
            >
              <div className="flex gap-1.5">
                <input
                  type="datetime-local"
                  value={localDate}
                  onChange={(e) =>
                    set(
                      "published_at",
                      e.target.value ? new Date(e.target.value).toISOString() : null,
                    )
                  }
                  className={`${inputCls} text-sm`}
                />
                {draft.published_at && (
                  <button
                    type="button"
                    onClick={() => set("published_at", null)}
                    className="rounded-sm px-2 text-muted-foreground hover:bg-pale"
                    aria-label="Clear date"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </Labeled>
            <label className="mt-4 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => set("featured", e.target.checked)}
                className="mt-1 accent-[var(--moss)]"
              />
              <span>
                Feature on the homepage{" "}
                <span className="block text-xs text-muted-foreground">
                  Replaces the current featured post.
                </span>
              </span>
            </label>
            <label className="mt-3 flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.is_placeholder}
                onChange={(e) => set("is_placeholder", e.target.checked)}
                className="mt-1 accent-[var(--moss)]"
              />
              <span>
                Mark as “sample placeholder”{" "}
                <span className="block text-xs text-muted-foreground">
                  Untick once it's your real writing.
                </span>
              </span>
            </label>
          </Box>

          <Box title="Template & category">
            <Labeled label="Template">
              <select
                value={draft.template}
                onChange={(e) => set("template", e.target.value)}
                className={inputCls}
              >
                {TEMPLATES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.letter}. {t.label}
                  </option>
                ))}
              </select>
            </Labeled>
            <Labeled label="Category" className="mt-3">
              <select
                value={draft.category_id ?? ""}
                onChange={(e) => set("category_id", e.target.value || null)}
                className={inputCls}
              >
                <option value="">— choose —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Labeled>
            <div className="mt-3">
              <span className="mb-1 block text-sm font-medium text-foreground/80">Tags</span>
              <TagPicker
                all={allTags}
                value={draft.tags}
                onChange={(t) => set("tags", t)}
                onCreate={async (name) => {
                  const t = await createTag(name);
                  qc.invalidateQueries({ queryKey: ["admin", "tags"] });
                  qc.invalidateQueries({ queryKey: ["tags"] });
                  return t;
                }}
              />
            </div>
          </Box>

          <Box title={draft.template === "field_note" ? "Main photograph" : "Cover photo"}>
            {draft.cover_image_url ? (
              <div>
                <div className="polaroid !pb-3">
                  <img
                    src={draft.cover_image_url}
                    alt={draft.cover_image_alt}
                    className="aspect-[4/3] w-full object-cover"
                  />
                </div>
                <Labeled
                  label="Caption & description"
                  hint="Shown under the photo and read aloud by screen readers."
                  className="mt-3"
                >
                  <input
                    value={draft.cover_image_alt}
                    onChange={(e) => set("cover_image_alt", e.target.value)}
                    className={`${inputCls} text-sm`}
                    placeholder="Low sunlight through cedar branches"
                  />
                </Labeled>
                <div className="mt-3 flex gap-2">
                  <button onClick={pickCover} className={btnGhost}>
                    Change
                  </button>
                  <button
                    onClick={() => set("cover_image_url", null)}
                    className={`${btnGhost} text-destructive`}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={pickCover}
                className="flex w-full flex-col items-center gap-2 rounded-sm border-2 border-dashed border-sage/70 bg-ivory py-8 text-sm text-moss hover:bg-pale"
              >
                <ImagePlus className="h-6 w-6" /> Choose a photo
              </button>
            )}
          </Box>

          <Box
            title="Photo gallery"
            note={tpl.usesGallery ? undefined : "Shown as polaroids beneath the post."}
          >
            {draft.gallery.length > 0 && (
              <ul className="mb-3 space-y-3">
                {draft.gallery.map((g, i) => (
                  <li
                    key={`${g.url}-${i}`}
                    className="flex gap-2 rounded-sm border border-border bg-ivory p-2"
                  >
                    <img
                      src={g.url}
                      alt=""
                      className="h-16 w-16 shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <input
                        value={g.caption ?? ""}
                        onChange={(e) =>
                          set(
                            "gallery",
                            draft.gallery.map((x, j) =>
                              j === i ? { ...x, caption: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Caption"
                        aria-label="Caption"
                        className="w-full rounded-sm border border-input bg-paper px-2 py-1 text-sm outline-none focus:border-moss"
                      />
                      <input
                        value={g.alt ?? ""}
                        onChange={(e) =>
                          set(
                            "gallery",
                            draft.gallery.map((x, j) =>
                              j === i ? { ...x, alt: e.target.value } : x,
                            ),
                          )
                        }
                        placeholder="Description for screen readers"
                        aria-label="Alt text"
                        className="w-full rounded-sm border border-input bg-paper px-2 py-1 text-xs outline-none focus:border-moss"
                      />
                    </div>
                    <div className="flex flex-col">
                      <button
                        onClick={() => moveGallery(i, -1)}
                        disabled={i === 0}
                        className="rounded-sm p-1 text-muted-foreground hover:bg-pale disabled:opacity-30"
                        aria-label="Move up"
                      >
                        <ArrowUp className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => moveGallery(i, 1)}
                        disabled={i === draft.gallery.length - 1}
                        className="rounded-sm p-1 text-muted-foreground hover:bg-pale disabled:opacity-30"
                        aria-label="Move down"
                      >
                        <ArrowDown className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() =>
                          set(
                            "gallery",
                            draft.gallery.filter((_, j) => j !== i),
                          )
                        }
                        className="rounded-sm p-1 text-destructive hover:bg-destructive/10"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <button onClick={addGallery} className={`${btnGhost} w-full`}>
              <Plus className="h-4 w-4" /> Add photos
            </button>
          </Box>

          <Box title="Summary & search engines">
            <Labeled
              label="Short summary"
              hint="Shown on post cards. Leave empty to use the first lines."
            >
              <textarea
                value={draft.excerpt}
                onChange={(e) => set("excerpt", e.target.value)}
                rows={3}
                className={`${inputCls} text-sm`}
              />
            </Labeled>
            <Labeled
              label="Search description"
              hint={`${draft.seo_description.length}/160 — what Google shows under the title.`}
              className="mt-3"
            >
              <textarea
                value={draft.seo_description}
                onChange={(e) => set("seo_description", e.target.value)}
                rows={3}
                maxLength={200}
                className={`${inputCls} text-sm`}
              />
            </Labeled>
            <Labeled
              label="Web address"
              hint={
                categoryObj
                  ? `thelittlecove…/${categoryObj.slug}/${draft.slug.startsWith("untitled-") && draft.title ? slugify(draft.title) : draft.slug}`
                  : undefined
              }
              className="mt-3"
            >
              <input
                value={draft.slug}
                onChange={(e) => set("slug", slugify(e.target.value) || e.target.value)}
                className={`${inputCls} text-sm`}
              />
            </Labeled>
            {savedLive === "published" && (
              <p className="mt-2 text-xs text-stamp">
                Changing the address of a published post breaks old links to it.
              </p>
            )}
          </Box>
        </aside>
      </div>

      {preview && (
        <Dialog open onOpenChange={(o) => !o && setPreview(null)}>
          <DialogContent className="flex h-[94vh] max-w-[96vw] flex-col gap-0 overflow-hidden bg-ivory p-0 sm:max-w-[96vw]">
            <div className="flex items-center gap-2 border-b border-border px-4 py-2.5">
              <DialogTitle className="font-display text-xl font-normal text-moss">
                Preview
              </DialogTitle>
              <span className="hidden text-xs text-muted-foreground sm:inline">
                — updates as you type; only you can see this
              </span>
              <div className="ml-auto mr-8 flex rounded-full border border-border bg-paper p-0.5">
                <button
                  onClick={() => setPreview("desktop")}
                  aria-pressed={preview === "desktop"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${preview === "desktop" ? "bg-moss text-primary-foreground" : ""}`}
                >
                  <Monitor className="h-4 w-4" /> Desktop
                </button>
                <button
                  onClick={() => setPreview("mobile")}
                  aria-pressed={preview === "mobile"}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm ${preview === "mobile" ? "bg-moss text-primary-foreground" : ""}`}
                >
                  <Smartphone className="h-4 w-4" /> Mobile
                </button>
              </div>
            </div>
            <div className="flex flex-1 justify-center overflow-auto bg-muted/60 p-4">
              <iframe
                title="Post preview"
                src={`/preview/${id}?live=1`}
                className={`h-full rounded-sm border border-border bg-background shadow-lg transition-[width] ${preview === "mobile" ? "w-[390px]" : "w-full"}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      <Confirm
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this post forever?"
        description="It will be permanently removed and can't be recovered. To just hide it, use Unpublish or Archive instead."
        onConfirm={async () => {
          await deletePost(id);
          safeRemove(backupKey(id));
          setSaved(JSON.stringify(draft));
          qc.invalidateQueries({ queryKey: ["admin"] });
          toast.success("Post deleted");
          navigate({ to: "/admin" });
        }}
      />
      {pickerEl}
    </div>
  );
}

function Box({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-sm border border-border bg-paper p-4">
      <h2 className="font-display text-xl text-moss">{title}</h2>
      {note && <p className="-mt-0.5 mb-2 text-xs text-muted-foreground">{note}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function FieldsEditor({
  fields,
  values,
  onChange,
}: {
  fields: FieldDef[];
  values: Record<string, any>;
  onChange: (k: string, v: any) => void;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {fields.map((f) => {
        const v = values[f.key];
        const wide = f.type === "textarea" || f.type === "list" || f.type === "links";
        const isJp = f.key === "japanese";
        return (
          <div key={f.key} className={wide ? "sm:col-span-2" : ""}>
            {f.type === "links" ? (
              <LinksField
                label={f.label}
                value={Array.isArray(v) ? v : []}
                onChange={(x) => onChange(f.key, x)}
              />
            ) : (
              <Labeled label={f.label} hint={f.hint}>
                {f.type === "text" && (
                  <input
                    value={v ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className={`${inputCls} ${"italic" in f && f.italic ? "font-display text-lg italic" : ""}`}
                  />
                )}
                {f.type === "date" && (
                  <input
                    type="date"
                    value={v ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    className={inputCls}
                  />
                )}
                {f.type === "textarea" && (
                  <textarea
                    value={v ?? ""}
                    onChange={(e) => onChange(f.key, e.target.value)}
                    rows={isJp || f.key === "romaji" || f.key === "english" ? 4 : 3}
                    lang={isJp ? "ja" : undefined}
                    placeholder={f.placeholder}
                    className={`${inputCls} ${isJp ? "jp text-xl leading-9 tracking-widest" : ""}`}
                  />
                )}
                {f.type === "list" && (
                  <textarea
                    value={Array.isArray(v) ? v.join("\n") : (v ?? "")}
                    onChange={(e) => onChange(f.key, e.target.value.split("\n"))}
                    onBlur={(e) =>
                      onChange(
                        f.key,
                        e.target.value
                          .split("\n")
                          .map((s) => s.trim())
                          .filter(Boolean),
                      )
                    }
                    rows={5}
                    placeholder={f.placeholder ? `${f.placeholder}\n…` : "One per line"}
                    className={`${inputCls} leading-7`}
                  />
                )}
              </Labeled>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LinksField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { label: string; url: string }[];
  onChange: (v: { label: string; url: string }[]) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm font-medium text-foreground/80">{label}</span>
      <div className="space-y-2">
        {value.map((r, i) => (
          <div key={i} className="flex gap-2">
            <input
              value={r.label}
              onChange={(e) =>
                onChange(value.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
              }
              placeholder="Title (e.g. a book or website)"
              aria-label="Reference title"
              className={`${inputCls} text-sm`}
            />
            <input
              value={r.url}
              onChange={(e) =>
                onChange(value.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)))
              }
              placeholder="https://… (optional)"
              aria-label="Reference link"
              className={`${inputCls} text-sm`}
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="rounded-sm px-2 text-destructive hover:bg-destructive/10"
              aria-label="Remove reference"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => onChange([...value, { label: "", url: "" }])}
        className="mt-2 inline-flex items-center gap-1 text-sm text-moss underline underline-offset-4"
      >
        <Plus className="h-3.5 w-3.5" /> Add a reference
      </button>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
