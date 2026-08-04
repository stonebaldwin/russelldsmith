"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MarkdownBody } from "@/components/MarkdownBody";
import { MarkdownToolbar } from "./MarkdownToolbar";
import { CategorySelect, HeroField, SeoSnippet, TagInput } from "./editor-fields";
import { isValidSlug, slugify, type PostFrontmatter } from "@/lib/admin/mdx";

type Mode = "new" | "edit";
type ViewMode = "write" | "split" | "preview";

interface Props {
  mode: Mode;
  initialFrontmatter: PostFrontmatter;
  initialBody: string;
  initialSha?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export function PostEditor({ mode, initialFrontmatter, initialBody, initialSha }: Props) {
  const router = useRouter();
  const [fm, setFm] = useState<PostFrontmatter>(initialFrontmatter);
  const [body, setBody] = useState(initialBody);
  const [sha, setSha] = useState(initialSha);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [view, setView] = useState<ViewMode>("split");
  const [rightTab, setRightTab] = useState<"settings" | "seo">("settings");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const taRef = useRef<HTMLTextAreaElement>(null);

  const update = useCallback((patch: Partial<PostFrontmatter>) => {
    setFm((prev) => ({ ...prev, ...patch }));
    setDirty(true);
  }, []);

  function onTitle(v: string) {
    const patch: Partial<PostFrontmatter> = { title: v };
    if (mode === "new" && !slugTouched) patch.slug = slugify(v);
    update(patch);
  }
  function onBody(v: string) {
    setBody(v);
    setDirty(true);
  }

  const save = useCallback(
    async (draftState?: boolean) => {
      setError(null);
      const next: PostFrontmatter = { ...fm };
      if (draftState !== undefined) next.draft = draftState || undefined;
      if (!next.title.trim()) return setError("Title is required.");
      if (!isValidSlug(next.slug)) return setError("Slug must be lowercase letters, numbers and hyphens.");
      if (!next.date) next.date = today();
      if (mode === "edit") next.updated = today();

      setSaving(true);
      try {
        const res = await fetch(mode === "new" ? "/api/admin/posts" : `/api/admin/posts/${initialFrontmatter.slug}`, {
          method: mode === "new" ? "POST" : "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ frontmatter: next, body, sha }),
        });
        const data = (await res.json()) as { slug?: string; sha?: string; error?: string };
        if (!res.ok) {
          setError(data.error ?? "Save failed.");
          return;
        }
        setFm(next);
        setDirty(false);
        setSavedAt(new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }));
        if (mode === "new" && data.slug) {
          router.push(`/admin/posts/${data.slug}/edit`);
          router.refresh();
        } else if (data.sha) {
          setSha(data.sha);
        }
      } catch {
        setError("Network error — please try again.");
      } finally {
        setSaving(false);
      }
    },
    [fm, body, sha, mode, initialFrontmatter.slug, router],
  );

  // Cmd/Ctrl+S to save
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        void save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // warn on unsaved navigation
  useEffect(() => {
    function beforeUnload(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [dirty]);

  const isDraft = !!fm.draft || mode === "new";

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="sticky top-14 z-10 flex flex-wrap items-center gap-3 border-b border-line bg-white/95 px-5 py-3 backdrop-blur lg:top-0 lg:px-8">
        <button onClick={() => (dirty ? confirm("Discard unsaved changes?") && router.push("/admin") : router.push("/admin"))} className="text-sm text-muted hover:text-ink">
          ← Posts
        </button>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink">{fm.title || "Untitled post"}</div>
        </div>
        {savedAt && !dirty ? <span className="text-xs text-emerald-600">Saved {savedAt}</span> : null}
        {dirty ? <span className="text-xs text-amber-600">● Unsaved</span> : null}
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${isDraft ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"}`}>
          {isDraft ? "Draft" : "Published"}
        </span>
        <div className="flex items-center gap-2">
          {isDraft ? (
            <>
              <button onClick={() => save(true)} disabled={saving} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-50 disabled:opacity-50">
                Save draft
              </button>
              <button onClick={() => save(false)} disabled={saving} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-50">
                {saving ? "Publishing…" : "Publish"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => save(true)} disabled={saving} className="rounded-lg border border-line px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-slate-50 disabled:opacity-50">
                Unpublish
              </button>
              <button onClick={() => save()} disabled={saving} className="rounded-lg bg-accent px-4 py-1.5 text-sm font-medium text-white hover:bg-accent-deep disabled:opacity-50">
                {saving ? "Saving…" : "Save changes"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="mx-5 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700 lg:mx-8">{error}</div>
      ) : null}

      {/* Body */}
      <div className="grid flex-1 gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-8">
        {/* Main column */}
        <div className="min-w-0 space-y-4">
          <input
            value={fm.title}
            onChange={(e) => onTitle(e.target.value)}
            placeholder="Post title"
            className="w-full rounded-lg border border-transparent bg-transparent px-1 text-3xl font-semibold text-ink outline-none placeholder:text-slate-300 focus:border-line focus:bg-white"
          />

          <SlugField
            mode={mode}
            slug={fm.slug}
            onChange={(v) => {
              setSlugTouched(true);
              update({ slug: v });
            }}
          />

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-muted">
              Meta description
            </label>
            <textarea
              value={fm.description}
              onChange={(e) => update({ description: e.target.value })}
              rows={2}
              placeholder="One or two sentences for search results & social shares (120–160 chars)."
              className="w-full resize-none rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
            />
          </div>

          {/* Editor */}
          <div className="overflow-hidden rounded-xl border border-line bg-white">
            <div className="flex items-center justify-between border-b border-line bg-slate-50 px-2">
              <MarkdownToolbar textareaRef={taRef} value={body} setValue={onBody} slug={fm.slug} />
              <ViewToggle view={view} setView={setView} />
            </div>
            <div className={`grid ${view === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {view !== "preview" ? (
                <textarea
                  ref={taRef}
                  value={body}
                  onChange={(e) => onBody(e.target.value)}
                  placeholder="Write your post in Markdown…"
                  className="mdx-textarea admin-scroll min-h-[58vh] w-full resize-none border-0 border-r border-line px-4 py-4 text-ink outline-none"
                />
              ) : null}
              {view !== "write" ? (
                <div className="admin-scroll min-h-[58vh] overflow-auto px-5 py-4">
                  {body.trim() ? (
                    <MarkdownBody markdown={body} className="admin-preview" />
                  ) : (
                    <p className="text-sm text-muted">Preview will appear here.</p>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <aside className="space-y-4">
          <div className="flex rounded-lg border border-line bg-white p-1 text-sm">
            <button onClick={() => setRightTab("settings")} className={`flex-1 rounded-md py-1.5 font-medium ${rightTab === "settings" ? "bg-accent-pale text-accent" : "text-muted"}`}>
              Settings
            </button>
            <button onClick={() => setRightTab("seo")} className={`flex-1 rounded-md py-1.5 font-medium ${rightTab === "seo" ? "bg-accent-pale text-accent" : "text-muted"}`}>
              SEO
            </button>
          </div>

          {rightTab === "settings" ? (
            <>
              <Panel title="Hero image">
                <HeroField
                  slug={fm.slug}
                  hero={fm.hero ?? ""}
                  heroAlt={fm.heroAlt ?? ""}
                  onHero={(v) => update({ hero: v || undefined })}
                  onHeroAlt={(v) => update({ heroAlt: v || undefined })}
                />
              </Panel>
              <Panel title="Categories">
                <CategorySelect value={fm.categories} onChange={(v) => update({ categories: v })} />
              </Panel>
              <Panel title="Tags">
                <TagInput value={fm.tags} onChange={(v) => update({ tags: v })} />
              </Panel>
              <Panel title="Dates">
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-muted">
                    Published
                    <input type="date" value={fm.date} onChange={(e) => update({ date: e.target.value })} className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
                  </label>
                  <label className="text-xs text-muted">
                    Updated
                    <input type="date" value={fm.updated ?? ""} onChange={(e) => update({ updated: e.target.value || undefined })} className="mt-1 w-full rounded-lg border border-line bg-white px-2 py-1.5 text-sm text-ink outline-none focus:border-accent" />
                  </label>
                </div>
              </Panel>
            </>
          ) : (
            <>
              <SeoSnippet title={fm.title} description={fm.description} slug={fm.slug} />
              <Panel title="Canonical URL">
                <div className="break-all rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-ink-soft">
                  https://russelldsmith.com/blog/{fm.slug || "your-slug"}/
                </div>
              </Panel>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}

function SlugField({ mode, slug, onChange }: { mode: Mode; slug: string; onChange: (v: string) => void }) {
  const valid = isValidSlug(slug);
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
        URL slug
        {mode === "edit" ? <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] normal-case text-muted">locked · SEO</span> : null}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-line bg-white px-3 py-2 text-sm">
        <span className="font-mono text-muted">/blog/</span>
        <input
          value={slug}
          onChange={(e) => onChange(e.target.value.toLowerCase())}
          disabled={mode === "edit"}
          className="flex-1 bg-transparent font-mono text-ink outline-none disabled:text-muted"
        />
        <span className="font-mono text-muted">/</span>
      </div>
      {!valid && slug ? <p className="mt-1 text-xs text-red-600">Use lowercase letters, numbers and hyphens only.</p> : null}
      {mode === "edit" ? (
        <p className="mt-1 text-xs text-muted">Slugs are the 301-redirect join key — changing one would break inbound links, so it&apos;s locked after creation.</p>
      ) : null}
    </div>
  );
}

function ViewToggle({ view, setView }: { view: ViewMode; setView: (v: ViewMode) => void }) {
  const opts: ViewMode[] = ["write", "split", "preview"];
  return (
    <div className="hidden items-center gap-0.5 py-1 md:flex">
      {opts.map((o) => (
        <button
          key={o}
          onClick={() => setView(o)}
          className={`rounded px-2 py-1 text-xs font-medium capitalize ${view === o ? "bg-white text-accent shadow-sm" : "text-muted hover:text-ink"}`}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </div>
  );
}
