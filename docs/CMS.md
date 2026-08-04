# Blog CMS — operator guide

A custom, git-backed admin at **`/admin`** where Russell can create, edit, and
delete blog posts. No third-party CMS service.

## How it works

```
Russell → /admin (password login)
        → edits a post
        → CMS commits the .mdx to GitHub (main) via the GitHub API
        → GitHub Actions builds & deploys to Cloudflare  (.github/workflows/deploy.yml)
        → change is live on russelldsmith.com
```

- **Source of truth is the repo.** Posts live at `content/blog/{slug}.mdx`, exactly
  as before. The CMS reads and writes them through the GitHub Contents API, so it
  works at request time on the Cloudflare Worker (whose filesystem is only a
  build-time snapshot).
- **Dashboard speed.** A small `content/blog-index.json` (slug, title, date,
  status, categories) is kept up to date on every save so the post list loads in
  one request instead of fetching 330+ files. It’s also regenerated on every
  deploy (`npm run content:index`).
- **Publishing is a deploy.** Because the site is statically generated, a change
  goes live when the deploy workflow finishes (~1–3 min after saving).

## One-time setup

### 1. Worker secrets (so the CMS can run + commit)

Set these on the `russelldsmith` Worker (Cloudflare dashboard → Workers → Settings
→ Variables, or the CLI):

```bash
npx wrangler secret put ADMIN_PASSWORD    # the password Russell types to log in
npx wrangler secret put SESSION_SECRET    # openssl rand -hex 32
npx wrangler secret put GITHUB_TOKEN      # fine-grained PAT, repo Contents: read+write
```

`GITHUB_REPO` and `GITHUB_BRANCH` are already set as plain vars in
`wrangler.jsonc` (not secret).

**Creating the `GITHUB_TOKEN`:** GitHub → Settings → Developer settings →
Fine-grained tokens → only the `stonebaldwin/russelldsmith` repo → Repository
permissions → **Contents: Read and write**. Nothing else is needed.

### 2. GitHub Actions secrets (so saves deploy)

Repo → Settings → Secrets and variables → Actions:

- `CLOUDFLARE_API_TOKEN` — a Cloudflare API token with the *Edit Cloudflare
  Workers* template permissions.
- `CLOUDFLARE_ACCOUNT_ID` — your Cloudflare account id.

That’s what makes `.github/workflows/deploy.yml` publish on every push to `main`.

### 3. Local development

```bash
cp .dev.vars.example .dev.vars   # then fill in real values (gitignored)
npm run dev                      # http://localhost:3000/admin
```

## Using it

- **Sign in** at `/admin` with the admin password.
- **Dashboard** lists every post with search, status (draft/published) and
  category filters. Edit ✎, view live 👁, or delete 🗑 per row.
- **Editor** (in-depth):
  - Title, URL slug, meta description (with a length meter).
  - Markdown body with a formatting toolbar (headings, bold/italic, lists,
    quotes, links, tables, inline code, dividers) and a **live split preview**
    that renders exactly like the live site.
  - **Image upload** — toolbar button, **drag-and-drop, or paste** (e.g. a
    screenshot) drops files into `public/images/blog/{slug}/` and inserts the
    Markdown for you (also used for the hero).
  - Sidebar: hero image, categories, tags, publish/updated dates.
  - **SEO tab**: Google-style search-result preview + canonical URL.
  - `⌘/Ctrl+S` saves. Unsaved changes are flagged and warn before you leave, and
    are **auto-backed-up to your browser** — reload or crash recovery offers to
    restore them (this local backup never commits; publishing stays explicit).
- **Draft vs Publish.** Drafts are committed but excluded from the public site
  (they never render). Publish makes a post live on the next deploy.

## Guardrails (do not remove)

- **Slugs are locked after creation.** They’re the 301-redirect join key; changing
  one would break inbound links. The editor disables the slug field on existing
  posts and the API rejects slug changes.
- **Delete warns about redirects.** Deleting a post that has inbound links / 301s
  can create broken links — the confirm dialog says so and suggests using a draft
  instead.
- The CMS is `noindex` and password-protected.

## Files

| Path | Purpose |
| --- | --- |
| `app/admin/**` | Admin UI (login, dashboard, editor) |
| `app/api/admin/**` | Auth + posts + upload endpoints |
| `lib/admin/**` | auth, GitHub client, MDX (de)serialization, post ops |
| `components/admin/**` | Shell, post list, editor, toolbar, fields |
| `.github/workflows/deploy.yml` | Build + deploy on push to main |
| `content/blog-index.json` | Dashboard listing index (CMS-maintained) |
