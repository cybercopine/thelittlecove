import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search } from "lucide-react";
import { listQuery } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
  head: () => ({
    meta: [
      { title: "Search — The Little Cove" },
      { name: "description", content: "Search The Little Cove by title, words and tags." },
      { property: "og:title", content: "Search — The Little Cove" },
      { property: "og:description", content: "Search The Little Cove by title, words and tags." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [value, setValue] = useState(q);
  const navigate = useNavigate();
  const { data, isFetching } = useQuery({ ...listQuery({ q }), enabled: q.trim().length > 0 });
  return (
    <div className="pt-10">
      <h1 className="text-center text-5xl text-moss">Search the cove</h1>
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          navigate({ to: "/search", search: { q: value } });
        }}
        className="mx-auto mt-6 flex max-w-xl items-center gap-2 rounded-full border border-border bg-paper px-5 py-3"
      >
        <Search className="h-5 w-5 text-muted-foreground" />
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" value={value} onChange={(e) => setValue(e.target.value)} placeholder="moths, tea, autumn…" className="w-full bg-transparent font-hand text-2xl outline-none" />
        <button className="rounded-full bg-primary px-4 py-1 text-sm text-primary-foreground">Look</button>
      </form>
      {q && (
        <p className="mt-6 text-center font-hand text-xl text-muted-foreground">
          {isFetching ? "turning pages…" : `${data?.length ?? 0} ${data?.length === 1 ? "page" : "pages"} found for “${q}”`}
        </p>
      )}
      <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((p, i) => <PostCard key={p.id} post={p} index={i} />)}
      </div>
    </div>
  );
}
