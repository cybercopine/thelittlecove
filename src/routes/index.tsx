import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { CalendarDays, Plus } from "lucide-react";
import { homeQuery, siteQuery } from "@/lib/queries";
import { PostCard } from "@/components/site/PostCard";
import { Divider, Fern, Sprig } from "@/components/site/Botanicals";
import { fmtDate, stripHtml } from "@/lib/format";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  head: ({ matches }) => ({
    meta: [
      {
        title:
          (matches[0]?.loaderData as any)?.settings?.site?.home_title ||
          "The Little Cove — a quiet scrapbook of slow living",
      },
      {
        name: "description",
        content:
          (matches[0]?.loaderData as any)?.settings?.site?.seo_description ||
          "Hana's personal scrapbook: journal pages, insect field notes, recipes, ikebana and haiku.",
      },
      { property: "og:title", content: "The Little Cove" },
      {
        property: "og:description",
        content: "A quiet corner for slow living, memories & observations.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { data: site } = useSuspenseQuery(siteQuery);
  const { data } = useSuspenseQuery(homeQuery);
  const home = site.settings.home ?? {};
  const lately: { label: string; value: string }[] = site.settings.lately?.items ?? [];
  const paragraphs = String(home.intro_body ?? "").split(/\n\s*\n/);
  const featured = data.featured;
  const stamp = new Date();

  return (
    <div className="relative">
      {/* stamp */}
      <div
        className="pointer-events-none absolute right-2 top-2 z-20 hidden h-24 w-24 rotate-[-8deg] place-items-center rounded-full border border-dashed border-moss/50 bg-ivory/85 text-center text-[0.6rem] uppercase leading-4 tracking-[0.2em] text-moss/80 shadow-[0_0_0_4px_var(--ivory)] lg:grid"
        aria-hidden
      >
        <span>
          The Little
          <br />
          Cove
          <br />
          <span className="font-display text-sm normal-case tracking-normal">
            {stamp.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
          </span>
        </span>
      </div>

      <section className="grid gap-10 pt-12 lg:grid-cols-[1.35fr_1fr] lg:gap-6">
        {/* welcome letter */}
        <div className="relative self-start">
          <span className="tape -top-3 left-14 rotate-[-2deg] bg-oat/80" />
          <div
            className={`paper relative rotate-[-0.4deg] p-7 sm:p-10 ${home.sticky_note ? "pb-16 sm:pb-16" : ""}`}
          >
            <p className="flex items-center gap-2 font-hand text-xl text-muted-foreground">
              <CalendarDays className="h-4 w-4" />{" "}
              {fmtDate(new Date().toISOString(), { month: "long", day: "numeric" })} ·{" "}
              {home.intro_date}
            </p>
            <h1 className="mt-3 text-[2.2rem] leading-tight text-foreground sm:text-[2.6rem]">
              {home.intro_title}
            </h1>
            <div className="mt-5 space-y-4 text-[1.05rem] leading-8 text-foreground/80">
              {paragraphs.map((p, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "first-letter:float-left first-letter:mr-2 first-letter:font-display first-letter:text-6xl first-letter:leading-[0.8] first-letter:text-moss"
                      : ""
                  }
                >
                  {p}
                </p>
              ))}
            </div>
            <p className="mt-6 text-right font-hand text-2xl text-foreground/80">
              {home.signature}
            </p>
          </div>
          {home.sticky_note && (
            <p className="absolute -bottom-6 right-6 z-10 max-w-[16rem] rotate-[2.5deg] bg-note px-5 pb-3 pt-4 font-hand text-xl leading-6 text-foreground/75 shadow-md transition-transform duration-500 hover:rotate-[1deg] sm:right-10">
              <span
                className="tape -top-3 left-1/2 h-5 w-16 -translate-x-1/2 rotate-[-3deg] bg-blush/70"
                aria-hidden
              />
              {home.sticky_note}
            </p>
          )}
        </div>

        {/* polaroid + currently exploring */}
        <div className="relative mx-auto w-full max-w-sm pt-4 lg:pt-24">
          <Fern className="absolute -left-12 top-14 hidden h-20 w-20 -scale-x-100 text-moss/70 lg:block" />
          <figure className="polaroid relative rotate-[3deg] transition-transform duration-500 hover:rotate-[1deg]">
            <span className="tape -top-3 left-1/2 -translate-x-1/2 rotate-[-4deg]" />
            <img
              src={home.polaroid_image || featured?.cover_image_url || "/images/cedar.jpg"}
              alt={
                home.polaroid_image
                  ? home.polaroid_caption || ""
                  : (featured?.cover_image_alt ?? "A quiet garden scene")
              }
              className="aspect-square w-full object-cover"
              width={600}
              height={600}
            />
            <figcaption className="mt-3 text-right font-hand text-xl text-muted-foreground">
              {home.polaroid_caption}
            </figcaption>
          </figure>
          {lately.length > 0 && (
            <aside
              aria-label="Currently exploring"
              className="relative -mt-4 ml-[-1.5rem] w-[92%] rotate-[-3deg] bg-oat p-5 shadow-md transition-transform hover:rotate-[-1.5deg] sm:ml-[-3rem]"
            >
              <span
                className="absolute -top-4 right-8 h-10 w-3 rounded-full border-2 border-muted-foreground/50"
                aria-hidden
              />
              <h2 className="flex items-center gap-2 font-serif text-xs uppercase tracking-[0.25em] text-foreground/80">
                <Plus className="h-3 w-3" /> Currently exploring
              </h2>
              <ul className="mt-2 space-y-1 font-hand text-lg leading-6 text-foreground/80">
                {lately.map((l, i) => (
                  <li key={i}>
                    <span className="text-moss">{l.label}:</span> {l.value}
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </section>

      {/* featured */}
      {featured && (
        <section className="mt-20" aria-labelledby="featured-h">
          <Divider label={home.section_featured || "From the journal"} />
          <Link
            to="/$category/$slug"
            params={{ category: featured.category?.slug ?? "journal", slug: featured.slug }}
            className="paper paper-lift mx-auto mt-8 grid max-w-4xl gap-6 p-6 sm:grid-cols-[1fr_1.3fr] sm:p-8"
          >
            {featured.cover_image_url && (
              <img
                src={featured.cover_image_url}
                alt={featured.cover_image_alt ?? ""}
                loading="lazy"
                className="aspect-[4/3] w-full rotate-[-1deg] object-cover shadow"
              />
            )}
            <div>
              <p className="font-hand text-lg text-muted-foreground">
                featured · {fmtDate(featured.published_at)}
              </p>
              <h3 id="featured-h" className="mt-1 text-3xl leading-tight text-moss">
                {featured.title}
              </h3>
              <p className="mt-3 leading-7 text-foreground/75">
                {featured.excerpt || stripHtml(featured.content_html).slice(0, 220)}
              </p>
              <p className="mt-4 font-hand text-lg text-moss">continue reading →</p>
            </div>
          </Link>
        </section>
      )}

      {/* recent */}
      <section className="mt-20" aria-labelledby="recent-h">
        <Divider label={home.section_recent || "Recent Artifacts & Notebook Leaves"} />
        <h2 id="recent-h" className="sr-only">
          Recent posts
        </h2>
        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {data.recent.map((p, i) => (
            <PostCard key={p.id} post={p} index={i} />
          ))}
        </div>
      </section>

      {/* sections */}
      <section className="mt-20" aria-label="Sections of the cove">
        <Divider label={home.section_chapters || "Chapters of the Cove"} />
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {site.categories
            .filter((c: any) => c.in_nav)
            .map((c: any, i: number) => (
              <Link
                key={c.id}
                to="/$category"
                params={{ category: c.slug }}
                className={`group relative block border border-border bg-pale/60 p-5 paper-lift ${i % 2 ? "rotate-[0.8deg]" : "rotate-[-0.8deg]"}`}
              >
                <span className="absolute right-3 top-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  No. {String(i + 1).padStart(2, "0")}
                </span>
                <Sprig className="h-6 w-6 text-moss" />
                <h3 className="mt-2 text-2xl text-moss">{c.name}</h3>
                <p className="font-hand text-lg text-muted-foreground">{c.annotation}</p>
                <p className="mt-2 text-sm leading-6 text-foreground/70">{c.description}</p>
              </Link>
            ))}
        </div>
      </section>

      {/* dreams + quote */}
      <section className="mt-20 grid gap-8 md:grid-cols-2">
        {home.dreams && (
          <div className="relative bg-note p-7 shadow-sm lined rotate-[-0.6deg]">
            <span className="tape -top-3 left-8 rotate-[-5deg] bg-blush/70" />
            <h2 className="text-2xl text-moss">Little dreams & aspirations</h2>
            <p className="mt-2 font-hand text-xl leading-8">{home.dreams}</p>
          </div>
        )}
        {home.quote && (
          <blockquote className="flex flex-col justify-center text-center">
            <p className="font-display text-3xl italic leading-snug text-moss">{home.quote}</p>
            <footer className="mt-3 font-hand text-lg text-muted-foreground">
              {home.quote_author}
            </footer>
            <Link to="/about" className="mt-6 text-sm text-moss underline underline-offset-4">
              More about me & this little cove →
            </Link>
          </blockquote>
        )}
      </section>
    </div>
  );
}
