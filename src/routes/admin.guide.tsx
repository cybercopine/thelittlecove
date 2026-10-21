import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/admin/bits";
import { Sprig } from "@/components/site/Botanicals";

export const Route = createFileRoute("/admin/guide")({
  component: Guide,
});

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="grid grid-cols-[2.2rem_1fr] gap-3">
      <span className="font-display text-3xl leading-none text-sage">{n}.</span>
      <div>
        <h3 className="font-display text-xl text-moss">{title}</h3>
        <div className="mt-0.5 text-[0.98rem] leading-7 text-foreground/80">{children}</div>
      </div>
    </li>
  );
}

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-20 rounded-sm border border-border bg-paper p-6 sm:p-8">
      <h2 className="flex items-center gap-2 text-3xl text-moss">
        <Sprig className="h-5 w-5" />
        {title}
      </h2>
      <div className="mt-4 space-y-3 text-[0.98rem] leading-7 text-foreground/80 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function Guide() {
  return (
    <div className="max-w-3xl">
      <PageHeader kicker="everything in one place" title="How to look after The Little Cove" />
      <div className="space-y-6">
        <Section id="write" title="Writing a new post">
          <ol className="space-y-4">
            <Step n={1} title="Sign in">
              Go to <strong>/admin</strong> on your blog's address (bookmark it). Sign in with your
              email & password or with Google.
            </Step>
            <Step n={2} title="Click “New post”">
              It's in the menu on the left, and on the Posts page.
            </Step>
            <Step n={3} title="Choose a template">
              Journal, Little Note, Field Note, Recipe, Food Story, Ikebana or Haiku. You can switch
              later from the editor's right-hand panel.
            </Step>
            <Step n={4} title="Title & subtitle">
              Type straight onto the page. The web address is made from your title automatically.
            </Step>
            <Step n={5} title="Category & tags">
              On the right: pick a category, then type a tag and press Enter. New tags are created
              on the spot.
            </Step>
            <Step n={6} title="Write">
              Use the toolbar like a word processor: headings, bold, italics, lists, quotes, pull
              quotes, links and dividers. Undo with Ctrl+Z (⌘Z on a Mac).
            </Step>
            <Step n={7} title="Add photos">
              Press <strong>Photo</strong> in the toolbar to place pictures inside your writing —
              click a photo, then the align buttons to float it left, centre or right. Use{" "}
              <strong>Cover photo</strong> and <strong>Photo gallery</strong> on the right for the
              big picture and polaroid gallery.
            </Step>
            <Step n={8} title="Captions & details">
              Each photo can have a caption and a description (read aloud to blind readers).
              Template details — like scientific name or ingredients — sit in the green box under
              the title.
            </Step>
            <Step n={9} title="Preview">
              Press <strong>Preview</strong>, then switch between Desktop and Mobile. It updates as
              you type and only you can see it.
            </Step>
            <Step n={10} title="Save or publish">
              Drafts save themselves every couple of seconds. Press <strong>Publish</strong> when
              ready. To schedule, pick a future publication date first — the button becomes{" "}
              <strong>Schedule</strong>.
            </Step>
            <Step n={11} title="Come back later">
              Open any post from the Posts page. On a published post, edits go live only when you
              press <strong>Update</strong>. Use ⋯ → <strong>Unpublish</strong> to hide it again.
            </Step>
          </ol>
        </Section>

        <Section id="safety" title="Little safety nets">
          <p>
            <strong>Autosave & recovery.</strong> Drafts save automatically. Every change is also
            kept in your browser, so if a tab closes or the internet drops, reopening the post
            offers to <em>recover</em> your unsaved words.
          </p>
          <p>
            <strong>Unpublish vs. Archive vs. Delete.</strong> Unpublish and Archive both hide a
            post from readers and keep it safe. Delete removes it forever (you'll be asked to
            confirm).
          </p>
          <p>
            <strong>Duplicate</strong> makes a draft copy — handy to reuse a recipe card or
            field-note layout.
          </p>
          <p>
            <strong>Sample posts</strong> are marked “sample placeholder”. Edit them into your own
            (and untick the sample box) or delete them.
          </p>
        </Section>

        <Section id="change" title="What you can change yourself">
          <p>
            <strong>From the dashboard, no code needed:</strong> all posts and photos; homepage
            welcome letter, signature, sticky note, polaroid photo & caption, dreams, quote; the
            “Currently exploring” list; the featured post; the About page; the tagline & footer
            note; Google descriptions; categories (names, descriptions, handwritten notes, menu
            order, show/hide) and tags.
          </p>
          <p>
            <strong>Needs a design change (code):</strong> colours, fonts, the overall scrapbook
            layout, the shapes of the templates, adding a brand-new kind of template, and the
            decorative drawings (fern, moth, washi tape).
          </p>
        </Section>

        <Section id="how" title="How your blog is kept safe">
          <p>
            <strong>Where things live.</strong> Your posts, tags and settings are stored in a
            private database, and your photos in private file storage, both run by Lovable Cloud.
            Photos are shrunk in your browser before uploading so pages load quickly, then shown to
            readers through your blog's own <code>/img/…</code> address.
          </p>
          <p>
            <strong>Signing in.</strong> Passwords are handled by the login service — the blog never
            sees or stores them. The very first account created became the owner; anyone else who
            signs up gets no access to the dashboard.
          </p>
          <p>
            <strong>Drafts stay private.</strong> The database itself refuses to show drafts,
            archived posts or not-yet-scheduled posts to anyone except you — even someone who
            guesses an address. Note: a photo's web link works for anyone who has it, so don't
            upload pictures you'd never want seen.
          </p>
        </Section>

        <Section id="backup" title="Backups & moving elsewhere">
          <p>
            In{" "}
            <Link
              to="/admin/settings"
              hash="backup"
              className="text-moss underline underline-offset-4"
            >
              Blog settings → Backup
            </Link>
            , download a file with all your writing, tags, categories and settings. Do this every
            month or so and keep it in your Google Drive.
          </p>
          <p>
            The blog's code lives in your GitHub repository and is yours. Because it uses standard
            tools (a Supabase/Postgres database and file storage), a developer could move it to
            another host later; the backup file plus your photos are everything they would need.
          </p>
        </Section>

        <Section id="costs" title="Costs & limits">
          <p>
            Hosting, database, login and photo storage run on Lovable Cloud. Cloud is billed by
            usage (visitors, stored photos, database size), and a small personal blog uses very
            little. Check Lovable's pricing page for the current allowances, as they change.
          </p>
          <p>
            Lovable's AI credits are only spent when you ask Lovable's AI to change the code.
            Writing, publishing and uploading photos here in the dashboard doesn't use them.
          </p>
        </Section>
      </div>
    </div>
  );
}
