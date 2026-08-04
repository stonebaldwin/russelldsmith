"use client";

/** Shared client helpers for the editor (image upload + markdown insertion). */

export function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Upload one image file to /public/images/blog/{slug}/ and return its site path. */
export async function uploadImageFile(
  slug: string,
  file: File,
): Promise<{ path?: string; error?: string }> {
  if (!slug) return { error: "Set the post slug first so images can be filed under it." };
  if (!file.type.startsWith("image/")) return { error: "That file isn't an image." };
  try {
    const dataUrl = await readAsDataURL(file);
    const res = await fetch("/api/admin/upload", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ slug, filename: file.name || "image.png", dataUrl }),
    });
    const data = (await res.json()) as { path?: string; error?: string };
    if (!res.ok || !data.path) return { error: data.error ?? "Upload failed." };
    return { path: data.path };
  } catch {
    return { error: "Upload failed (network)." };
  }
}

/** Markdown for an uploaded image, deriving alt text from the filename. */
export function markdownForImage(file: File, path: string): string {
  const alt = (file.name || "image").replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ").trim();
  return `![${alt}](${path})`;
}

/** Insert text into a string at an index; returns new value + caret position. */
export function insertAt(value: string, index: number, text: string): { value: string; caret: number } {
  const v = value.slice(0, index) + text + value.slice(index);
  return { value: v, caret: index + text.length };
}
