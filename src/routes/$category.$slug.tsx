import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { postQuery } from "@/lib/queries";
import { PostView, Breadcrumbs } from "@/components/post/PostView";
import { PostCard } from "@/components/site/PostCard";
import { Divider } from "@/components/site/Botanicals";
import { stripHtml } from "@/lib/format";

export const Route = createFileRoute("/$category/$slug")({
  loader: async ({ context, params }) => {
    const res = await context.queryClient.ensureQueryData(postQuery(params.category, params.slug));
    if (!res) throw notFound();
    if (res.wrongCategory && res.post.category)
      throw redirect({ to: "/$category/$slug", params: { category: res.post.category.slug, slug: res.post.slug } });
    const p = res.post;
    return {
      title: p.title || "A little note",
      description: p.seo_description || p.excerpt || stripHtml(p.content_html).slice(0, 155),
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.title} — The Little Cove` },
          { name: "description", content: loaderData.description },
          { property: "og:title", content: loaderData.title },
          { property: "og:description", content: loaderData.description },
          { property: "og:type", content: "article" },
        ]
      : [{ title: "Unavailable — The Little Cove" }, { name: "robots", content: "noindex" }],
  }),
  component: PostPage,
});

function PostPage() {
  const { category, slug } = Route.useParams();
  const { data } = useSuspenseQuery(postQuery(category, slug));
  if (!data) return null;
  return (
    <div>
      <Breadcrumbs post={data.post} />
      <PostView post={data.post} />
      {data.related.length > 0 && (
        <section className="mt-12" aria-label="Related pages">
          <Divider label="You might also like" />
          <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {data.related.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
