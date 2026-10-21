import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { siteQuery } from "@/lib/queries";
import { Fern } from "@/components/site/Botanicals";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — The Little Cove" },
      { name: "description", content: "About Hana and The Little Cove, a personal scrapbook on the web." },
      { property: "og:title", content: "About — The Little Cove" },
      { property: "og:description", content: "About Hana and this little corner of the internet." },
    ],
  }),
  component: About,
});

function About() {
  const { data } = useSuspenseQuery(siteQuery);
  const about = data.settings.about ?? {};
  return (
    <article className="mx-auto max-w-3xl py-12">
      <div className="paper relative p-8 sm:p-14">
        <span className="tape -top-3 left-12 rotate-[-3deg]" />
        <Fern className="absolute right-6 top-6 h-14 w-14 text-sage" />
        <p className="font-hand text-xl text-muted-foreground">hello, and welcome</p>
        <h1 className="mt-1 text-5xl text-moss">{about.title}</h1>
        <div className="prose-cove mt-8" dangerouslySetInnerHTML={{ __html: about.body ?? "" }} />
      </div>
    </article>
  );
}
