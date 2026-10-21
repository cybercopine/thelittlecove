import { Link } from "@tanstack/react-router";

export function TagChip({ slug, name, asLink = true }: { slug: string; name: string; asLink?: boolean }) {
  const cls =
    "inline-flex items-center gap-1 rounded-full border border-sage/70 bg-pale px-2.5 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.12em] text-moss transition-colors";
  if (!asLink) return <span className={cls}>{name}</span>;
  return (
    <Link to="/tag/$slug" params={{ slug }} className={`${cls} hover:bg-sage/50`}>
      <span aria-hidden>#</span>
      {name}
    </Link>
  );
}

export function CategoryLabel({ category, tags }: { category?: { name: string } | null; tags?: { name: string }[] }) {
  const parts = [category?.name, tags?.[0]?.name].filter(Boolean).join(" · ");
  if (!parts) return null;
  return (
    <span className="inline-block rounded-full border border-sage/70 bg-pale px-2.5 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.14em] text-moss">
      {parts}
    </span>
  );
}

export function PlaceholderBadge() {
  return (
    <span className="inline-block rotate-[-2deg] rounded-sm border border-dashed border-stamp/60 px-1.5 py-0.5 font-hand text-sm text-stamp">
      sample placeholder
    </span>
  );
}
