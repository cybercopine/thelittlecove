import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Archive,
  Copy,
  Eye,
  EyeOff,
  MoreHorizontal,
  PenLine,
  Plus,
  Search,
  Send,
  Star,
  Trash2,
  Undo2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  deletePost,
  duplicatePost,
  listAdminPosts,
  listCategories,
  listTagsWithCounts,
  setFeatured,
  updatePost,
  type AdminPost,
} from "@/lib/admin-data";
import { getTemplate, TEMPLATES } from "@/lib/templates";
import { fmtDate, stripHtml } from "@/lib/format";
import {
  btnPrimary,
  Confirm,
  effectiveStatus,
  inputCls,
  PageHeader,
  StatusBadge,
} from "@/components/admin/bits";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const {
    data: posts = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin", "posts"], queryFn: listAdminPosts });
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listCategories,
  });
  const { data: tags = [] } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: listTagsWithCounts,
  });

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [cat, setCat] = useState("all");
  const [tag, setTag] = useState("all");
  const [tpl, setTpl] = useState("all");
  const [toDelete, setToDelete] = useState<AdminPost | null>(null);

  const counts = useMemo(() => {
    const c = { all: posts.length, published: 0, draft: 0, scheduled: 0, archived: 0 } as Record<
      string,
      number
    >;
    for (const p of posts) c[effectiveStatus(p.status, p.published_at)]++;
    return c;
  }, [posts]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return posts.filter((p) => {
      if (status !== "all" && effectiveStatus(p.status, p.published_at) !== status) return false;
      if (cat !== "all" && p.category_id !== cat) return false;
      if (tag !== "all" && !p.tags.some((t) => t.id === tag)) return false;
      if (tpl !== "all" && p.template !== tpl) return false;
      if (term) {
        const hay =
          `${p.title} ${p.subtitle ?? ""} ${p.excerpt ?? ""} ${p.tags.map((t) => t.name).join(" ")} ${stripHtml(p.content_html)}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [posts, q, status, cat, tag, tpl]);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["home"] });
    qc.invalidateQueries({ queryKey: ["list"] });
  };

  const act = useMutation({
    mutationFn: async ({ post, action }: { post: AdminPost; action: string }) => {
      switch (action) {
        case "publish":
          return updatePost(post.id, {
            status: "published",
            published_at:
              post.published_at && new Date(post.published_at) <= new Date()
                ? post.published_at
                : new Date().toISOString(),
          });
        case "unpublish":
          return updatePost(post.id, { status: "draft" });
        case "archive":
          return updatePost(post.id, { status: "archived" });
        case "restore":
          return updatePost(post.id, { status: "draft" });
        case "feature":
          return setFeatured(post.featured ? null : post.id);
        case "duplicate": {
          const id = await duplicatePost(post.id);
          navigate({ to: "/admin/posts/$id", params: { id } });
          return;
        }
        case "delete":
          return deletePost(post.id);
      }
    },
    onSuccess: (_d, { action }) => {
      const msg: Record<string, string> = {
        publish: "Published — it's live on the blog",
        unpublish: "Moved back to drafts (hidden from readers)",
        archive: "Archived (hidden from readers)",
        restore: "Restored to drafts",
        feature: "Homepage feature updated",
        duplicate: "Copy created as a draft",
        delete: "Post deleted",
      };
      toast.success(msg[action] ?? "Done");
      refresh();
    },
    onError: (e: any) => toast.error(e.message ?? "Something went wrong"),
  });

  const run = (post: AdminPost, action: string) => act.mutate({ post, action });

  return (
    <div>
      <PageHeader kicker="good to see you ~" title="Your pages">
        <Link to="/admin/new" className={btnPrimary}>
          <Plus className="h-4 w-4" /> New post
        </Link>
      </PageHeader>

      {/* status tabs */}
      <div className="mb-5 flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
        {(["all", "published", "draft", "scheduled", "archived"] as const).map((s) => (
          <button
            key={s}
            role="tab"
            aria-selected={status === s}
            onClick={() => setStatus(s)}
            className={`rounded-full border px-3.5 py-1.5 text-sm capitalize transition-colors ${
              status === s
                ? "border-moss bg-moss text-primary-foreground"
                : "border-border bg-paper text-foreground/75 hover:bg-pale"
            }`}
          >
            {s === "all" ? "All" : s} <span className="ml-1 opacity-70">{counts[s] ?? 0}</span>
          </button>
        ))}
      </div>

      {/* filters */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <label className="relative">
          <span className="sr-only">Search posts</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search titles, words, tags…"
            className={`${inputCls} pl-9`}
          />
        </label>
        <Select
          label="Category"
          value={cat}
          onChange={setCat}
          options={[
            ["all", "All categories"],
            ...categories.map((c) => [c.id, c.name] as [string, string]),
          ]}
        />
        <Select
          label="Tag"
          value={tag}
          onChange={setTag}
          options={[["all", "All tags"], ...tags.map((t) => [t.id, t.name] as [string, string])]}
        />
        <Select
          label="Template"
          value={tpl}
          onChange={setTpl}
          options={[
            ["all", "All templates"],
            ...TEMPLATES.map((t) => [t.id, t.label] as [string, string]),
          ]}
        />
      </div>

      {error && (
        <p className="rounded-sm bg-note p-4 text-sm">
          Couldn't load posts: {(error as Error).message}
        </p>
      )}
      {isLoading && (
        <p className="py-16 text-center font-hand text-2xl text-muted-foreground">
          gathering pages…
        </p>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="rounded-sm border border-dashed border-sage bg-paper py-16 text-center">
          <p className="font-hand text-2xl text-muted-foreground">
            {posts.length ? "nothing matches those filters" : "a fresh, empty notebook"}
          </p>
          <Link to="/admin/new" className={`${btnPrimary} mt-4`}>
            <Plus className="h-4 w-4" /> Write something
          </Link>
        </div>
      )}

      <ul className="space-y-3">
        {filtered.map((p) => {
          const st = effectiveStatus(p.status, p.published_at);
          const t = getTemplate(p.template);
          const cover = p.cover_image_url || p.gallery[0]?.url;
          const href = p.category ? `/${p.category.slug}/${p.slug}` : null;
          return (
            <li
              key={p.id}
              className="group flex items-center gap-4 rounded-sm border border-border bg-paper p-3 pr-2 transition-shadow hover:shadow-md sm:p-4"
            >
              <Link
                to="/admin/posts/$id"
                params={{ id: p.id }}
                className="hidden h-16 w-16 shrink-0 overflow-hidden rounded-sm border border-border bg-pale sm:block"
                tabIndex={-1}
                aria-hidden
              >
                {cover ? (
                  <img src={cover} alt="" className="h-full w-full object-cover" loading="lazy" />
                ) : (
                  <span className="grid h-full place-items-center font-display text-2xl text-sage">
                    {t.letter}
                  </span>
                )}
              </Link>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={st} />
                  {p.featured && (
                    <span className="inline-flex items-center gap-1 text-xs text-stamp">
                      <Star className="h-3 w-3 fill-current" /> featured
                    </span>
                  )}
                  {p.is_placeholder && <span className="font-hand text-sm text-stamp">sample</span>}
                </div>
                <Link
                  to="/admin/posts/$id"
                  params={{ id: p.id }}
                  className="mt-1 block truncate font-display text-xl text-foreground hover:text-moss sm:text-2xl"
                >
                  {p.title || (
                    <span className="italic text-muted-foreground">
                      Untitled {t.label.toLowerCase()}
                    </span>
                  )}
                </Link>
                <p className="mt-0.5 truncate text-sm text-muted-foreground">
                  {t.label} · {p.category?.name ?? "No category"}
                  {p.tags.length > 0 && ` · ${p.tags.map((x) => `#${x.name}`).join(" ")}`}
                  {" · "}
                  {st === "scheduled"
                    ? `goes live ${fmtDate(p.published_at, { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}`
                    : st === "published"
                      ? `published ${fmtDate(p.published_at)}`
                      : `edited ${fmtDate(p.updated_at)}`}
                </p>
              </div>
              <Link
                to="/admin/posts/$id"
                params={{ id: p.id }}
                className="hidden rounded-full px-3 py-1.5 text-sm text-moss hover:bg-pale md:inline-flex"
              >
                Edit
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="rounded-full p-2 text-foreground/70 hover:bg-pale hover:text-moss"
                  aria-label={`Actions for ${p.title || "untitled post"}`}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-paper">
                  <DropdownMenuItem
                    onClick={() => navigate({ to: "/admin/posts/$id", params: { id: p.id } })}
                  >
                    <PenLine className="h-4 w-4" /> Edit
                  </DropdownMenuItem>
                  {st === "published" && href && (
                    <DropdownMenuItem onClick={() => window.open(href, "_blank")}>
                      <Eye className="h-4 w-4" /> View on blog
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => window.open(`/preview/${p.id}`, "_blank")}>
                    <Eye className="h-4 w-4" /> Preview
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {(st === "draft" || st === "archived") && (
                    <DropdownMenuItem onClick={() => run(p, "publish")}>
                      <Send className="h-4 w-4" /> Publish now
                    </DropdownMenuItem>
                  )}
                  {(st === "published" || st === "scheduled") && (
                    <DropdownMenuItem onClick={() => run(p, "unpublish")}>
                      <EyeOff className="h-4 w-4" /> Unpublish
                    </DropdownMenuItem>
                  )}
                  {st !== "archived" ? (
                    <DropdownMenuItem onClick={() => run(p, "archive")}>
                      <Archive className="h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem onClick={() => run(p, "restore")}>
                      <Undo2 className="h-4 w-4" /> Restore to drafts
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => run(p, "feature")}>
                    <Star className="h-4 w-4" />{" "}
                    {p.featured ? "Remove from homepage feature" : "Feature on homepage"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => run(p, "duplicate")}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => setToDelete(p)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" /> Delete…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </li>
          );
        })}
      </ul>

      <Confirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title="Delete this post forever?"
        description={
          <>
            “{toDelete?.title || "Untitled"}” will be permanently removed and can't be recovered. If
            you only want to hide it, choose <strong>Unpublish</strong> or <strong>Archive</strong>{" "}
            instead.
          </>
        }
        onConfirm={() => toDelete && run(toDelete, "delete")}
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <label>
      <span className="sr-only">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </label>
  );
}
