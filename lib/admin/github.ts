/**
 * Minimal GitHub REST client for the CMS (Contents API).
 *
 * The repo is the source of truth for content. Reads/writes go through GitHub so
 * they work at request time on the Cloudflare Worker (whose local filesystem is
 * only a build-time snapshot). Writes commit to `GITHUB_BRANCH`.
 */
import { AdminConfig } from "./env";

const API = "https://api.github.com";

export interface GhFile {
  name: string;
  path: string;
  sha: string;
  type: "file" | "dir";
  size: number;
}

function headers(cfg: AdminConfig): HeadersInit {
  return {
    Authorization: `Bearer ${cfg.githubToken}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "russelldsmith-cms",
  };
}

// UTF-8 safe base64 <-> string
const te = new TextEncoder();
const td = new TextDecoder();
export function toBase64(text: string): string {
  const bytes = te.encode(text);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}
export function fromBase64(b64: string): string {
  const bin = atob(b64.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return td.decode(bytes);
}

async function gh(cfg: AdminConfig, path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API}/repos/${cfg.githubRepo}${path}`, {
    ...init,
    headers: { ...headers(cfg), ...(init?.headers ?? {}) },
  });
}

/** Get a text file's content + sha, or null if it doesn't exist. */
export async function getFile(
  cfg: AdminConfig,
  filePath: string,
): Promise<{ content: string; sha: string } | null> {
  const res = await gh(cfg, `/contents/${encodePath(filePath)}?ref=${cfg.githubBranch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getFile ${filePath}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { content?: string; sha: string };
  return { content: json.content ? fromBase64(json.content) : "", sha: json.sha };
}

/** Just the sha (cheap existence check), or null. */
export async function getSha(cfg: AdminConfig, filePath: string): Promise<string | null> {
  const res = await gh(cfg, `/contents/${encodePath(filePath)}?ref=${cfg.githubBranch}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GitHub getSha ${filePath}: ${res.status}`);
  const json = (await res.json()) as { sha: string };
  return json.sha;
}

export async function listDir(cfg: AdminConfig, dirPath: string): Promise<GhFile[]> {
  const res = await gh(cfg, `/contents/${encodePath(dirPath)}?ref=${cfg.githubBranch}`);
  if (res.status === 404) return [];
  if (!res.ok) throw new Error(`GitHub listDir ${dirPath}: ${res.status}`);
  return (await res.json()) as GhFile[];
}

/** Create or update a text file. Pass the current sha to update; omit to create. */
export async function putTextFile(
  cfg: AdminConfig,
  filePath: string,
  content: string,
  message: string,
  sha?: string,
): Promise<{ sha: string }> {
  return putBase64File(cfg, filePath, toBase64(content), message, sha);
}

/** Create or update a file from base64 content (used for binary uploads). */
export async function putBase64File(
  cfg: AdminConfig,
  filePath: string,
  base64Content: string,
  message: string,
  sha?: string,
): Promise<{ sha: string }> {
  const res = await gh(cfg, `/contents/${encodePath(filePath)}`, {
    method: "PUT",
    body: JSON.stringify({
      message,
      content: base64Content,
      branch: cfg.githubBranch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) throw new Error(`GitHub put ${filePath}: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { content: { sha: string } };
  return { sha: json.content.sha };
}

export async function deleteFile(
  cfg: AdminConfig,
  filePath: string,
  message: string,
  sha: string,
): Promise<void> {
  const res = await gh(cfg, `/contents/${encodePath(filePath)}`, {
    method: "DELETE",
    body: JSON.stringify({ message, branch: cfg.githubBranch, sha }),
  });
  if (!res.ok) throw new Error(`GitHub delete ${filePath}: ${res.status} ${await res.text()}`);
}

/** Encode a repo path for the URL without turning slashes into %2F. */
function encodePath(p: string): string {
  return p.split("/").map(encodeURIComponent).join("/");
}
