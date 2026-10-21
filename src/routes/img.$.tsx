import { createFileRoute } from "@tanstack/react-router";

// Public image delivery: /img/2026/10/moth-1a2b3c4d.webp
// Photos live in the private "media" storage bucket; this route streams them to
// readers with long browser caching, so the bucket itself never needs to be public.
export const Route = createFileRoute("/img/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = String((params as any)._splat ?? "");
        if (!path || path.includes("..") || !/^[\w\-./]+$/.test(path))
          return new Response("Not found", { status: 404 });
        const url = process.env["SUPABASE_URL"]!.replace(/\/+$/, "");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
        const headers: Record<string, string> = { apikey: key };
        if (!key.startsWith("sb_")) headers["Authorization"] = `Bearer ${key}`;
        const encoded = path.split("/").map(encodeURIComponent).join("/");
        const res = await fetch(`${url}/storage/v1/object/authenticated/media/${encoded}`, {
          headers,
        });
        if (!res.ok || !res.body) return new Response("Not found", { status: 404 });
        return new Response(res.body, {
          status: 200,
          headers: {
            "content-type": res.headers.get("content-type") ?? "application/octet-stream",
            "cache-control": "public, max-age=31536000, immutable",
          },
        });
      },
    },
  },
});
