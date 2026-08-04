/**
 * Session auth for the CMS — single admin password + HMAC-signed cookie.
 *
 * Uses Web Crypto (available in both the Cloudflare Worker runtime and Node),
 * so no `jsonwebtoken`/`crypto` node deps. The cookie is `<payload>.<sig>` where
 * payload is base64url(JSON) and sig is base64url(HMAC-SHA256(payload)).
 */
export const SESSION_COOKIE = "rs_admin";
const DEFAULT_TTL = 60 * 60 * 24 * 7; // 7 days

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/** Copy into a fresh ArrayBuffer-backed view so Web Crypto's BufferSource type
 *  is satisfied (avoids the Uint8Array<ArrayBufferLike> vs ArrayBuffer mismatch). */
function ab(u: Uint8Array): ArrayBuffer {
  const b = new ArrayBuffer(u.byteLength);
  new Uint8Array(b).set(u);
  return b;
}

function b64urlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? "" : "=".repeat(4 - (s.length % 4));
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/") + pad);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function hmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    ab(encoder.encode(secret)),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function createSessionToken(secret: string, ttl = DEFAULT_TTL): Promise<string> {
  const payload = { sub: "admin", iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + ttl };
  const body = b64urlEncode(encoder.encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, ab(encoder.encode(body))));
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifySessionToken(token: string | undefined, secret: string): Promise<boolean> {
  if (!token) return false;
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  try {
    const key = await hmacKey(secret);
    const ok = await crypto.subtle.verify("HMAC", key, ab(b64urlDecode(sig)), ab(encoder.encode(body)));
    if (!ok) return false;
    const payload = JSON.parse(decoder.decode(b64urlDecode(body))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

/** Constant-time-ish password compare (avoids trivial early-exit timing leak). */
export function verifyPassword(input: string, expected: string): boolean {
  if (!expected || !input) return false;
  const a = encoder.encode(input);
  const b = encoder.encode(expected);
  let diff = a.length ^ b.length;
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diff === 0;
}

export function sessionCookieString(token: string, ttl = DEFAULT_TTL): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ttl}${secure}`;
}
export function clearCookieString(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
