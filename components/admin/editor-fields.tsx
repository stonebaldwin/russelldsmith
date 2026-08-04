"use client";

import { useState } from "react";
import { CATEGORY_OPTIONS, categoryLabel } from "@/lib/admin/taxonomy";
import { uploadImageFile } from "./editor-utils";

// ---- Category multiselect ---------------------------------------------------
export function CategorySelect({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [custom, setCustom] = useState("");
  const known = new Set(CATEGORY_OPTIONS.map((c) => c.slug));
  const extras = value.filter((v) => !known.has(v));
  const all = [...CATEGORY_OPTIONS.map((c) => c.slug), ...extras];

  function toggle(slug: string) {
    onChange(value.includes(slug) ? value.filter((v) => v !== slug) : [...value, slug]);
  }
  function addCustom() {
    const slug = custom.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (slug && !value.includes(slug)) onChange([...value, slug]);
    setCustom("");
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {all.map((slug) => {
          const on = value.includes(slug);
          return (
            <button
              key={slug}
              type="button"
              onClick={() => toggle(slug)}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                on
                  ? "border-accent bg-accent text-white"
                  : "border-line bg-white text-ink-soft hover:border-accent hover:text-accent"
              }`}
            >
              {categoryLabel(slug)}
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustom())}
          placeholder="Add category…"
          className="flex-1 rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button type="button" onClick={addCustom} className="rounded-lg border border-line px-3 py-1.5 text-sm text-ink-soft hover:bg-slate-50">
          Add
        </button>
      </div>
    </div>
  );
}

// ---- Tag input --------------------------------------------------------------
export function TagInput({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState("");
  function add() {
    const t = input.trim().toLowerCase().replace(/\s+/g, "-");
    if (t && !value.includes(t)) onChange([...value, t]);
    setInput("");
  }
  return (
    <div className="rounded-lg border border-line bg-white p-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded bg-accent-pale px-2 py-0.5 text-xs text-accent">
            {t}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== t))} className="text-accent/60 hover:text-accent" aria-label={`Remove ${t}`}>
              ×
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !input && value.length) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length ? "" : "Add tags (Enter to add)…"}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none"
        />
      </div>
    </div>
  );
}

// ---- Hero image field -------------------------------------------------------
export function HeroField({
  slug,
  hero,
  heroAlt,
  onHero,
  onHeroAlt,
}: {
  slug: string;
  hero: string;
  heroAlt: string;
  onHero: (v: string) => void;
  onHeroAlt: (v: string) => void;
}) {
  const [uploading, setUploading] = useState(false);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const { path, error } = await uploadImageFile(slug, file);
    setUploading(false);
    if (error || !path) alert(error ?? "Upload failed.");
    else onHero(path);
  }

  return (
    <div>
      <div className="overflow-hidden rounded-lg border border-line bg-slate-50">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt={heroAlt || "hero preview"} className="aspect-[16/9] w-full object-cover" />
        ) : (
          <div className="flex aspect-[16/9] items-center justify-center text-xs text-muted">No hero image</div>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <label className="flex-1 cursor-pointer rounded-lg border border-line bg-white px-3 py-1.5 text-center text-sm text-ink-soft hover:bg-slate-50">
          {uploading ? "Uploading…" : hero ? "Replace image" : "Upload image"}
          <input type="file" accept="image/*" hidden onChange={onFile} disabled={uploading} />
        </label>
      </div>
      <input
        value={hero}
        onChange={(e) => onHero(e.target.value)}
        placeholder="/images/blog/{slug}/hero.jpg"
        className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-1.5 font-mono text-xs outline-none focus:border-accent"
      />
      <input
        value={heroAlt}
        onChange={(e) => onHeroAlt(e.target.value)}
        placeholder="Hero alt text (describe the image)"
        className="mt-2 w-full rounded-lg border border-line bg-white px-3 py-1.5 text-sm outline-none focus:border-accent"
      />
    </div>
  );
}

// ---- Google SEO snippet preview --------------------------------------------
export function SeoSnippet({ title, description, slug }: { title: string; description: string; slug: string }) {
  const titleLen = title.length;
  const descLen = description.length;
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Search preview</p>
      <div className="rounded-lg border border-line p-3">
        <div className="text-xs text-emerald-700">russelldsmith.com › blog › {slug || "your-slug"}</div>
        <div className="mt-0.5 truncate text-[18px] leading-snug text-[#1a0dab]">
          {title || "Your post title"}
        </div>
        <div className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-[#4d5156]">
          {description || "Your meta description will appear here — write 120–160 characters that summarize the post."}
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
        <Counter label="Title" len={titleLen} good={[30, 60]} />
        <Counter label="Description" len={descLen} good={[120, 160]} />
      </div>
    </div>
  );
}
function Counter({ label, len, good }: { label: string; len: number; good: [number, number] }) {
  const ok = len >= good[0] && len <= good[1];
  const color = len === 0 ? "text-muted" : ok ? "text-emerald-600" : "text-amber-600";
  return (
    <div className="flex items-center justify-between rounded-lg bg-slate-50 px-2.5 py-1.5">
      <span className="text-muted">{label}</span>
      <span className={color}>
        {len} <span className="text-muted">/ {good[1]}</span>
      </span>
    </div>
  );
}
