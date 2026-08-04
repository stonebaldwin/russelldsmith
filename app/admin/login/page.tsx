import { redirect } from "next/navigation";
import { isAuthed } from "@/lib/admin/session";
import { adminConfig } from "@/lib/admin/env";
import { LoginForm } from "@/components/admin/LoginForm";

export default async function LoginPage() {
  if (await isAuthed()) redirect("/admin");
  const cfg = adminConfig();
  const missing = cfg.ok ? [] : cfg.missing;

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-lg font-bold text-white">
            RS
          </div>
          <h1 className="text-xl font-semibold text-ink">Russell Smith CMS</h1>
          <p className="mt-1 text-sm text-muted">Sign in to manage the blog</p>
        </div>

        {missing.length > 0 ? (
          <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Server not fully configured</p>
            <p className="mt-1">
              Missing secret{missing.length > 1 ? "s" : ""}:{" "}
              <code className="font-mono">{missing.join(", ")}</code>. Add{" "}
              {missing.length > 1 ? "them" : "it"} to <code>.dev.vars</code> (local) or via{" "}
              <code>wrangler secret put</code> (production).
            </p>
          </div>
        ) : null}

        <LoginForm disabled={missing.length > 0} />
      </div>
    </div>
  );
}
