"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { PostIndexEntry } from "@/lib/admin/posts";
import { categoryLabel } from "@/lib/admin/taxonomy";

export function PostList({ posts }: { posts: PostIndexEntry[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PostIndexEntry | null>(null);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => p.categories?.forEach((c) => set.add(c)));
    return Array.from(set).sort();
  }, [posts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return posts.filter((p) => {
      if (status === "draft" && !p.draft) return false;
      if (status === "published" && p.draft) return false;
      if (category !== "all" && !p.categories?.includes(category)) return false;
      if (q && !(`${p.title} ${p.slug}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [posts, query, status, category]);

  async function doDelete(slug: string) {
    setDeleting(slug);
    try {
      const res = await fetch(`/api/admin/posts/${slug}`, { method: "DELETE" });
      if (!res.ok) {
        const d = (await res.json().catch(() => ({}))) as { error?: string };
        alert(d.error ?? "Delete failed.");
      } else {
        router.refresh();
      }
    } finally {
      setDeleting(null);
      setConfirm(null);
    }
  }

  return (
    <div>
      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <div className="relative flex-1 min-w-[220px]">
          <svg viewBox="0 0 20 20" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="9" cy="9" r="6" />
            <path d="M14 14l3 3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search posts…"
            className="w-full rounded-lg border border-line bg-white py-2 pl-9 pr-3 text-sm text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as typeof status)}
          className="rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft outline-none focus:border-accent"
        >
          <option value="all">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Drafts</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="max-w-[200px] rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft outline-none focus:border-accent"
        >
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="admin-scroll overflow-x-auto rounded-xl border border-line bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <th className="px-4 py-3 font-semibold">Title</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Categories</th>
              <th className="px-4 py-3 font-semibold">Date</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.slug} className="border-b border-line/70 last:border-0 hover:bg-accent-pale/40">
                <td className="px-4 py-3">
                  <Link href={`/admin/posts/${p.slug}/edit`} className="font-medium text-ink hover:text-accent">
                    {p.title || p.slug}
                  </Link>
                  <div className="mt-0.5 font-mono text-xs text-muted">/{p.slug}/</div>
                </td>
                <td className="px-4 py-3">
                  {p.draft ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Draft</span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">Published</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {(p.categories ?? []).slice(0, 3).map((c) => (
                      <span key={c} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs text-ink-soft">
                        {categoryLabel(c)}
                      </span>
                    ))}
                    {(p.categories?.length ?? 0) > 3 ? (
                      <span className="text-xs text-muted">+{(p.categories!.length ?? 0) - 3}</span>
                    ) : null}
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-ink-soft">{p.date || "—"}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/posts/${p.slug}/edit`} className="rounded-md p-1.5 text-muted hover:bg-accent-pale hover:text-accent" title="Edit">
                      <EditIcon />
                    </Link>
                    <a href={`/blog/${p.slug}/`} target="_blank" rel="noreferrer" className="rounded-md p-1.5 text-muted hover:bg-accent-pale hover:text-accent" title="View live">
                      <EyeIcon />
                    </a>
                    <button
                      onClick={() => setConfirm(p)}
                      disabled={deleting === p.slug}
                      className="rounded-md p-1.5 text-muted hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="px-4 py-16 text-center text-sm text-muted">
            {posts.length === 0 ? "No posts yet — create your first one." : "No posts match your filters."}
          </div>
        ) : null}
      </div>

      {/* Delete confirm */}
      {confirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-ink">Delete this post?</h3>
            <p className="mt-2 text-sm text-ink-soft">
              <strong>{confirm.title || confirm.slug}</strong> will be removed from the site on the
              next deploy.
            </p>
            <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              ⚠ If this post has inbound links or 301 redirects pointing to it, deleting it may create
              broken links. Consider keeping it as a draft instead.
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink-soft hover:bg-slate-50">
                Cancel
              </button>
              <button
                onClick={() => doDelete(confirm.slug)}
                disabled={deleting === confirm.slug}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting === confirm.slug ? "Deleting…" : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13.5 3.5l3 3L7 16l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}
function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" />
      <circle cx="10" cy="10" r="2.2" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 6h12M8 6V4h4v2M6 6l1 10h6l1-10" />
    </svg>
  );
}
