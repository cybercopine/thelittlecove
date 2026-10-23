import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Download, ImagePlus, Plus, X } from "lucide-react";
import {
  exportEverything,
  getSettings,
  listAdminPosts,
  saveSetting,
  setFeatured,
} from "@/lib/admin-data";
import { effectiveStatus } from "@/components/admin/bits";
import { RichEditor } from "@/components/admin/RichEditor";
import { useMediaPicker } from "@/components/admin/MediaPicker";
import {
  btnGhost,
  btnPrimary,
  inputCls,
  Labeled,
  PageHeader,
  Panel,
} from "@/components/admin/bits";

export const Route = createFileRoute("/admin/settings")({
  component: SettingsPage,
});

type Lately = { label: string; value: string };

function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: getSettings,
    refetchOnWindowFocus: false,
  });
  const { data: posts = [] } = useQuery({ queryKey: ["admin", "posts"], queryFn: listAdminPosts });
  const { pick, element: pickerEl } = useMediaPicker();

  const [site, setSite] = useState<Record<string, any>>({});
  const [home, setHome] = useState<Record<string, any>>({});
  const [lately, setLately] = useState<Lately[]>([]);
  const [about, setAbout] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!data) return;
    setSite(data.site ?? {});
    setHome(data.home ?? {});
    setLately(data.lately?.items ?? []);
    setAbout(data.about ?? {});
    setReady(true);
  }, [data]);

  async function save(section: string, key: string, value: any) {
    setBusy(section);
    try {
      await saveSetting(key, value);
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
      qc.invalidateQueries({ queryKey: ["site"] });
      toast.success("Saved — the blog is updated");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(null);
    }
  }

  if (isLoading)
    return (
      <p className="py-16 text-center font-hand text-2xl text-muted-foreground">
        opening settings…
      </p>
    );

  const featured = posts.find((p) => p.featured);
  const livePosts = posts.filter((p) => effectiveStatus(p.status, p.published_at) === "published");
  const h = (k: string) => ({
    value: home[k] ?? "",
    onChange: (e: any) => setHome((x) => ({ ...x, [k]: e.target.value })),
  });
  const s = (k: string) => ({
    value: site[k] ?? "",
    onChange: (e: any) => setSite((x) => ({ ...x, [k]: e.target.value })),
  });

  return (
    <div>
      <PageHeader kicker="the little details" title="Blog settings" />
      <nav aria-label="Settings sections" className="mb-6 flex flex-wrap gap-2 text-sm">
        {[
          ["home", "Homepage"],
          ["lately", "Currently exploring"],
          ["featured", "Featured post"],
          ["about", "About page"],
          ["site", "Tagline & SEO"],
          ["backup", "Backup"],
        ].map(([id, l]) => (
          <a
            key={id}
            href={`#${id}`}
            className="rounded-full border border-border bg-paper px-3 py-1 hover:bg-pale"
          >
            {l}
          </a>
        ))}
      </nav>

      <div className="space-y-8">
        <Panel id="home" title="Homepage welcome">
          <div className="grid gap-4 md:grid-cols-2">
            <Labeled label="Heading">
              <input {...h("intro_title")} className={`${inputCls} font-display text-xl`} />
            </Labeled>
            <Labeled label="Little line beside the date" hint="e.g. “From my wooden desk”">
              <input {...h("intro_date")} className={inputCls} />
            </Labeled>
            <Labeled
              label="Welcome letter"
              hint="Leave an empty line between paragraphs."
              className="md:col-span-2"
            >
              <textarea {...h("intro_body")} rows={7} className={`${inputCls} leading-7`} />
            </Labeled>
            <Labeled label="Signature">
              <input {...h("signature")} className={`${inputCls} font-hand text-xl`} />
            </Labeled>
            <Labeled label="Sticky note">
              <input {...h("sticky_note")} className={`${inputCls} font-hand text-xl`} />
            </Labeled>
            <div className="md:col-span-2 grid gap-4 sm:grid-cols-[160px_1fr]">
              <div>
                <span className="mb-1 block text-sm font-medium text-foreground/80">
                  Polaroid photo
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    const r = await pick({ title: "Choose the homepage polaroid" });
                    if (r?.[0]) setHome((x) => ({ ...x, polaroid_image: r[0].url }));
                  }}
                  className="polaroid block w-full !p-2 !pb-6"
                >
                  {home.polaroid_image ? (
                    <img
                      src={home.polaroid_image}
                      alt=""
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <span className="grid aspect-square place-items-center bg-pale text-center text-xs text-muted-foreground">
                      <ImagePlus className="h-5 w-5" />
                      uses the featured post's photo
                    </span>
                  )}
                </button>
                {home.polaroid_image && (
                  <button
                    type="button"
                    onClick={() => setHome((x) => ({ ...x, polaroid_image: "" }))}
                    className="mt-1 text-xs text-muted-foreground underline"
                  >
                    use featured post's photo instead
                  </button>
                )}
              </div>
              <Labeled label="Polaroid caption">
                <input {...h("polaroid_caption")} className={`${inputCls} font-hand text-xl`} />
              </Labeled>
            </div>
            <Labeled label="Little dreams & aspirations" className="md:col-span-2">
              <textarea
                {...h("dreams")}
                rows={3}
                className={`${inputCls} font-hand text-xl leading-8`}
              />
            </Labeled>
            <div className="grid gap-4 md:col-span-2 md:grid-cols-3">
              <Labeled label="Heading above the featured post">
                <input
                  {...h("section_featured")}
                  placeholder="From the journal"
                  className={inputCls}
                />
              </Labeled>
              <Labeled label="Heading above recent posts">
                <input
                  {...h("section_recent")}
                  placeholder="Recent Artifacts & Notebook Leaves"
                  className={inputCls}
                />
              </Labeled>
              <Labeled label="Heading above the sections">
                <input
                  {...h("section_chapters")}
                  placeholder="Chapters of the Cove"
                  className={inputCls}
                />
              </Labeled>
            </div>
            <Labeled label="Favourite quote">
              <textarea
                {...h("quote")}
                rows={2}
                className={`${inputCls} font-display text-lg italic`}
              />
            </Labeled>
            <Labeled label="Quote author" hint="e.g. — Rumi">
              <input {...h("quote_author")} className={inputCls} />
            </Labeled>
          </div>
          <SaveRow busy={busy === "home"} onSave={() => save("home", "home", home)} />
        </Panel>

        <Panel id="lately" title="Currently exploring">
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            The little “currently loving / learning / reading” card on the homepage.
          </p>
          <ul className="space-y-2">
            {lately.map((l, i) => (
              <li
                key={i}
                className="grid grid-cols-[minmax(5rem,9rem)_minmax(0,1fr)_auto_auto_auto] items-center gap-2"
              >
                <input
                  value={l.label}
                  onChange={(e) =>
                    setLately(lately.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                  placeholder="Reading"
                  aria-label="Label"
                  className={`${inputCls}`}
                />
                <input
                  value={l.value}
                  onChange={(e) =>
                    setLately(lately.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                  }
                  placeholder="The Sound of Waves"
                  aria-label="Value"
                  className={inputCls}
                />
                <button
                  onClick={() => i > 0 && setLately(swap(lately, i, i - 1))}
                  disabled={i === 0}
                  className="rounded-sm p-2 text-muted-foreground hover:bg-pale disabled:opacity-30"
                  aria-label="Move up"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => i < lately.length - 1 && setLately(swap(lately, i, i + 1))}
                  disabled={i === lately.length - 1}
                  className="rounded-sm p-2 text-muted-foreground hover:bg-pale disabled:opacity-30"
                  aria-label="Move down"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setLately(lately.filter((_, j) => j !== i))}
                  className="rounded-sm p-2 text-destructive hover:bg-destructive/10"
                  aria-label="Remove"
                >
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setLately([...lately, { label: "", value: "" }])}
            className={`${btnGhost} mt-3`}
          >
            <Plus className="h-4 w-4" /> Add a line
          </button>
          <SaveRow
            busy={busy === "lately"}
            onSave={() =>
              save("lately", "lately", {
                items: lately.filter((l) => l.label.trim() || l.value.trim()),
              })
            }
          />
        </Panel>

        <Panel id="featured" title="Featured post">
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            The big entry at the top of the homepage. If none is chosen, the newest post is shown.
          </p>
          <select
            value={featured?.id ?? ""}
            onChange={async (e) => {
              try {
                await setFeatured(e.target.value || null);
                qc.invalidateQueries({ queryKey: ["admin", "posts"] });
                qc.invalidateQueries({ queryKey: ["home"] });
                toast.success("Featured post updated");
              } catch (err: any) {
                toast.error(err.message);
              }
            }}
            className={`${inputCls} max-w-xl`}
          >
            <option value="">— newest post automatically —</option>
            {livePosts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title || "Untitled"}
              </option>
            ))}
          </select>
        </Panel>

        <Panel id="about" title="About page">
          <Labeled label="Page title">
            <input
              value={about.title ?? ""}
              onChange={(e) => setAbout((x) => ({ ...x, title: e.target.value }))}
              className={`${inputCls} max-w-xl font-display text-xl`}
            />
          </Labeled>
          <div className="mt-4">
            <span className="mb-1 block text-sm font-medium text-foreground/80">Your words</span>
            {ready && (
              <RichEditor
                value={about.body ?? ""}
                onChange={(html) => setAbout((x) => ({ ...x, body: html }))}
                pickImages={() => pick({ multiple: true })}
                placeholder="Tell readers a little about you and this cove…"
              />
            )}
          </div>
          <SaveRow busy={busy === "about"} onSave={() => save("about", "about", about)} />
        </Panel>

        <Panel id="site" title="Tagline & search engines">
          <div className="grid gap-4">
            <Labeled
              label="Browser tab title (homepage)"
              hint="The name shown on the browser tab and in Google results for your homepage. Keep it under ~60 characters."
            >
              <input
                {...s("home_title")}
                placeholder="The Little Cove — a quiet scrapbook of slow living"
                className={inputCls}
              />
            </Labeled>
            <Labeled
              label="Tagline"
              hint="The handwritten line under “The Little Cove” in the header."
            >
              <input {...s("tagline")} className={`${inputCls} font-hand text-xl`} />
            </Labeled>
            <Labeled
              label="Site description for Google"
              hint={`${(site.seo_description ?? "").length}/160 characters — shown in search results and link previews.`}
            >
              <textarea {...s("seo_description")} rows={3} className={inputCls} />
            </Labeled>
            <Labeled label="Footer note">
              <input {...s("footer_note")} className={`${inputCls} font-hand text-xl`} />
            </Labeled>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Section descriptions (Journal, Food…) are edited under Tags & categories.
          </p>
          <SaveRow busy={busy === "site"} onSave={() => save("site", "site", site)} />
        </Panel>

        <Panel id="backup" title="Backup">
          <p className="-mt-2 mb-4 max-w-2xl text-sm text-muted-foreground">
            Download a copy of all your writing, tags, categories and settings as one file. Keep it
            somewhere safe every month or so. (Photos stay in your media library; this file lists
            where each one lives.)
          </p>
          <button
            onClick={async () => {
              const dump = await exportEverything();
              const blob = new Blob([JSON.stringify(dump, null, 2)], { type: "application/json" });
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `little-cove-backup-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(a.href);
            }}
            className={btnGhost}
          >
            <Download className="h-4 w-4" /> Download backup
          </button>
        </Panel>
      </div>
      {pickerEl}
    </div>
  );
}

function swap<T>(arr: T[], i: number, j: number) {
  const a = [...arr];
  [a[i], a[j]] = [a[j], a[i]];
  return a;
}

function SaveRow({ busy, onSave }: { busy: boolean; onSave: () => void }) {
  return (
    <div className="mt-5 flex justify-end border-t border-dashed border-border pt-4">
      <button onClick={onSave} disabled={busy} className={btnPrimary}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
