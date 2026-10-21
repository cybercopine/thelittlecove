import type { ReactNode } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { PostStatus } from "@/lib/admin-data";

export const inputCls =
  "w-full rounded-sm border border-input bg-paper px-3 py-2 text-[0.98rem] outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-moss";
export const btn =
  "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm transition-colors disabled:pointer-events-none disabled:opacity-50";
export const btnPrimary = `${btn} bg-primary text-primary-foreground hover:bg-primary/90`;
export const btnGhost = `${btn} border border-border bg-paper text-foreground/80 hover:bg-pale hover:text-moss`;
export const btnDanger = `${btn} border border-destructive/40 text-destructive hover:bg-destructive/10`;

export function PageHeader({
  kicker,
  title,
  children,
}: {
  kicker?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="font-hand text-xl text-muted-foreground">{kicker}</p>}
        <h1 className="text-4xl leading-tight text-moss sm:text-5xl">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function effectiveStatus(
  status: PostStatus,
  publishedAt: string | null,
): "draft" | "published" | "scheduled" | "archived" {
  if (status === "published" || status === "scheduled") {
    if (!publishedAt) return "draft";
    return new Date(publishedAt) > new Date() ? "scheduled" : "published";
  }
  return status;
}

const STATUS_STYLE: Record<string, string> = {
  published: "bg-pale text-moss border-sage",
  draft: "bg-note text-foreground/70 border-oat",
  scheduled: "bg-[oklch(0.94_0.03_240)] text-[oklch(0.42_0.06_240)] border-[oklch(0.82_0.04_240)]",
  archived: "bg-muted text-muted-foreground border-border",
};
const STATUS_LABEL: Record<string, string> = {
  published: "Published",
  draft: "Draft",
  scheduled: "Scheduled",
  archived: "Archived",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-[0.1em] ${STATUS_STYLE[status] ?? ""}`}
    >
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

export function Confirm({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-paper">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-display text-2xl text-moss">{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep it</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function Labeled({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-sm font-medium text-foreground/80">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function Panel({
  id,
  title,
  children,
  className = "",
}: {
  id?: string;
  title?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-20 rounded-sm border border-border bg-paper p-5 ${className}`}
    >
      {title && <h2 className="mb-4 text-2xl text-moss">{title}</h2>}
      {children}
    </section>
  );
}
