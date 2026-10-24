import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { createPost, listCategories } from "@/lib/admin-data";
import { TEMPLATES, type TemplateDef } from "@/lib/templates";
import { PageHeader } from "@/components/admin/bits";

export const Route = createFileRoute("/admin/new")({
  component: NewPost,
});

function NewPost() {
  const navigate = useNavigate();
  const { data: categories = [] } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: listCategories,
  });
  const [busy, setBusy] = useState<string | null>(null);

  async function choose(t: TemplateDef) {
    setBusy(t.id);
    try {
      const cat = categories.find((c) => c.slug === t.defaultCategory) ?? categories[0];
      const id = await createPost({ template: t.id, category_id: cat?.id ?? null });
      navigate({ to: "/admin/posts/$id", params: { id } });
    } catch (e: any) {
      toast.error(e.message ?? "Couldn't start a new post");
      setBusy(null);
    }
  }

  return (
    <div>
      <PageHeader kicker="a fresh page" title="Choose a template" />
      <p className="-mt-4 mb-8 max-w-2xl text-muted-foreground">
        Pick the shape of your post. You can still add any extra text, photos or quotes inside, and
        switch templates later from the editor.
      </p>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TEMPLATES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => choose(t)}
            disabled={!!busy}
            className={`paper paper-lift group relative p-5 text-left disabled:opacity-60 ${i % 2 ? "rotate-[0.4deg]" : "rotate-[-0.4deg]"}`}
          >
            <span className="tape -top-3 left-6 h-5 w-16 rotate-[-4deg]" />
            <Thumb id={t.id} />
            <p className="mt-4 text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Template {t.letter}
            </p>
            <h2 className="font-display text-2xl text-moss">{t.label}</h2>
            <p className="mt-1 text-sm leading-6 text-foreground/70">{t.description}</p>
            {busy === t.id && (
              <p className="mt-2 font-hand text-lg text-moss">opening a fresh page…</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Tiny sketches of each layout, so the choice is visual. */
function Thumb({ id }: { id: string }) {
  const line = (w: string, extra = "") => (
    <div className={`h-1.5 rounded-full bg-oat ${extra}`} style={{ width: w }} />
  );
  const box = "h-28 overflow-hidden rounded-sm border border-border bg-ivory p-3";
  switch (id) {
    case "note":
      return (
        <div className={`${box} grid place-items-center`}>
          <div className="lined w-3/4 rotate-[-2deg] bg-note p-2 shadow-sm">
            <div className="space-y-2">
              {line("70%")}
              {line("90%")}
              {line("50%")}
            </div>
          </div>
        </div>
      );
    case "field_note":
      return (
        <div className={`${box} grid grid-cols-[1fr_1.2fr] gap-2`}>
          <div className="bg-paper p-1 shadow-sm">
            <div className="h-full bg-pale" />
          </div>
          <div className="space-y-1.5 pt-1">
            {line("80%", "bg-moss/50")}
            {line("60%")}
            <div className="my-1 border-t border-dashed border-sage" />
            {line("90%")}
            {line("70%")}
          </div>
        </div>
      );
    case "recipe":
      return (
        <div className={`${box} grid grid-cols-2 gap-2`}>
          <div className="space-y-1.5">
            <div className="h-8 bg-pale" />
            <div className="flex gap-1">
              <div className="h-3 flex-1 border border-dashed border-sage" />
              <div className="h-3 flex-1 border border-dashed border-sage" />
              <div className="h-3 flex-1 border border-dashed border-sage" />
            </div>
            {line("80%")}
            {line("70%")}
          </div>
          <div className="space-y-1.5">
            {line("40%", "bg-moss/50")}
            {line("90%")}
            {line("85%")}
            {line("90%")}
            {line("60%")}
          </div>
        </div>
      );
    case "food_story":
      return (
        <div className={box}>
          <div className="mx-auto mb-2 h-10 w-2/3 bg-pale shadow-sm" />
          <div className="space-y-1.5">
            {line("90%")}
            {line("95%")}
            {line("70%")}
          </div>
        </div>
      );
    case "ikebana":
      return (
        <div className={`${box} grid grid-cols-3 gap-1.5`}>
          <div className="col-span-2 row-span-2 bg-pale" />
          <div className="bg-sage/40" />
          <div className="bg-sage/40" />
        </div>
      );
    case "paper":
      return (
        <div className={box}>
          <div className="mb-2 border border-oat bg-paper p-1.5 shadow-sm">
            <div className="space-y-1">
              {line("85%", "bg-moss/50")}
              {line("55%")}
            </div>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-1">
              <span className="h-1.5 w-2 rounded-full bg-sage" />
              {line("80%")}
            </div>
            <div className="flex gap-1">
              <span className="h-1.5 w-2 rounded-full bg-sage" />
              {line("65%")}
            </div>
          </div>
        </div>
      );
    case "haiku":
      return (
        <div className={`${box} grid place-items-center`}>
          <div className="flex flex-col items-center gap-2">
            {line("3rem")}
            {line("4.5rem")}
            {line("2.5rem")}
            <div className="mt-1 h-px w-10 bg-sage" />
            {line("4rem", "bg-moss/30")}
          </div>
        </div>
      );
    default:
      return (
        <div className={box}>
          <div className="mx-auto mb-2 h-2 w-1/2 rounded-full bg-moss/50" />
          <div className="space-y-1.5">
            {line("95%")}
            {line("90%")}
            <div className="my-1 border-l-2 border-sage pl-2">{line("70%")}</div>
            {line("85%")}
          </div>
        </div>
      );
  }
}
