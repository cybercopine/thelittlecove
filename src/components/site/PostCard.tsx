import { Link } from "@tanstack/react-router";
import type { PublicPost } from "@/lib/cove.functions";
import { readingTime, shortDate, stripHtml } from "@/lib/format";
import { CategoryLabel, PlaceholderBadge } from "./TagChip";
import { Moth } from "./Botanicals";

const tilts = [
  "rotate-[-1deg]",
  "rotate-[0.8deg]",
  "rotate-[-0.5deg]",
  "rotate-[1.2deg]",
  "rotate-[-1.4deg]",
  "rotate-[0.4deg]",
];

function PostLink({
  post,
  className,
  children,
}: {
  post: PublicPost;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      to="/$category/$slug"
      params={{ category: post.category?.slug ?? "journal", slug: post.slug }}
      className={className}
    >
      {children}
    </Link>
  );
}

export function PostCard({ post, index = 0 }: { post: PublicPost; index?: number }) {
  const tilt = tilts[index % tilts.length];
  const f = post.fields ?? {};

  if (post.template === "haiku") {
    const poem = f.japanese || f.english || "";
    return (
      <PostLink post={post} className={`group relative block paper paper-lift ${tilt} p-6 pt-7`}>
        <span className="tape -top-3 right-8 rotate-[4deg] bg-moss/40" />
        <div className="flex items-start justify-between gap-2">
          <CategoryLabel category={post.category} tags={post.tags} />
          <span
            className="jp grid h-8 w-8 shrink-0 place-items-center rotate-[6deg] border border-stamp text-[0.7rem] text-stamp"
            aria-hidden
          >
            小江
          </span>
        </div>
        <p
          className={`mt-5 whitespace-pre-line ${f.japanese ? "jp text-lg leading-9" : "font-display text-xl leading-8"}`}
        >
          {poem}
        </p>
        {f.japanese && f.english && <div className="my-4 dotted-rule" />}
        {f.japanese && f.english && (
          <p className="whitespace-pre-line font-hand text-xl leading-7 text-muted-foreground">
            {f.english}
          </p>
        )}
        {f.poet && <p className="mt-2 font-hand text-base text-muted-foreground">— {f.poet}</p>}
        {post.is_placeholder && (
          <div className="mt-3">
            <PlaceholderBadge />
          </div>
        )}
      </PostLink>
    );
  }

  if (post.template === "field_note") {
    return (
      <PostLink
        post={post}
        className={`group relative block border border-oat bg-ivory p-4 shadow-sm paper-lift ${tilt}`}
      >
        <span
          className="absolute left-1/2 top-2 h-3 w-3 -translate-x-1/2 rounded-full bg-[oklch(0.78_0.12_85)] shadow"
          aria-hidden
        />
        <div className="mt-4 border border-border bg-paper px-4 py-4 text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.2em] text-muted-foreground">
            Specimen plate no. {f.specimen_no || "—"}
          </p>
          <p className="mt-1 font-display text-xl italic text-moss">
            {f.scientific_name || post.title}
          </p>
          {post.cover_image_url ? (
            <img
              src={post.cover_image_url}
              alt={post.cover_image_alt ?? ""}
              loading="lazy"
              className="mx-auto mt-3 h-32 w-full object-contain"
            />
          ) : (
            <Moth className="mx-auto mt-3 h-20 w-40" />
          )}
        </div>
        <p className="mt-3 border-l-2 border-sage bg-pale/60 px-3 py-2 font-hand text-lg leading-6 text-foreground/80">
          “{post.excerpt?.replace("[Sample placeholder] ", "") || f.common_name}”
        </p>
        {post.is_placeholder && (
          <div className="mt-2">
            <PlaceholderBadge />
          </div>
        )}
      </PostLink>
    );
  }

  if (post.template === "paper") {
    return (
      <PostLink
        post={post}
        className={`group relative block border border-oat bg-ivory p-5 shadow-sm paper-lift ${tilt}`}
      >
        <span className="tape -top-3 right-8 h-5 w-16 rotate-[4deg]" />
        <div className="flex items-start justify-between gap-2">
          <CategoryLabel category={post.category} tags={post.tags} />
          <span className="font-hand text-base text-muted-foreground">paper notes</span>
        </div>
        <h3 className="mt-3 font-display text-[1.5rem] leading-tight text-foreground">
          {post.title}
        </h3>
        {(f.journal || f.year) && (
          <p className="mt-2 border-l-2 border-sage pl-3 text-sm text-foreground/70">
            {f.journal && <em>{f.journal}</em>}
            {f.journal && f.year ? " · " : ""}
            {f.year}
          </p>
        )}
        <p className="mt-3 line-clamp-3 text-[0.95rem] leading-7 text-foreground/75">
          {post.excerpt || stripHtml(post.content_html).slice(0, 160)}
        </p>
        <p className="mt-4 border-t border-dotted border-sage pt-3 font-hand text-base text-moss">
          read my notes →
        </p>
        {post.is_placeholder && (
          <div className="mt-2">
            <PlaceholderBadge />
          </div>
        )}
      </PostLink>
    );
  }

  if (post.template === "note") {
    return (
      <PostLink
        post={post}
        className={`group relative block bg-note p-6 shadow-sm paper-lift lined ${tilt}`}
      >
        <span className="tape -top-3 left-6 rotate-[-6deg] bg-blush/70" />
        <p className="font-hand text-sm text-muted-foreground">
          {shortDate(post.published_at)} · a little note
        </p>
        {post.title && <h3 className="mt-1 font-display text-2xl text-moss">{post.title}</h3>}
        <p className="mt-2 font-hand text-xl leading-8">
          {stripHtml(post.content_html).slice(0, 160)}
        </p>
        {post.is_placeholder && (
          <div className="mt-2">
            <PlaceholderBadge />
          </div>
        )}
      </PostLink>
    );
  }

  if (
    (post.template === "ikebana" || post.template === "recipe" || post.template === "food_story") &&
    post.cover_image_url
  ) {
    return (
      <PostLink post={post} className={`group relative block polaroid paper-lift ${tilt}`}>
        <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[-3deg]" />
        <img
          src={post.cover_image_url}
          alt={post.cover_image_alt ?? ""}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
        <div className="mt-3 px-1">
          <CategoryLabel category={post.category} tags={post.tags} />
          <h3 className="mt-2 font-display text-2xl leading-tight text-foreground">{post.title}</h3>
          <p className="mt-1 font-hand text-lg text-muted-foreground">
            {post.template === "recipe" && post.fields?.prep_time
              ? `prep ${post.fields.prep_time} · serves ${post.fields.servings ?? "—"}`
              : shortDate(post.published_at)}
          </p>
          {post.is_placeholder && <PlaceholderBadge />}
        </div>
      </PostLink>
    );
  }

  return (
    <PostLink post={post} className={`group relative block paper paper-lift ${tilt} p-6 pt-8`}>
      <span className="tape -top-3 left-7 rotate-[-3deg]" />
      <CategoryLabel category={post.category} tags={post.tags} />
      <h3 className="mt-3 font-display text-[1.6rem] leading-tight text-foreground">
        {post.title}
      </h3>
      <p className="mt-3 line-clamp-3 text-[0.98rem] leading-7 text-foreground/75">
        {post.excerpt || stripHtml(post.content_html).slice(0, 180)}
      </p>
      <div className="mt-5 flex items-center justify-between border-t border-dotted border-sage pt-3 font-hand text-base text-muted-foreground">
        <span>
          {shortDate(post.published_at)} · {readingTime(post.content_html)} min read
        </span>
        <span className="text-moss transition-transform group-hover:translate-x-1">
          read entry →
        </span>
      </div>
      {post.is_placeholder && (
        <div className="mt-2">
          <PlaceholderBadge />
        </div>
      )}
    </PostLink>
  );
}
