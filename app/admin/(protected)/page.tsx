import Link from "next/link";
import { adminConfig } from "@/lib/admin/env";
import { listPosts } from "@/lib/admin/posts";
import { PostList } from "@/components/admin/PostList";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const cfg = adminConfig();
  if (!cfg.ok) return null; // guarded by layout; shouldn't happen

  let posts: Awaited<ReturnType<typeof listPosts>> = [];
  let error: string | null = null;
  try {
    posts = await listPosts(cfg.config);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to load posts from GitHub.";
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Blog posts</h1>
          <p className="mt-1 text-sm text-muted">
            {error ? "—" : `${posts.length} post${posts.length === 1 ? "" : "s"}`} · edits commit to
            GitHub and deploy automatically
          </p>
        </div>
        <Link
          href="/admin/posts/new"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:bg-accent-deep"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M10 4v12M4 10h12" />
          </svg>
          New post
        </Link>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          <p className="font-semibold">Couldn’t load posts</p>
          <p className="mt-1">{error}</p>
          <p className="mt-2 text-red-600/80">
            Check that <code>GITHUB_TOKEN</code> has repo access and <code>GITHUB_REPO</code> is
            correct.
          </p>
        </div>
      ) : (
        <PostList posts={posts} />
      )}
    </div>
  );
}
