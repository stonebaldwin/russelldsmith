/**
 * Runtime secret/config access for the CMS.
 *
 * On @opennextjs/cloudflare, Cloudflare `vars` and secrets are exposed on
 * `process.env` (in `next dev` they come from `.dev.vars`; in production from
 * `wrangler secret put` / the dashboard). We read `process.env` first and fall
 * back to the Cloudflare request context for safety.
 */
import { getCloudflareContext } from "@opennextjs/cloudflare";

export function env(key: string): string | undefined {
  // @opennextjs/cloudflare polyfills process.env from the Worker's vars+secrets
  // (and `next dev` sources them from .dev.vars), so this covers most cases.
  const pv = process.env[key];
  if (pv != null && pv !== "") return pv;
  // Fallback: read straight off the Cloudflare request context if present.
  try {
    const v = (getCloudflareContext().env as Record<string, string | undefined>)?.[key];
    if (v != null && v !== "") return v;
  } catch {
    /* not in a Cloudflare request context */
  }
  return undefined;
}

export interface AdminConfig {
  adminPassword: string;
  sessionSecret: string;
  githubToken: string;
  githubRepo: string; // "owner/name"
  githubBranch: string;
}

/** Read + validate all CMS config. Returns null (with reasons) if incomplete. */
export function adminConfig(): { ok: true; config: AdminConfig } | { ok: false; missing: string[] } {
  const cfg: AdminConfig = {
    adminPassword: env("ADMIN_PASSWORD") ?? "",
    sessionSecret: env("SESSION_SECRET") ?? "",
    githubToken: env("GITHUB_TOKEN") ?? "",
    githubRepo: env("GITHUB_REPO") ?? "stonebaldwin/russelldsmith",
    githubBranch: env("GITHUB_BRANCH") ?? "main",
  };
  const missing: string[] = [];
  if (!cfg.adminPassword) missing.push("ADMIN_PASSWORD");
  if (!cfg.sessionSecret) missing.push("SESSION_SECRET");
  if (!cfg.githubToken) missing.push("GITHUB_TOKEN");
  return missing.length ? { ok: false, missing } : { ok: true, config: cfg };
}
