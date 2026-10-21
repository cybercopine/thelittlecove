import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { allTagsQuery, listQuery, tagQuery } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { TagChip } from "@/components/site/TagChip";

export const Route = createFileRoute("/tag/$slug")({
  loader: async ({ context, params }) => {
    const tag = await context.queryClient.ensureQueryData(tagQuery(params.slug));
    if (!tag) throw notFound();
    await Promise.all([
      context.queryClient.ensureQueryData(listQuery({ tag: params.slug })),
      context.queryClient.ensureQueryData(allTagsQuery),
    ]);
    return { name: tag.name };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `#${loaderData?.name ?? "tag"} — The Little Cove` },
      { name: "description", content: `All pages tagged ${loaderData?.name ?? ""} in The Little Cove.` },
      { property: "og:title", content: `#${loaderData?.name ?? "tag"} — The Little Cove` },
      { property: "og:description", content: `All pages tagged ${loaderData?.name ?? ""}.` },
    ],
  }),
  component: TagPage,
});

function TagPage() {
  const { slug } = Route.useParams();
  const { data: tag } = useSuspenseQuery(tagQuery(slug));
  const { data: posts } = useSuspenseQuery(listQuery({ tag: slug }));
  const { data: tags } = useSuspenseQuery(allTagsQuery);
  return (
    <div className="pt-10">
      <header className="text-center">
        <p className="font-hand text-xl text-muted-foreground">pages tagged</p>
        <h1 className="text-5xl text-moss">#{tag?.name}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "page" : "pages"}</p>
      </header>
      <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p, i) => (
          <PostCard key={p.id} post={p} index={i} />
        ))}
      </div>
      <div className="mt-16 text-center">
        <p className="font-hand text-lg text-muted-foreground">wander to another tag</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {tags.filter((t) => t.slug !== slug).map((t) => (
            <TagChip key={t.id} slug={t.slug} name={t.name} />
          ))}
        </div>
        <Link to="/archive" className="mt-6 inline-block text-sm text-moss underline underline-offset-4">or browse the full archive</Link>
      </div>
    </div>
  );
}
