import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { archiveQuery } from "@/lib/queries";
import { Divider } from "@/components/site/Botanicals";

export const Route = createFileRoute("/archive")({
  loader: ({ context }) => context.queryClient.ensureQueryData(archiveQuery),
  head: () => ({
    meta: [
      { title: "Archive — The Little Cove" },
      { name: "description", content: "Every page of The Little Cove, gathered by year and month." },
      { property: "og:title", content: "Archive — The Little Cove" },
      { property: "og:description", content: "Every page, gathered by year and month." },
    ],
  }),
  component: Archive,
});

function Archive() {
  const { data } = useSuspenseQuery(archiveQuery);
  const groups = new Map<string, Map<string, any[]>>();
  for (const p of data as any[]) {
    const d = new Date(p.published_at);
    const y = String(d.getUTCFullYear());
    const m = d.toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });
    if (!groups.has(y)) groups.set(y, new Map());
    const ym = groups.get(y)!;
    if (!ym.has(m)) ym.set(m, []);
    ym.get(m)!.push(p);
  }
  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="text-center text-5xl text-moss">The Archive</h1>
      <p className="text-center font-hand text-xl text-muted-foreground">every leaf, pressed in order</p>
      {[...groups.entries()].map(([year, months]) => (
        <section key={year} className="mt-12">
          <Divider label={year} />
          {[...months.entries()].map(([month, posts]) => (
            <div key={month} className="mt-6 grid gap-2 sm:grid-cols-[140px_1fr]">
              <h3 className="font-hand text-2xl text-muted-foreground">{month}</h3>
              <ul className="space-y-2">
                {posts.map((p) => (
                  <li key={p.id} className="flex items-baseline gap-3 border-b border-dotted border-sage pb-2">
                    <span className="w-8 shrink-0 font-display text-lg text-sage">{new Date(p.published_at).getUTCDate()}</span>
                    <Link to="/$category/$slug" params={{ category: p.category?.slug ?? "journal", slug: p.slug }} className="min-w-0 flex-1 truncate font-display text-xl hover:text-moss">
                      {p.title || "a little note"}
                    </Link>
                    <span className="shrink-0 text-xs uppercase tracking-widest text-muted-foreground">{p.category?.name}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
