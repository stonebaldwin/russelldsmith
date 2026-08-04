"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/admin");
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Incorrect password.");
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-xl border border-line bg-white p-6 shadow-sm">
      <label htmlFor="password" className="block text-sm font-medium text-ink">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoFocus
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={disabled || loading}
        className="mt-1.5 w-full rounded-lg border border-line-strong bg-white px-3 py-2 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        placeholder="••••••••••"
      />
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={disabled || loading || !password}
        className="mt-5 w-full rounded-lg bg-accent px-4 py-2.5 font-medium text-white transition hover:bg-accent-deep disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
