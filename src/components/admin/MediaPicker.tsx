import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { Check, Search, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { listMedia, uploadMedia, type MediaItem } from "@/lib/admin-data";
import { btnGhost, btnPrimary, inputCls } from "./bits";

/** Upload button + drag-and-drop area. Photos are resized in the browser before upload. */
export function useUploader(folder?: string | null) {
  const qc = useQueryClient();
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const upload = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (!list.length) {
        toast.error("Only photos and images can be uploaded");
        return [];
      }
      const out: MediaItem[] = [];
      setProgress({ done: 0, total: list.length });
      for (const f of list) {
        try {
          out.push(await uploadMedia(f, { folder }));
        } catch (e: any) {
          toast.error(`${f.name}: ${e.message}`);
        }
        setProgress((p) => (p ? { ...p, done: p.done + 1 } : p));
      }
      setProgress(null);
      qc.invalidateQueries({ queryKey: ["admin", "media"] });
      if (out.length)
        toast.success(`${out.length} photo${out.length > 1 ? "s" : ""} added to your library`);
      return out;
    },
    [qc, folder],
  );
  return { upload, progress };
}

export function DropZone({
  onFiles,
  progress,
  compact,
}: {
  onFiles: (f: FileList) => void;
  progress: { done: number; total: number } | null;
  compact?: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (e.dataTransfer.files.length) onFiles(e.dataTransfer.files);
      }}
      className={`flex flex-col items-center justify-center gap-2 rounded-sm border-2 border-dashed text-center transition-colors ${
        over ? "border-moss bg-pale" : "border-sage/70 bg-ivory"
      } ${compact ? "px-4 py-4" : "px-6 py-10"}`}
    >
      {progress ? (
        <p className="font-hand text-xl text-moss">
          uploading {progress.done + 1 > progress.total ? progress.total : progress.done + 1} of{" "}
          {progress.total}…
        </p>
      ) : (
        <>
          <Upload className="h-6 w-6 text-moss" />
          <p className="text-sm text-foreground/75">
            Drag photos here, or{" "}
            <button
              type="button"
              onClick={() => input.current?.click()}
              className="text-moss underline underline-offset-4"
            >
              choose from your computer
            </button>
          </p>
          {!compact && (
            <p className="text-xs text-muted-foreground">
              Large photos are shrunk automatically so pages stay quick.
            </p>
          )}
        </>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          if (e.target.files?.length) onFiles(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

type PickOpts = { multiple?: boolean; title?: string };

/** Imperative media picker: `const items = await pick({ multiple: true })`. */
export function useMediaPicker() {
  const [state, setState] = useState<
    (PickOpts & { resolve: (v: MediaItem[] | null) => void }) | null
  >(null);
  const pick = useCallback(
    (opts: PickOpts = {}) =>
      new Promise<MediaItem[] | null>((resolve) => setState({ ...opts, resolve })),
    [],
  );
  const close = (v: MediaItem[] | null) => {
    state?.resolve(v);
    setState(null);
  };
  const element = state ? <PickerDialog opts={state} onClose={close} /> : null;
  return { pick, element };
}

function PickerDialog({
  opts,
  onClose,
}: {
  opts: PickOpts;
  onClose: (v: MediaItem[] | null) => void;
}) {
  const { data: fetched = [], isLoading } = useQuery({
    queryKey: ["admin", "media"],
    queryFn: listMedia,
  });
  const [extra, setExtra] = useState<MediaItem[]>([]);
  const media = [...extra.filter((e) => !fetched.some((f) => f.id === e.id)), ...fetched];
  const [selected, setSelected] = useState<string[]>([]);
  const [q, setQ] = useState("");
  const { upload, progress } = useUploader();

  const shown = media.filter(
    (m) =>
      !q ||
      `${m.caption ?? ""} ${m.alt ?? ""} ${m.folder ?? ""} ${m.path}`
        .toLowerCase()
        .includes(q.toLowerCase()),
  );
  const toggle = (id: string) =>
    setSelected((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : opts.multiple ? [...s, id] : [id],
    );

  return (
    <Dialog open onOpenChange={(o) => !o && onClose(null)}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden bg-paper p-0">
        <div className="flex max-h-[90vh] flex-col">
          <DialogHeader className="border-b border-border px-6 pb-4 pt-6">
            <DialogTitle className="font-display text-3xl font-normal text-moss">
              {opts.title ?? (opts.multiple ? "Choose photos" : "Choose a photo")}
            </DialogTitle>
            <DialogDescription>
              {opts.multiple
                ? "Click several photos to pick them, in the order you'd like."
                : "Click a photo, then press Use photo."}{" "}
              New uploads are selected automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto px-6 py-4">
            <DropZone
              compact
              progress={progress}
              onFiles={async (f) => {
                const added = await upload(f);
                setExtra((x) => [...added, ...x]);
                if (added.length)
                  setSelected((s) =>
                    opts.multiple ? [...s, ...added.map((a) => a.id)] : [added[0].id],
                  );
              }}
            />
            <label className="relative block">
              <span className="sr-only">Search photos</span>
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search captions, alt text, folders…"
                className={`${inputCls} pl-9`}
              />
            </label>
            {isLoading && (
              <p className="py-8 text-center font-hand text-xl text-muted-foreground">
                opening the photo box…
              </p>
            )}
            {!isLoading && !media.length && (
              <p className="py-8 text-center font-hand text-xl text-muted-foreground">
                no photos yet — upload your first above
              </p>
            )}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5">
              {shown.map((m) => {
                const idx = selected.indexOf(m.id);
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggle(m.id)}
                    onDoubleClick={() => !opts.multiple && onClose([m])}
                    aria-pressed={idx >= 0}
                    className={`group relative aspect-square overflow-hidden rounded-sm border-2 bg-pale ${idx >= 0 ? "border-moss" : "border-transparent hover:border-sage"}`}
                  >
                    <img
                      src={m.url}
                      alt={m.alt ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                    {idx >= 0 && (
                      <span className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-moss text-xs text-primary-foreground">
                        {opts.multiple ? idx + 1 : <Check className="h-3.5 w-3.5" />}
                      </span>
                    )}
                    {m.caption && (
                      <span className="absolute inset-x-0 bottom-0 truncate bg-paper/85 px-1.5 py-0.5 text-left font-hand text-sm">
                        {m.caption}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border px-6 py-4">
            <span className="text-sm text-muted-foreground">
              {selected.length ? `${selected.length} selected` : ""}
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={() => onClose(null)} className={btnGhost}>
                Cancel
              </button>
              <button
                type="button"
                disabled={!selected.length}
                onClick={() =>
                  onClose(selected.map((id) => media.find((m) => m.id === id)!).filter(Boolean))
                }
                className={btnPrimary}
              >
                {opts.multiple ? "Add photos" : "Use photo"}
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
