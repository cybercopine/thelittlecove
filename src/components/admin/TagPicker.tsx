import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { AdminTag } from "@/lib/admin-data";
import { inputCls } from "./bits";

/** Choose existing tags or type a new one and press Enter to create it. */
export function TagPicker({
  all,
  value,
  onChange,
  onCreate,
}: {
  all: AdminTag[];
  value: AdminTag[];
  onChange: (tags: AdminTag[]) => void;
  onCreate: (name: string) => Promise<AdminTag>;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const term = text.trim().toLowerCase();
  const chosen = new Set(value.map((t) => t.id));
  const suggestions = all
    .filter((t) => !chosen.has(t.id) && (!term || t.name.toLowerCase().includes(term)))
    .slice(0, 8);
  const exact = all.find((t) => t.name.toLowerCase() === term);

  async function addNew() {
    if (!term) return;
    if (exact) {
      if (!chosen.has(exact.id)) onChange([...value, exact]);
      setText("");
      return;
    }
    setBusy(true);
    try {
      const t = await onCreate(text.trim());
      onChange([...value, t]);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span
            key={t.id}
            className="inline-flex items-center gap-1 rounded-full border border-sage/70 bg-pale py-0.5 pl-2.5 pr-1 text-xs uppercase tracking-[0.1em] text-moss"
          >
            #{t.name}
            <button
              type="button"
              onClick={() => onChange(value.filter((x) => x.id !== t.id))}
              aria-label={`Remove tag ${t.name}`}
              className="rounded-full p-0.5 hover:bg-sage/50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        {!value.length && <span className="text-sm text-muted-foreground">No tags yet</span>}
      </div>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addNew();
          }
        }}
        placeholder="Type a tag and press Enter…"
        aria-label="Add a tag"
        disabled={busy}
        className={`${inputCls} mt-2 text-sm`}
      />
      {(suggestions.length > 0 || (term && !exact)) && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {suggestions.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onChange([...value, t]);
                setText("");
              }}
              className="rounded-full border border-border bg-ivory px-2.5 py-0.5 text-xs text-foreground/75 hover:border-sage hover:bg-pale"
            >
              + {t.name}
            </button>
          ))}
          {term && !exact && (
            <button
              type="button"
              onClick={addNew}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-moss px-2.5 py-0.5 text-xs text-moss hover:bg-pale"
            >
              <Plus className="h-3 w-3" /> Create “{text.trim()}”
            </button>
          )}
        </div>
      )}
    </div>
  );
}
