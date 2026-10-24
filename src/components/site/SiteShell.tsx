import { Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Menu, Search, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { siteQuery } from "@/lib/queries";
import { Leaf } from "./Botanicals";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen px-2 py-3 sm:px-6 sm:py-6">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:p-2">
        Skip to content
      </a>
      <div className="book mx-auto max-w-6xl rounded-sm px-4 pb-6 sm:px-10">
        <Header />
        <main id="main" className="min-h-[50vh]">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}

function Header() {
  const { data } = useSuspenseQuery(siteQuery);
  const nav = data.categories.filter((c: any) => c.in_nav);
  const [open, setOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);

  const linkCls = "px-1 py-1 text-[1.02rem] text-foreground/80 transition-colors hover:text-moss";
  const active = { className: "text-moss border-b border-moss" };

  return (
    <header className="sticky top-0 z-30 -mx-4 bg-ivory/90 px-4 pt-5 pb-4 backdrop-blur-sm sm:-mx-10 sm:px-10 sm:pt-8">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/" className="group flex min-w-0 items-center gap-3" aria-label="The Little Cove — home">
          <Leaf className="h-7 w-7 shrink-0 text-moss transition-transform duration-500 group-hover:rotate-[-12deg] sm:h-8 sm:w-8" />
          <div className="min-w-0">
            <div className="truncate font-display text-3xl leading-none text-moss sm:text-[2.6rem]">The Little Cove</div>
            <div className="mt-1 hidden truncate font-hand text-lg text-muted-foreground sm:block">{data.settings.site?.tagline}</div>
          </div>
        </Link>
        <div className="flex items-center gap-1">
          <nav aria-label="Main" className="hidden items-center gap-5 rounded-full border border-border bg-paper px-6 py-2 shadow-sm lg:flex">
            {nav.map((c: any) => (
              <Link key={c.id} to="/$category" params={{ category: c.slug }} className={linkCls} activeProps={active}>
                {c.name}
              </Link>
            ))}
            <button onClick={() => setSearching((s) => !s)} aria-label="Search" className="rounded-full p-1 text-foreground/70 hover:text-moss">
              <Search className="h-4 w-4" />
            </button>
          </nav>
          <button onClick={() => setSearching((s) => !s)} aria-label="Search" className="rounded-full p-2 text-moss lg:hidden">
            <Search className="h-5 w-5" />
          </button>
          <button onClick={() => setOpen((o) => !o)} aria-label="Menu" aria-expanded={open} className="rounded-full p-2 text-moss lg:hidden">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>
      {open && (
        <nav aria-label="Mobile" className="mt-4 flex flex-col gap-1 border-t border-border pt-3 lg:hidden">
          {nav.map((c: any) => (
            <Link key={c.id} to="/$category" params={{ category: c.slug }} onClick={() => setOpen(false)} className="py-2 font-display text-xl text-moss">
              {c.name}
            </Link>
          ))}
          <Link to="/about" onClick={() => setOpen(false)} className="py-2 font-display text-xl text-moss">About</Link>
          <Link to="/archive" onClick={() => setOpen(false)} className="py-2 font-display text-xl text-moss">Archive</Link>
        </nav>
      )}
      {searching && (
        <form
          role="search"
          className="mx-auto mt-4 flex max-w-xl items-center gap-2 rounded-full border border-border bg-paper px-4 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearching(false);
            navigate({ to: "/search", search: { q } });
          }}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <label htmlFor="site-search" className="sr-only">Search the cove</label>
          <input
            id="site-search"
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="search titles, words, tags…"
            className="w-full bg-transparent font-hand text-xl outline-none placeholder:text-muted-foreground/70"
          />
        </form>
      )}
      <div className="mt-4 h-px bg-border" />
    </header>
  );
}

function Footer() {
  const { data } = useSuspenseQuery(siteQuery);
  return (
    <footer className="mt-16 flex flex-col gap-3 border-t border-border pt-6 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="flex items-center gap-2 font-hand text-lg text-muted-foreground">
        <Leaf className="h-4 w-4 text-moss" />
        {data.settings.site?.footer_note}
      </p>
      <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-1 text-muted-foreground">
        <a href="#main" className="hover:text-moss">Back to top ↑</a>
        <Link to="/about" className="hover:text-moss">About Hana</Link>
        <Link to="/archive" className="hover:text-moss">Archive</Link>
        
      </nav>
    </footer>
  );
}
