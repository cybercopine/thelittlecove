import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import {
  createTag,
  deleteCategory,
  deleteTag,
  listCategories,
  listTagsWithCounts,
  saveCategory,
  updateTag,
  type AdminCategory,
} from "@/lib/admin-data";
import { slugify } from "@/lib/format";
import {
  btnGhost,
  btnPrimary,
  Confirm,
  inputCls,
  Labeled,
  PageHeader,
  Panel,
} from "@/components/admin/bits";

export const Route = createFileRoute("/admin/organize")({
  component: Organize,
});

function useRefresh() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["admin"] });
    qc.invalidateQueries({ queryKey: ["site"] });
    qc.invalidateQueries({ queryKey: ["tags"] });
  };
}

function Organize() {
  return (
    <div>
      <PageHeader kicker="keeping things tidy" title="Tags & categories" />
      <div className="grid gap-8 xl:grid-cols-[1.2fr_1fr]">
        <Categories />
        <Tags />
      </div>
    </div>
  );
}

/* ---------------- categories ---------------- */

function Categories() {
  const refresh = useRefresh();
  const { data: cats = [], isLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listCategories,
  });
  const [editing, setEditing] = useState<Partial<AdminCategory> | null>(null);
  const [toDelete, setToDelete] = useState<(AdminCategory & { count: number }) | null>(null);

  return (
    <Panel title="Categories">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Categories are the main sections in your menu (Journal, Entomology…). Each post belongs to
        one.
      </p>
      {isLoading && <p className="font-hand text-xl text-muted-foreground">loading…</p>}
      <ul className="space-y-2">
        {cats.map((c) =>
          editing?.id === c.id ? (
            <li key={c.id}>
              <CategoryForm
                initial={editing}
                onCancel={() => setEditing(null)}
                onSaved={() => {
                  setEditing(null);
                  refresh();
                }}
              />
            </li>
          ) : (
            <li
              key={c.id}
              className="flex items-start gap-3 rounded-sm border border-border bg-ivory p-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-xl text-moss">
                  {c.name}{" "}
                  {!c.in_nav && (
                    <span className="ml-1 font-serif text-xs text-muted-foreground">
                      (hidden from menu)
                    </span>
                  )}
                </p>
                <p className="text-sm text-foreground/70">
                  {c.description || <em className="text-muted-foreground">No description</em>}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  /{c.slug} · {c.count} post{c.count === 1 ? "" : "s"}
                  {c.annotation ? ` · note: “${c.annotation}”` : ""}
                </p>
              </div>
              <button
                onClick={() => setEditing(c)}
                className="rounded-full p-2 text-foreground/70 hover:bg-pale hover:text-moss"
                aria-label={`Edit ${c.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => setToDelete(c)}
                className="rounded-full p-2 text-destructive hover:bg-destructive/10"
                aria-label={`Delete ${c.name}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ),
        )}
      </ul>
      {editing && !editing.id ? (
        <div className="mt-3">
          <CategoryForm
            initial={editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              refresh();
            }}
          />
        </div>
      ) : (
        <button
          onClick={() =>
            setEditing({ sort_order: (cats.at(-1)?.sort_order ?? 0) + 1, in_nav: true })
          }
          className={`${btnGhost} mt-4`}
        >
          <Plus className="h-4 w-4" /> New category
        </button>
      )}
      <Confirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete “${toDelete?.name}”?`}
        description={
          toDelete?.count
            ? `${toDelete.count} post${toDelete.count === 1 ? " is" : "s are"} in this category. They won't be deleted, but they'll have no category until you choose a new one — and won't appear in any section.`
            : "This empty category will be removed from your menu."
        }
        onConfirm={async () => {
          try {
            await deleteCategory(toDelete!.id);
            toast.success("Category deleted");
            refresh();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </Panel>
  );
}

function CategoryForm({
  initial,
  onCancel,
  onSaved,
}: {
  initial: Partial<AdminCategory>;
  onCancel: () => void;
  onSaved: () => void;
}) {
  const [c, setC] = useState<Partial<AdminCategory>>(initial);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof AdminCategory, v: any) => setC((x) => ({ ...x, [k]: v }));
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!c.name?.trim()) return;
        setBusy(true);
        try {
          await saveCategory({ ...c, name: c.name! });
          toast.success("Category saved");
          onSaved();
        } catch (err: any) {
          toast.error(
            /duplicate/i.test(err.message)
              ? "That web address is already used by another category"
              : err.message,
          );
        } finally {
          setBusy(false);
        }
      }}
      className="space-y-3 rounded-sm border border-sage bg-pale/40 p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Labeled label="Name">
          <input
            required
            value={c.name ?? ""}
            onChange={(e) => {
              set("name", e.target.value);
              if (!initial.id) set("slug", slugify(e.target.value));
            }}
            className={inputCls}
          />
        </Labeled>
        <Labeled
          label="Web address"
          hint={initial.id ? "Changing this breaks old links." : undefined}
        >
          <input
            value={c.slug ?? ""}
            onChange={(e) => set("slug", e.target.value)}
            className={inputCls}
          />
        </Labeled>
      </div>
      <Labeled
        label="Description"
        hint="Shown at the top of the section page and to search engines."
      >
        <textarea
          value={c.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className={inputCls}
        />
      </Labeled>
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <Labeled label="Handwritten note" hint="A tiny annotation, e.g. “field notes”.">
          <input
            value={c.annotation ?? ""}
            onChange={(e) => set("annotation", e.target.value)}
            className={`${inputCls} font-hand text-xl`}
          />
        </Labeled>
        <Labeled label="Menu order">
          <input
            type="number"
            value={c.sort_order ?? 0}
            onChange={(e) => set("sort_order", Number(e.target.value))}
            className={inputCls}
          />
        </Labeled>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={c.in_nav ?? true}
          onChange={(e) => set("in_nav", e.target.checked)}
          className="accent-[var(--moss)]"
        />{" "}
        Show in the main menu
      </label>
      <div className="flex gap-2">
        <button disabled={busy} className={btnPrimary}>
          Save
        </button>
        <button type="button" onClick={onCancel} className={btnGhost}>
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ---------------- tags ---------------- */

function Tags() {
  const refresh = useRefresh();
  const { data: tags = [], isLoading } = useQuery({
    queryKey: ["admin", "tags"],
    queryFn: listTagsWithCounts,
  });
  const [name, setName] = useState("");
  const [edit, setEdit] = useState<{ id: string; name: string } | null>(null);
  const [toDelete, setToDelete] = useState<{ id: string; name: string; count: number } | null>(
    null,
  );

  return (
    <Panel title="Tags">
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">
        Tags are finer labels (Ikebana, Haiku, Moths…). A post can have many; readers can click a
        tag to see every post with it.
      </p>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (!name.trim()) return;
          try {
            await createTag(name);
            setName("");
            toast.success("Tag created");
            refresh();
          } catch (err: any) {
            toast.error(err.message);
          }
        }}
        className="mb-4 flex gap-2"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New tag name…"
          aria-label="New tag name"
          className={inputCls}
        />
        <button className={btnPrimary}>
          <Plus className="h-4 w-4" /> Add
        </button>
      </form>
      {isLoading && <p className="font-hand text-xl text-muted-foreground">loading…</p>}
      <ul className="divide-y divide-border rounded-sm border border-border bg-ivory">
        {tags.map((t) => (
          <li key={t.id} className="flex items-center gap-2 px-3 py-2">
            {edit?.id === t.id ? (
              <form
                className="flex flex-1 gap-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    await updateTag(t.id, { name: edit.name.trim() });
                    toast.success("Tag renamed");
                    setEdit(null);
                    refresh();
                  } catch (err: any) {
                    toast.error(err.message);
                  }
                }}
              >
                <input
                  autoFocus
                  value={edit.name}
                  onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  aria-label="Tag name"
                  className={`${inputCls} py-1 text-sm`}
                />
                <button className="rounded-full p-1.5 text-moss hover:bg-pale" aria-label="Save">
                  <Check className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setEdit(null)}
                  className="rounded-full p-1.5 hover:bg-pale"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </form>
            ) : (
              <>
                <span className="flex-1 text-sm">
                  <span className="text-sage">#</span>
                  {t.name}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t.count} post{t.count === 1 ? "" : "s"}
                </span>
                <button
                  onClick={() => setEdit({ id: t.id, name: t.name })}
                  className="rounded-full p-1.5 text-foreground/70 hover:bg-pale hover:text-moss"
                  aria-label={`Rename ${t.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setToDelete(t)}
                  className="rounded-full p-1.5 text-destructive hover:bg-destructive/10"
                  aria-label={`Delete ${t.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </li>
        ))}
        {!isLoading && !tags.length && (
          <li className="px-3 py-6 text-center font-hand text-lg text-muted-foreground">
            no tags yet
          </li>
        )}
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        Renaming keeps the tag's web address, so existing links keep working.
      </p>
      <Confirm
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={`Delete #${toDelete?.name}?`}
        description={
          toDelete?.count
            ? `It will be removed from ${toDelete.count} post${toDelete.count === 1 ? "" : "s"}. The posts themselves stay.`
            : "This tag isn't used on any post."
        }
        onConfirm={async () => {
          try {
            await deleteTag(toDelete!.id);
            toast.success("Tag deleted");
            refresh();
          } catch (e: any) {
            toast.error(e.message);
          }
        }}
      />
    </Panel>
  );
}
