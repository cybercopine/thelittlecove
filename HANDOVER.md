# The Little Cove — handover guide

The same guide lives inside the dashboard at **/admin/guide**.

## Getting in
- Go to `your-blog-address/admin` and bookmark it. Not signed in? It sends you to the sign-in page.
- **First time:** click *First time here?* and create your account. The very first account becomes the owner. Anyone else who signs up gets no access.
- Sign in with email + password or Google. *Forgot password?* emails you a reset link.

## Writing a post
1. **New post** → choose a template (Journal, Little Note, Field Note, Recipe, Food Story, Ikebana, Haiku).
2. Type the title and subtitle straight onto the page.
3. On the right, pick a **category** and add **tags** (type a tag + Enter; new tags are created on the spot).
4. Write with the toolbar: headings, bold/italic, lists, quote, pull quote, link, divider, undo/redo.
5. **Photo** (toolbar) puts photos inside the writing. Click a photo, then use the align buttons to place it left, centre or right.
6. Use **Cover photo** and **Photo gallery** on the right. Every photo can have a caption and a description.
7. The green box under the title holds template details (scientific name, ingredients, Japanese text…).
8. **Preview** shows the post at desktop or mobile size and updates as you type.
9. Drafts save automatically. **Publish** makes the post live. To schedule a post, set a future publication date first; the button then says **Schedule**.
10. To edit a published post, open it, make your changes and press **Update**. ⋯ → **Unpublish** hides it again.

## Safety nets
- Autosave for drafts, plus a backup copy in your browser. If a tab closes, the post offers to *recover* your words when you open it again.
- **Unpublish** and **Archive** hide a post but keep it. **Delete** removes it forever and asks you to confirm first.
- **Duplicate** makes a draft copy.
- Sample posts are marked "sample placeholder". Edit them into your own writing or delete them.

## What you can change without code
Posts, photos, the homepage welcome letter, signature, sticky note, polaroid photo and caption, dreams, quote, the "Currently exploring" list, the featured post, the About page, tagline, footer note, Google descriptions, categories (name, description, handwritten note, menu order, show/hide) and tags.

**These need a design (code) change:** colours, fonts, page layouts, how each template looks, adding a new template, and the decorative drawings.

## How it's stored and kept private
- Posts, tags and settings are kept in a Postgres database. Photos are kept in a private storage bucket called `media`. Both run on Lovable Cloud (Supabase).
- Photos are shrunk in the browser (max 2000px, WebP) before upload. Readers load them through `/img/...`.
- Database rules (row-level security) only let the owner account see drafts, archived posts or future scheduled posts, or change anything. This applies even if someone guesses an address.
- Anyone who has a photo's direct link can open it, so don't upload anything truly private.

## Backups and moving elsewhere
- **Blog settings → Backup** downloads a JSON file of all your posts, tags, categories, settings and the media list. Do this monthly.
- The code is in your GitHub repo. It uses standard tools (TanStack Start + Supabase/Postgres + storage), so a developer can move it to any host. They need the backup file plus the photo files.

## Costs
Hosting, database, login and photo storage are billed by Lovable Cloud according to usage. A small personal blog uses very little, but check Lovable's pricing page for the current allowances. AI credits are only spent when you ask Lovable's AI to change the code. Writing, publishing and uploading in the dashboard never uses them.

## For a developer
- Dashboard routes: `src/routes/admin*.tsx`. Data helpers: `src/lib/admin-data.ts`. Editor: `src/components/admin/RichEditor.tsx` (TipTap).
- No new database migrations were added. Everything uses the existing tables and policies.
- Image route: `src/routes/img.$.tsx`. Preview: `src/routes/preview.$id.tsx`.
