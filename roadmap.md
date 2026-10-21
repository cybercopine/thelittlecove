# The Little Cove — roadmap

## Done
- [x] Backend: posts, categories, tags, media, settings, admin role (first account = owner), private storage
- [x] Public site: scrapbook homepage, Journal / Entomology / Food / Japanese, post pages (7 templates), tags, search, archive, About, SEO
- [x] Sample placeholder posts (clearly marked)

- [x] Sign-in page (/auth) — email + Google, password reset
- [x] Private dashboard (/admin): post list with search & filters, new post → choose template, draft/publish/schedule/unpublish/archive/duplicate/delete, homepage feature
- [x] Document-style editor (headings, lists, quotes, pull quotes, links, photos with alignment & captions, dividers, undo/redo, autosave + browser draft recovery)
- [x] Media library (upload, in-browser resize to WebP, captions, alt text, folders, galleries) + public image route /img/*
- [x] Tags & categories manager; Settings (homepage intro, notes, polaroid, lately, featured, About, tagline, SEO, JSON backup)
- [x] Live desktop/mobile preview (/preview/:id); in-dashboard help guide (/admin/guide) + HANDOVER.md

## Next
- [ ] Confirm the private storage bucket named `media` exists in Lovable Cloud (uploads need it)
- [ ] End-to-end tests against a real test database
