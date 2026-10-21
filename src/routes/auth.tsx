import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Fern, Leaf } from "@/components/site/Botanicals";

export const Route = createFileRoute("/auth")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Sign in — The Little Cove" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (window.location.hash.includes("type=recovery")) setMode("reset");
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") setMode("reset");
      else if (event === "SIGNED_IN" && session && !window.location.hash.includes("type=recovery"))
        navigate({ to: "/admin" });
    });
    supabase.auth.getSession().then(({ data: s }) => {
      if (s.session && !window.location.hash.includes("type=recovery")) navigate({ to: "/admin" });
    });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/admin" });
      } else if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        if (data.session) navigate({ to: "/admin" });
        else
          setMessage(
            "Almost there — check your inbox for a confirmation link, then come back and sign in.",
          );
      } else if (mode === "forgot") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        setMessage("If that email has an account, a reset link is on its way.");
      } else if (mode === "reset") {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        toast.success("Password updated");
        navigate({ to: "/admin" });
      }
    } catch (err: any) {
      setMessage(friendly(err?.message ?? String(err)));
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    setBusy(true);
    const res: any = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: `${window.location.origin}/admin`,
    });
    if (res?.error) {
      setMessage(friendly(res.error.message ?? "Google sign-in didn't work."));
      setBusy(false);
    } else if (!res?.redirected) navigate({ to: "/admin" });
  }

  const titles: Record<Mode, string> = {
    signin: "Welcome back",
    signup: "Create the owner account",
    forgot: "Forgot your password?",
    reset: "Choose a new password",
  };

  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="relative w-full max-w-md">
        <Fern className="absolute -right-6 -top-10 h-20 w-20 text-sage" />
        <div className="paper relative rotate-[-0.4deg] p-8 sm:p-10">
          <span className="tape -top-3 left-10 rotate-[-4deg]" />
          <Link to="/" className="flex items-center gap-2 text-moss">
            <Leaf className="h-6 w-6" />
            <span className="font-display text-2xl">The Little Cove</span>
          </Link>
          <p className="mt-6 font-hand text-xl text-muted-foreground">your private writing desk</p>
          <h1 className="text-4xl text-moss">{titles[mode]}</h1>
          {mode === "signup" && (
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The very first account created becomes the owner of the blog. Anyone signing up after
              that gets no access to the dashboard.
            </p>
          )}

          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode !== "reset" && (
              <Field label="Email">
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}
            {mode !== "forgot" && (
              <Field label={mode === "reset" ? "New password" : "Password"}>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputCls}
                />
              </Field>
            )}
            {message && (
              <p
                className="rounded-sm bg-note px-3 py-2 text-sm leading-6 text-foreground/80"
                role="status"
              >
                {message}
              </p>
            )}
            <button
              disabled={busy}
              className="w-full rounded-full bg-primary px-5 py-2.5 text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {busy
                ? "One moment…"
                : mode === "signin"
                  ? "Sign in"
                  : mode === "signup"
                    ? "Create account"
                    : mode === "forgot"
                      ? "Send reset link"
                      : "Save password"}
            </button>
          </form>

          {(mode === "signin" || mode === "signup") && (
            <>
              <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                <span className="h-px flex-1 dotted-rule" /> or{" "}
                <span className="h-px flex-1 dotted-rule" />
              </div>
              <button
                onClick={google}
                disabled={busy}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-paper px-5 py-2.5 hover:bg-pale"
              >
                <GoogleIcon /> Continue with Google
              </button>
            </>
          )}

          <div className="mt-6 flex flex-wrap justify-between gap-2 text-sm text-muted-foreground">
            {mode === "signin" ? (
              <>
                <button
                  onClick={() => setMode("forgot")}
                  className="underline underline-offset-4 hover:text-moss"
                >
                  Forgot password?
                </button>
                <button
                  onClick={() => setMode("signup")}
                  className="underline underline-offset-4 hover:text-moss"
                >
                  First time here?
                </button>
              </>
            ) : (
              <button
                onClick={() => setMode("signin")}
                className="underline underline-offset-4 hover:text-moss"
              >
                ← Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "mt-1 w-full rounded-sm border border-input bg-ivory px-3 py-2 outline-none focus:border-moss";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm text-foreground/80">
      {label}
      {children}
    </label>
  );
}

function friendly(msg: string) {
  if (/invalid login/i.test(msg))
    return "That email and password don't match. Try again, or reset your password.";
  if (/already registered/i.test(msg))
    return "That email already has an account — sign in instead.";
  if (/email not confirmed/i.test(msg))
    return "Please confirm your email first (check your inbox), then sign in.";
  return msg;
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"
      />
    </svg>
  );
}
