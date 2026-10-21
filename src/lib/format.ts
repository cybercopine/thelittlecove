export function slugify(s: string) {
  return (
    s
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `entry-${Date.now().toString(36)}`
  );
}

export function stripHtml(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

export function readingTime(html: string) {
  const words = stripHtml(html).split(" ").filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function fmtDate(d: string | null | undefined, opts: Intl.DateTimeFormatOptions = { month: "long", day: "numeric", year: "numeric" }) {
  if (!d) return "";
  const date = new Date(d.length === 10 ? d + "T12:00:00" : d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" });
}

export function shortDate(d: string | null | undefined) {
  return fmtDate(d, { month: "short", day: "numeric" });
}
