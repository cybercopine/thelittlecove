import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LogOut,
  Menu,
  PenLine,
  Settings,
  Tags,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getAdminState } from "@/lib/admin-data";
import { Leaf } from "@/components/site/Botanicals";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — The Little Cove" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Posts", icon: FileText, exact: true },
  { to: "/admin/new", label: "New post", icon: PenLine },
  { to: "/admin/media", label: "Media library", icon: ImageIcon },
  { to: "/admin/organize", label: "Tags & categories", icon: Tags },
  { to: "/admin/settings", label: "Blog settings", icon: Settings },
  { to: "/admin/guide", label: "Help guide", icon: BookOpen },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const {
    data: me,
    isLoading,
    refetch,
  } = useQuery({ queryKey: ["admin", "me"], queryFn: getAdminState, staleTime: 60_000 });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange(() => refetch());
    return () => data.subscription.unsubscribe();
  }, [refetch]);

  useEffect(() => {
    if (!isLoading && me && !me.userId) navigate({ to: "/auth" });
  }, [isLoading, me, navigate]);

  useEffect(() => setOpen(false), [pathname]);

  if (isLoading || !me || !me.userId) {
    return (
      <Centered>
        <p className="font-hand text-2xl text-muted-foreground">opening your notebook…</p>
      </Centered>
    );
  }

  if (!me.isAdmin) {
    return (
      <Centered>
        <div className="paper max-w-md p-8 text-center">
          <h1 className="text-3xl text-moss">This desk is private</h1>
          <p className="mt-3 text-muted-foreground">
            You're signed in as <strong>{me.email}</strong>, but this account isn't the blog's
            owner, so the dashboard is closed.
          </p>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              qc.clear();
              navigate({ to: "/auth" });
            }}
            className="mt-6 rounded-full border border-border px-5 py-2 hover:bg-pale"
          >
            Sign out
          </button>
        </div>
      </Centered>
    );
  }

  const isEditor = pathname.startsWith("/admin/posts/");
  if (isEditor) return <Outlet />;

  const signOut = async () => {
    await supabase.auth.signOut();
    qc.clear();
    navigate({ to: "/" });
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {/* mobile bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-ivory/95 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/admin" className="flex items-center gap-2 text-moss">
          <Leaf className="h-5 w-5" />
          <span className="font-display text-xl">The Little Cove</span>
        </Link>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Menu"
          aria-expanded={open}
          className="p-2 text-moss"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <aside
        className={`${open ? "block" : "hidden"} border-r border-border bg-ivory lg:sticky lg:top-0 lg:block lg:h-screen`}
      >
        <div className="flex h-full flex-col px-4 py-6">
          <Link to="/admin" className="hidden items-center gap-2 px-2 text-moss lg:flex">
            <Leaf className="h-6 w-6" />
            <span className="font-display text-2xl leading-none">The Little Cove</span>
          </Link>
          <p className="hidden px-2 font-hand text-lg text-muted-foreground lg:block">
            writing desk
          </p>
          <nav aria-label="Dashboard" className="mt-2 space-y-0.5 lg:mt-8">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeOptions={{ exact: "exact" in n ? n.exact : false }}
                className="flex items-center gap-3 rounded-sm px-3 py-2 text-[0.98rem] text-foreground/75 hover:bg-pale hover:text-moss"
                activeProps={{ className: "bg-pale !text-moss font-medium" }}
              >
                <n.icon className="h-4 w-4" />
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-0.5 border-t border-border pt-4">
            <a
              href="/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-sm px-3 py-2 text-sm text-foreground/70 hover:bg-pale hover:text-moss"
            >
              <ExternalLink className="h-4 w-4" /> View the blog
            </a>
            <button
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-sm px-3 py-2 text-sm text-foreground/70 hover:bg-pale hover:text-moss"
            >
              <LogOut className="h-4 w-4" /> Sign out
            </button>
            <p className="truncate px-3 pt-2 text-xs text-muted-foreground">{me.email}</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-8 lg:py-10">
        <div className="mx-auto max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="grid min-h-screen place-items-center px-4">{children}</div>;
}
