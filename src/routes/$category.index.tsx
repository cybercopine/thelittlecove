import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { listQuery, siteQuery } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { Fern, Sprig } from "@/components/site/Botanicals";
import { TagChip } from "@/components/site/TagChip";

export const Route = createFileRoute("/$category/")({
  loader: async ({ context, params }) => {
    const site = await context.queryClient.ensureQueryData(siteQuery);
    const cat = site.categories.find((c: any) => c.slug === params.category);
    if (!cat) throw notFound();
    await context.queryClient.ensureQueryData(listQuery({ category: params.category }));
    return { name: cat.name as string, description: (cat.description ?? "") as string };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.name ?? "Section"} — The Little Cove` },
      { name: "description", content: loaderData?.description ?? "" },
      { property: "og:title", content: `${loaderData?.name ?? "Section"} — The Little Cove` },
      { property: "og:description", content: loaderData?.description ?? "" },
    ],
  }),
  component: CategoryPage,
});

function CategoryPage() {
  const { category } = Route.useParams();
  const { data: site } = useSuspenseQuery(siteQuery);
  const { data: posts } = useSuspenseQuery(listQuery({ category }));
  const cat = site.categories.find((c: any) => c.slug === category)!;
  const tags = new Map<string, { slug: string; name: string }>();
  posts.forEach((p) => p.tags.forEach((t) => tags.set(t.slug, t)));

  return (
    <div className="pt-10">
      <header className="relative mx-auto max-w-2xl text-center">
        <Fern className="absolute -left-4 top-0 hidden h-16 w-16 text-sage sm:block" />
        <p className="font-hand text-xl text-muted-foreground">{cat.annotation}</p>
        <h1 className="text-5xl text-moss sm:text-6xl">{cat.name}</h1>
        <p className="mt-3 leading-7 text-foreground/75">{cat.description}</p>
        {tags.size > 0 && (
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[...tags.values()].map((t) => (
              <TagChip key={t.slug} slug={t.slug} name={t.name} />
            ))}
          </div>
        )}
      </header>
      {posts.length === 0 ? (
        <p className="mt-16 text-center font-hand text-2xl text-muted-foreground">
          <Sprig className="mx-auto mb-2 h-6 w-6 text-moss" />
          no pages here yet — soon.
        </p>
      ) : (
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
