"use client";

import { useRef, useState, type RefObject } from "react";

interface Props {
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  value: string;
  setValue: (v: string) => void;
  slug: string;
}

export function MarkdownToolbar({ textareaRef, value, setValue, slug }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  function apply(fn: (ta: HTMLTextAreaElement) => { value: string; start: number; end: number }) {
    const ta = textareaRef.current;
    if (!ta) return;
    const next = fn(ta);
    setValue(next.value);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(next.start, next.end);
    });
  }

  const wrap = (before: string, after = before) =>
    apply((ta) => {
      const { selectionStart: s, selectionEnd: e } = ta;
      const sel = value.slice(s, e) || "text";
      const v = value.slice(0, s) + before + sel + after + value.slice(e);
      return { value: v, start: s + before.length, end: s + before.length + sel.length };
    });

  const linePrefix = (prefix: string) =>
    apply((ta) => {
      const { selectionStart: s, selectionEnd: e } = ta;
      const lineStart = value.lastIndexOf("\n", s - 1) + 1;
      const block = value.slice(lineStart, e);
      const prefixed = block
        .split("\n")
        .map((l) => (l.startsWith(prefix) ? l : prefix + l))
        .join("\n");
      const v = value.slice(0, lineStart) + prefixed + value.slice(e);
      return { value: v, start: lineStart, end: lineStart + prefixed.length };
    });

  const insert = (text: string, caretBack = 0) =>
    apply((ta) => {
      const { selectionStart: s } = ta;
      const v = value.slice(0, s) + text + value.slice(s);
      const pos = s + text.length - caretBack;
      return { value: v, start: pos, end: pos };
    });

  const link = () =>
    apply((ta) => {
      const { selectionStart: s, selectionEnd: e } = ta;
      const sel = value.slice(s, e) || "link text";
      const snippet = `[${sel}](https://)`;
      const v = value.slice(0, s) + snippet + value.slice(e);
      // place caret inside the url
      const pos = s + snippet.length - 1;
      return { value: v, start: pos, end: pos };
    });

  const table = () =>
    insert(
      "\n| Column | Column |\n| --- | --- |\n| Cell | Cell |\n| Cell | Cell |\n\n",
    );

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!slug) {
      alert("Set the post slug first (top of the form) so images can be filed under it.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readAsDataURL(file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slug, filename: file.name, dataUrl }),
      });
      const data = (await res.json()) as { path?: string; error?: string };
      if (!res.ok || !data.path) {
        alert(data.error ?? "Upload failed.");
        return;
      }
      const alt = file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
      insert(`\n![${alt}](${data.path})\n`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-line bg-slate-50 px-2 py-1.5">
      <Btn onClick={() => linePrefix("## ")} label="Heading 2" mono>
        H2
      </Btn>
      <Btn onClick={() => linePrefix("### ")} label="Heading 3" mono>
        H3
      </Btn>
      <Sep />
      <Btn onClick={() => wrap("**")} label="Bold">
        <b>B</b>
      </Btn>
      <Btn onClick={() => wrap("_")} label="Italic">
        <i>I</i>
      </Btn>
      <Btn onClick={() => wrap("`")} label="Inline code" mono>
        {"</>"}
      </Btn>
      <Sep />
      <Btn onClick={() => linePrefix("- ")} label="Bullet list">
        • ―
      </Btn>
      <Btn onClick={() => linePrefix("1. ")} label="Numbered list" mono>
        1.
      </Btn>
      <Btn onClick={() => linePrefix("> ")} label="Quote">
        ❝
      </Btn>
      <Sep />
      <Btn onClick={link} label="Link">
        🔗
      </Btn>
      <Btn onClick={table} label="Table">
        ▦
      </Btn>
      <Btn onClick={() => insert("\n---\n")} label="Divider" mono>
        ―
      </Btn>
      <Sep />
      <Btn onClick={() => fileRef.current?.click()} label="Upload image" disabled={uploading}>
        {uploading ? "…" : "🖼"}
      </Btn>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
    </div>
  );
}

function Btn({
  onClick,
  label,
  children,
  mono,
  disabled,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
  mono?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`flex h-8 min-w-8 items-center justify-center rounded px-2 text-sm text-ink-soft transition hover:bg-white hover:text-accent disabled:opacity-40 ${
        mono ? "font-mono text-xs" : ""
      }`}
    >
      {children}
    </button>
  );
}
function Sep() {
  return <span className="mx-1 h-5 w-px bg-line" />;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
