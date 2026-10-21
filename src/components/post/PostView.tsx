import { Link } from "@tanstack/react-router";
import { Printer } from "lucide-react";
import type { PublicPost } from "@/lib/cove.functions";
import { fmtDate, readingTime } from "@/lib/format";
import { TagChip, PlaceholderBadge } from "@/components/site/TagChip";
import { Divider, Moth } from "@/components/site/Botanicals";

function Body({ html }: { html: string }) {
  if (!html) return null;
  return <div className="prose-cove" dangerouslySetInnerHTML={{ __html: html }} />;
}

function DateStamp({ date, extra }: { date: string | null; extra?: string }) {
  return (
    <p className="font-hand text-xl text-muted-foreground">
      {fmtDate(date)}
      {extra ? ` · ${extra}` : ""}
    </p>
  );
}

function Tags({ post }: { post: PublicPost }) {
  if (!post.tags.length) return null;
  return (
    <div className="mt-10 flex flex-wrap gap-2">
      {post.tags.map((t) => (
        <TagChip key={t.id} slug={t.slug} name={t.name} />
      ))}
    </div>
  );
}

function Gallery({ items, large }: { items: PublicPost["gallery"]; large?: boolean }) {
  if (!items?.length) return null;
  return (
    <div className={`mt-10 grid gap-6 ${large ? "sm:grid-cols-2" : "grid-cols-2 sm:grid-cols-3"}`}>
      {items.map((g, i) => (
        <figure key={i} className={`polaroid ${i % 2 ? "rotate-[1deg]" : "rotate-[-1deg]"}`}>
          <img src={g.url} alt={g.alt ?? g.caption ?? ""} loading="lazy" className="aspect-[4/5] w-full object-cover" />
          {g.caption && <figcaption className="mt-2 text-center font-hand text-lg text-muted-foreground">{g.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

function Header({ post, kicker }: { post: PublicPost; kicker?: string }) {
  return (
    <header className="text-center">
      {post.is_placeholder && <PlaceholderBadge />}
      <DateStamp date={post.published_at} extra={kicker ?? `${readingTime(post.content_html)} min read`} />
      <h1 className="mx-auto mt-2 max-w-3xl text-4xl leading-[1.1] text-moss sm:text-6xl">{post.title}</h1>
      {post.subtitle && <p className="mx-auto mt-3 max-w-2xl font-display text-xl italic text-muted-foreground sm:text-2xl">{post.subtitle}</p>}
    </header>
  );
}

export function PostView({ post }: { post: PublicPost }) {
  const f = post.fields ?? {};
  switch (post.template) {
    case "note":
      return (
        <article className="mx-auto max-w-xl py-10">
          <div className="relative rotate-[-0.6deg] bg-note p-8 shadow-md lined sm:p-12">
            <span className="tape -top-3 left-10 rotate-[-6deg] bg-blush/70" />
            {post.is_placeholder && <PlaceholderBadge />}
            <p className="font-hand text-lg text-muted-foreground">{fmtDate(post.published_at)}</p>
            {post.title && <h1 className="mt-1 text-4xl text-moss">{post.title}</h1>}
            <div className="mt-4 font-hand text-2xl leading-8 [&_p+p]:mt-4 [&_a]:underline" dangerouslySetInnerHTML={{ __html: post.content_html }} />
          </div>
          <Tags post={post} />
        </article>
      );

    case "field_note":
      return (
        <article className="mx-auto max-w-4xl py-10">
          <div className="paper relative p-6 sm:p-10">
            <span className="tape -top-3 left-12 rotate-[-4deg]" />
            {post.is_placeholder && <PlaceholderBadge />}
            <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Field notebook · plate no. {f.specimen_no || "—"}</p>
            <h1 className="mt-2 text-4xl text-moss sm:text-5xl">{f.common_name || post.title}</h1>
            {f.scientific_name && <p className="mt-1 font-display text-2xl italic text-foreground/80">{f.scientific_name}</p>}
            <dl className="mt-6 grid grid-cols-2 gap-4 border-y border-dashed border-sage py-4 font-hand text-lg sm:grid-cols-3">
              <div><dt className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Observed</dt><dd>{fmtDate(f.observed_on) || "—"}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Location</dt><dd>{f.location || "—"}</dd></div>
              <div><dt className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Entry</dt><dd>{fmtDate(post.published_at)}</dd></div>
            </dl>
            <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_1fr]">
              <figure className="polaroid rotate-[-1deg] self-start">
                {post.cover_image_url ? (
                  <img src={post.cover_image_url} alt={post.cover_image_alt ?? ""} className="w-full object-cover" />
                ) : (
                  <Moth className="mx-auto h-40 w-full" />
                )}
                {post.cover_image_alt && <figcaption className="mt-2 text-center font-hand text-lg text-muted-foreground">{post.cover_image_alt}</figcaption>}
              </figure>
              <Body html={post.content_html} />
            </div>
            <Gallery items={post.gallery} />
            {Array.isArray(f.references) && f.references.length > 0 && (
              <section className="mt-10 border-t border-border pt-5">
                <h2 className="text-2xl text-moss">References</h2>
                <ol className="mt-3 list-decimal space-y-1 pl-5 text-[0.95rem]">
                  {f.references.map((r: any, i: number) => (
                    <li key={i}>
                      {r.url ? <a href={r.url} target="_blank" rel="noreferrer" className="text-moss underline underline-offset-2">{r.label || r.url}</a> : r.label}
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>
          <Tags post={post} />
        </article>
      );

    case "recipe":
      return (
        <article className="mx-auto max-w-4xl py-10">
          <Header post={post} kicker="a recipe card" />
          <div className="paper relative mt-10 grid gap-8 p-6 sm:p-10 md:grid-cols-[1fr_1.2fr]">
            <span className="tape -top-3 right-14 rotate-[5deg]" />
            <div>
              {post.cover_image_url && (
                <img src={post.cover_image_url} alt={post.cover_image_alt ?? ""} className="polaroid mb-6 w-full rotate-[-1.5deg] object-cover" />
              )}
              <dl className="grid grid-cols-3 gap-2 text-center">
                {[["Prep", f.prep_time], ["Cook", f.cook_time], ["Serves", f.servings]].map(([k, v]) => (
                  <div key={k} className="border border-dashed border-sage bg-pale/50 py-2">
                    <dt className="text-[0.68rem] uppercase tracking-widest text-muted-foreground">{k}</dt>
                    <dd className="font-hand text-xl">{v || "—"}</dd>
                  </div>
                ))}
              </dl>
              {Array.isArray(f.ingredients) && f.ingredients.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-2xl text-moss">Ingredients</h2>
                  <ul className="mt-2 space-y-1.5">
                    {f.ingredients.map((x: string, i: number) => (
                      <li key={i} className="flex gap-2 border-b border-dotted border-sage pb-1"><span className="text-sage">✿</span>{x}</li>
                    ))}
                  </ul>
                </section>
              )}
            </div>
            <div>
              <Body html={post.content_html} />
              {Array.isArray(f.steps) && f.steps.length > 0 && (
                <section className="mt-6">
                  <h2 className="text-2xl text-moss">Method</h2>
                  <ol className="mt-3 space-y-4">
                    {f.steps.map((s: string, i: number) => (
                      <li key={i} className="grid grid-cols-[2rem_1fr] gap-2 leading-7">
                        <span className="font-display text-2xl text-sage">{i + 1}.</span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
              {f.notes && (
                <aside className="mt-8 rotate-[0.6deg] bg-note p-4 font-hand text-xl leading-7 shadow-sm">
                  <span className="text-sm uppercase tracking-widest text-muted-foreground font-serif">notes · </span>
                  {f.notes}
                </aside>
              )}
              <button onClick={() => window.print()} className="no-print mt-6 inline-flex items-center gap-2 text-sm text-moss underline underline-offset-4">
                <Printer className="h-4 w-4" /> Print this recipe
              </button>
            </div>
          </div>
          <Gallery items={post.gallery} />
          <Tags post={post} />
        </article>
      );

    case "ikebana":
      return (
        <article className="mx-auto max-w-5xl py-10">
          <Header post={post} kicker={f.arranged_on ? `arranged ${fmtDate(f.arranged_on)}` : "ikebana"} />
          {f.arrangement_title && <p className="mt-2 text-center font-hand text-2xl text-muted-foreground">“{f.arrangement_title}”</p>}
          {post.cover_image_url && (
            <figure className="mx-auto mt-10 max-w-2xl">
              <img src={post.cover_image_url} alt={post.cover_image_alt ?? ""} className="w-full object-cover shadow-lg" />
              {post.cover_image_alt && <figcaption className="mt-3 text-center font-hand text-lg text-muted-foreground">{post.cover_image_alt}</figcaption>}
            </figure>
          )}
          <div className="mx-auto mt-12 grid max-w-3xl gap-10 md:grid-cols-[200px_1fr]">
            {Array.isArray(f.materials) && f.materials.length > 0 && (
              <aside className="self-start border-l-2 border-sage pl-4">
                <h2 className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Materials</h2>
                <ul className="mt-2 space-y-1 font-hand text-xl">{f.materials.map((m: string, i: number) => <li key={i}>{m}</li>)}</ul>
              </aside>
            )}
            <Body html={post.content_html} />
          </div>
          <Gallery items={post.gallery.filter((g) => g.url !== post.cover_image_url)} large />
          <div className="mx-auto max-w-3xl"><Tags post={post} /></div>
        </article>
      );

    case "haiku":
      return (
        <article className="mx-auto max-w-2xl py-16 text-center">
          {post.is_placeholder && <PlaceholderBadge />}
          <p className="font-hand text-lg text-muted-foreground">{fmtDate(post.published_at)}</p>
          <h1 className="mt-1 text-3xl text-moss">{post.title}</h1>
          <div className="paper relative mx-auto mt-10 px-6 py-14 sm:px-16">
            <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[2deg]" />
            {f.japanese && <p lang="ja" className="jp whitespace-pre-line text-2xl leading-[2.4] tracking-[0.12em] sm:text-3xl">{f.japanese}</p>}
            {f.romaji && <p className="mt-8 whitespace-pre-line font-display text-lg italic leading-8 text-muted-foreground">{f.romaji}</p>}
            {f.english && (
              <>
                {(f.japanese || f.romaji) && <Divider className="my-8" />}
                <p className="whitespace-pre-line font-display text-2xl leading-10">{f.english}</p>
              </>
            )}
            {f.poet && <p className="mt-6 font-hand text-xl text-muted-foreground">— {f.poet}</p>}
          </div>
          {post.cover_image_url && <img src={post.cover_image_url} alt={post.cover_image_alt ?? ""} className="mx-auto mt-10 max-h-64 opacity-90" />}
          <div className="mx-auto mt-10 max-w-lg text-left"><Body html={post.content_html} /></div>
          <div className="flex justify-center"><Tags post={post} /></div>
        </article>
      );

    case "food_story":
    case "journal":
    default:
      return (
        <article className="mx-auto max-w-3xl py-10">
          <Header post={post} kicker={f.location ? `${f.location} · ${readingTime(post.content_html)} min read` : undefined} />
          {post.cover_image_url && (
            <figure className="polaroid mx-auto mt-10 max-w-2xl rotate-[-0.8deg]">
              <img src={post.cover_image_url} alt={post.cover_image_alt ?? ""} className="w-full object-cover" />
              {post.cover_image_alt && <figcaption className="mt-2 text-center font-hand text-lg text-muted-foreground">{post.cover_image_alt}</figcaption>}
            </figure>
          )}
          <div className="paper mt-10 p-6 sm:p-12">
            <Body html={post.content_html} />
          </div>
          <Gallery items={post.gallery} />
          <Tags post={post} />
        </article>
      );
  }
}

export function Breadcrumbs({ post }: { post: PublicPost }) {
  return (
    <nav aria-label="Breadcrumb" className="pt-6 text-sm text-muted-foreground">
      <Link to="/" className="hover:text-moss">The Little Cove</Link>
      <span className="mx-2">›</span>
      {post.category && (
        <>
          <Link to="/$category" params={{ category: post.category.slug }} className="hover:text-moss">{post.category.name}</Link>
          <span className="mx-2">›</span>
        </>
      )}
      <span className="text-foreground/70">{post.title || "Note"}</span>
    </nav>
  );
}
