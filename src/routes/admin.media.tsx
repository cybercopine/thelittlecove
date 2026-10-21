import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Copy, Search, Trash2, X } from "lucide-react";
import { deleteMedia, listMedia, updateMedia, type MediaItem } from "@/lib/admin-data";
import { DropZone, useUploader } from "@/components/admin/MediaPicker";
import {
  btnDanger,
  btnGhost,
  btnPrimary,
  Confirm,
  inputCls,
  Labeled,
  PageHeader,
} from "@/components/admin/bits";

export const Route = createFileRoute("/admin/media")({
  component: MediaLibrary,
});

function MediaLibrary() {
  const qc = useQueryClient();
  const {
    data: media = [],
    isLoading,
    error,
  } = useQuery({ queryKey: ["admin", "media"], queryFn: listMedia });
  const [folder, setFolder] = useState("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const { upload, progress } = useUploader(folder !== "all" && folder !== "none" ? folder : null);

  const folders = useMemo(
    () => [...new Set(media.map((m) => m.folder).filter(Boolean) as string[])].sort(),
    [media],
  );
  const shown = media.filter((m) => {
    if (folder === "none" && m.folder) return false;
    if (folder !== "all" && folder !== "none" && m.folder !== folder) return false;
    if (q && !`${m.caption ?? ""} ${m.alt ?? ""} ${m.path}`.toLowerCase().includes(q.toLowerCase()))
      return false;
    return true;
  });

  return (
    <div>
      <PageHeader kicker="the photo box" title="Media library" />
      <DropZone progress={progress} onFiles={(f) => upload(f)} />
      {folder !== "all" && folder !== "none" && (
        <p className="mt-2 text-sm text-muted-foreground">
          New uploads go into the “{folder}” folder.
        </p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <FolderChip active={folder === "all"} onClick={() => setFolder("all")}>
          All photos <span className="opacity-60">{media.length}</span>
        </FolderChip>
        {folders.map((f) => (
          <FolderChip key={f} active={folder === f} onClick={() => setFolder(f)}>
            {f} <span className="opacity-60">{media.filter((m) => m.folder === f).length}</span>
          </FolderChip>
        ))}
        {folders.length > 0 && (
          <FolderChip active={folder === "none"} onClick={() => setFolder("none")}>
            Unsorted
          </FolderChip>
        )}
        <label className="relative ml-auto w-full sm:w-64">
          <span className="sr-only">Search photos</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search captions…"
            className={`${inputCls} pl-9 text-sm`}
          />
        </label>
      </div>

      {error && (
        <p className="mt-6 rounded-sm bg-note p-4 text-sm">
          Couldn't load the library: {(error as Error).message}
        </p>
      )}
      {isLoading && (
        <p className="py-16 text-center font-hand text-2xl text-muted-foreground">
          opening the photo box…
        </p>
      )}
      {!isLoading && !shown.length && (
        <p className="py-16 text-center font-hand text-2xl text-muted-foreground">
          {media.length ? "no photos match" : "no photos yet — drop some above"}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
        {shown.map((m, i) => (
          <button
            key={m.id}
            onClick={() => setSelected(m)}
            className={`polaroid paper-lift !p-2 !pb-8 text-left ${i % 2 ? "rotate-[0.6deg]" : "rotate-[-0.6deg]"}`}
          >
            <img
              src={m.url}
              alt={m.alt ?? ""}
              loading="lazy"
              className="aspect-square w-full bg-pale object-cover"
            />
            <span className="mt-1 block truncate px-1 font-hand text-base text-muted-foreground">
              {m.caption || (m.alt ? m.alt : "add a caption…")}
            </span>
          </button>
        ))}
      </div>

      {selected && (
        <Details
          key={selected.id}
          item={selected}
          folders={folders}
          onClose={() => setSelected(null)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "media"] })}
        />
      )}
    </div>
  );
}

function FolderChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3 py-1 text-sm ${active ? "border-moss bg-moss text-primary-foreground" : "border-border bg-paper hover:bg-pale"}`}
    >
      {children}
    </button>
  );
}

function Details({
  item,
  folders,
  onClose,
  onSaved,
}: {
  item: MediaItem;
  folders: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [alt, setAlt] = useState(item.alt ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");
  const [folder, setFolder] = useState(item.folder ?? "");
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  async function save() {
    setBusy(true);
    try {
      await updateMedia(item.id, {
        alt: alt.trim() || null,
        caption: caption.trim() || null,
        folder: folder.trim() || null,
      });
      toast.success("Photo details saved");
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-foreground/20 backdrop-blur-[1px]"
      onClick={onClose}
    >
      <aside
        role="dialog"
        aria-label="Photo details"
        className="h-full w-full max-w-md overflow-y-auto bg-paper p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl text-moss">Photo details</h2>
          <button onClick={onClose} className="rounded-full p-2 hover:bg-pale" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>
        <img
          src={item.url}
          alt={item.alt ?? ""}
          className="mt-4 max-h-80 w-full rounded-sm bg-pale object-contain"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          {item.width && item.height ? `${item.width} × ${item.height}px · ` : ""}added{" "}
          {new Date(item.created_at).toLocaleDateString()}
        </p>
        <div className="mt-5 space-y-4">
          <Labeled label="Caption" hint="Shown under the photo when you use it.">
            <input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className={inputCls}
              placeholder="the garden · oct 19"
            />
          </Labeled>
          <Labeled
            label="Description (alt text)"
            hint="Describe the photo for people using screen readers, and for search engines."
          >
            <textarea
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="A pale green moth resting on cedar bark"
            />
          </Labeled>
          <Labeled
            label="Folder"
            hint="Group photos however you like, e.g. moths, ikebana, kitchen."
          >
            <input
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              list="media-folders"
              className={inputCls}
            />
            <datalist id="media-folders">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          </Labeled>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <button onClick={save} disabled={busy} className={btnPrimary}>
            Save details
          </button>
          <button
            onClick={() => {
              navigator.clipboard?.writeText(new URL(item.url, window.location.origin).href);
              toast.success("Link copied");
            }}
            className={btnGhost}
          >
            <Copy className="h-4 w-4" /> Copy link
          </button>
          <button onClick={() => setConfirm(true)} className={`${btnDanger} ml-auto`}>
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted-foreground">
          Tip: changing a caption here doesn't change copies already placed inside posts — edit
          those in the post itself.
        </p>
        <Confirm
          open={confirm}
          onOpenChange={setConfirm}
          title="Delete this photo?"
          description="It will disappear from the library and from any post that still uses it. This can't be undone."
          onConfirm={async () => {
            try {
              await deleteMedia(item);
              toast.success("Photo deleted");
              onSaved();
              onClose();
            } catch (e: any) {
              toast.error(e.message);
            }
          }}
        />
      </aside>
    </div>
  );
}
