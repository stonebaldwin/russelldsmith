import { getCloudflareContext } from "@opennextjs/cloudflare";

/**
 * Range-capable streaming endpoint for the site's self-hosted video.
 *
 * WHY THIS EXISTS: Cloudflare Workers Static Assets does not honour the `Range`
 * header — a ranged GET for /media/video/*.mp4 comes back `200` with the whole
 * body and no `Accept-Ranges`. Browsers therefore cannot seek: dragging the
 * scrubber past the buffered edge snaps playback back to 0:00. (`next dev`
 * serves 206 correctly, so this only reproduces in production.)
 *
 * So the bytes still live in Workers Assets, but the player points here, and
 * this route puts a conforming RFC 9110 range layer in front of them.
 */

export const dynamic = "force-dynamic";

/**
 * Allowlist. The `[file]` param is attacker-controlled, so it selects a known
 * entry rather than being interpolated into an asset path.
 */
const ALLOWED: Record<string, { path: string; type: string; bytes: number }> = {
  "russell-smith-message.mp4": {
    path: "/media/video/russell-smith-message.mp4",
    type: "video/mp4",
    // Byte length of the committed asset. Needed because the ASSETS binding
    // does not set Content-Length on its response, and Content-Range/
    // Content-Length here must state the true total. If the file is ever
    // re-encoded, update this to match `wc -c` or ranges will be misreported.
    bytes: 22_643_093,
  },
};

const IMMUTABLE = "public, max-age=31536000, immutable";

type AssetFetcher = { fetch: (input: Request) => Promise<Response> };

/**
 * Read the underlying asset. On Workers this goes through the ASSETS binding;
 * under plain `next dev` there is no binding, so fall back to the dev server,
 * which serves /public itself.
 *
 * The caller's Range is forwarded on the off-chance the asset layer honours it
 * — if it ever starts returning 206, we hand that straight back and skip the
 * slicing below entirely.
 */
async function fetchAsset(req: Request, path: string, range: string | null): Promise<Response> {
  const url = new URL(path, req.url).toString();
  const headers = new Headers();
  if (range) headers.set("range", range);

  try {
    const assets = (getCloudflareContext().env as unknown as { ASSETS?: AssetFetcher }).ASSETS;
    if (assets) return await assets.fetch(new Request(url, { headers }));
  } catch {
    // No Cloudflare context — `next dev` without the Workers runtime.
  }
  return fetch(url, { headers });
}

/**
 * Emit only bytes [start, end] of a stream, without buffering the whole asset
 * in the isolate (Workers cap memory at 128MB; the file is ~22MB and we should
 * not hold it per request anyway).
 */
function sliceStream(src: ReadableStream<Uint8Array>, start: number, end: number) {
  let seen = 0; // bytes consumed from the source so far
  return src.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        const chunkStart = seen;
        seen += chunk.byteLength;
        if (seen <= start) return; // entirely before the window
        if (chunkStart > end) {
          controller.terminate(); // past the window — stop reading
          return;
        }
        controller.enqueue(
          chunk.subarray(Math.max(0, start - chunkStart), Math.min(chunk.byteLength, end - chunkStart + 1)),
        );
        if (seen > end) controller.terminate();
      },
    }),
  );
}

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params;
  const entry = ALLOWED[file];
  if (!entry) return new Response("Not found", { status: 404 });

  const range = req.headers.get("range");
  const upstream = await fetchAsset(req, entry.path, range);

  const base = {
    "content-type": entry.type,
    "cache-control": IMMUTABLE,
    "accept-ranges": "bytes",
  };

  // The asset layer honoured the Range itself (this is what `next dev` does) —
  // hand its answer straight back rather than re-deriving it.
  if (upstream.status === 206 || upstream.status === 416) {
    const headers = new Headers(base);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("content-range", contentRange);
    const len = upstream.headers.get("content-length");
    if (len && upstream.status === 206) headers.set("content-length", len);
    return new Response(upstream.status === 416 ? null : upstream.body, {
      status: upstream.status,
      headers,
    });
  }

  if (!upstream.ok) return new Response("Not found", { status: 404 });

  // Prefer what the asset layer reports, but the Workers ASSETS binding omits
  // Content-Length entirely — fall back to the size recorded in ALLOWED so we
  // still emit a truthful Content-Range instead of giving up and sending 200.
  const reported = Number(upstream.headers.get("content-length"));
  const total = Number.isFinite(reported) && reported > 0 ? reported : entry.bytes;

  // No range asked for (or we can't tell how big the file is): serve it whole,
  // but advertise that ranges are available so the player will ask next time.
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (!match || !Number.isFinite(total) || total <= 0) {
    return new Response(upstream.body, { status: 200, headers: base });
  }

  let start: number;
  let end: number;
  if (match[1] === "") {
    // Suffix form, `bytes=-N` — the final N bytes.
    const suffix = Number(match[2]);
    if (!suffix) {
      return new Response(null, { status: 416, headers: { ...base, "content-range": `bytes */${total}` } });
    }
    start = Math.max(0, total - suffix);
    end = total - 1;
  } else {
    start = Number(match[1]);
    end = match[2] === "" ? total - 1 : Math.min(Number(match[2]), total - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= total) {
    return new Response(null, { status: 416, headers: { ...base, "content-range": `bytes */${total}` } });
  }

  return new Response(upstream.body ? sliceStream(upstream.body, start, end) : null, {
    status: 206,
    headers: {
      ...base,
      "content-length": String(end - start + 1),
      "content-range": `bytes ${start}-${end}/${total}`,
    },
  });
}
