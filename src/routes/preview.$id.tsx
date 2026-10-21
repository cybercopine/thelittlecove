import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getAdminPost } from "@/lib/admin-data";
import type { PublicPost } from "@/lib/cove.functions";
import { PostView, Breadcrumbs } from "@/components/post/PostView";

// Private preview of any post (drafts included). Only the signed-in owner can load
// a draft from the database; with ?live=1 it mirrors the editor as you type.
export const Route = createFileRoute("/preview/$id")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    live: s.live === 1 || s.live === "1" ? 1 : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Preview — The Little Cove" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Preview,
});

function readLive(id: string): PublicPost | null {
  try {
    const raw = localStorage.getItem(`cove-preview:${id}`);
    return raw ? (JSON.parse(raw) as PublicPost) : null;
  } catch {
    return null;
  }
}

function Preview() {
  const { id } = Route.useParams();
  const { live } = Route.useSearch();
  const [livePost, setLivePost] = useState<PublicPost | null>(() => (live ? readLive(id) : null));
  const { data: stored, isLoading } = useQuery({
    queryKey: ["admin", "post", id, "preview"],
    queryFn: () => getAdminPost(id),
    enabled: !livePost,
  });

  useEffect(() => {
    if (!live) return;
    const h = (e: StorageEvent) => {
      if (e.key === `cove-preview:${id}`) setLivePost(readLive(id));
    };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [id, live]);

  const post = livePost ?? (stored as unknown as PublicPost | null);
  if (!post)
    return (
      <p className="py-24 text-center font-hand text-2xl text-muted-foreground">
        {isLoading ? "turning pages…" : "Sign in to preview this page."}
      </p>
    );

  return (
    <div>
      <div className="no-print mt-4 rounded-sm border border-dashed border-stamp/60 bg-note px-4 py-2 text-center font-hand text-lg text-stamp">
        preview — only you can see this page
      </div>
      <Breadcrumbs post={post} />
      <PostView
        post={{
          ...post,
          fields: post.fields ?? {},
          gallery: post.gallery ?? [],
          tags: post.tags ?? [],
        }}
      />
    </div>
  );
}
