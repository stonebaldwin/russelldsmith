#!/usr/bin/env bash
#
# Guided setup for the CMS secrets. Run it once:
#
#     bash scripts/setup-cms-secrets.sh
#
# It sets the 3 Cloudflare Worker secrets (so the CMS runs + can commit) and the
# 2 GitHub Actions secrets (so saves deploy). You paste the sensitive values when
# prompted — they are piped straight to `wrangler`/`gh` and never printed or
# saved to disk.
#
# Prereqs: `wrangler login` (with Workers scope) and `gh auth login` already done.

set -euo pipefail
cd "$(dirname "$0")/.."

bold() { printf "\033[1m%s\033[0m\n" "$1"; }
ok() { printf "\033[32m✓ %s\033[0m\n" "$1"; }
warn() { printf "\033[33m! %s\033[0m\n" "$1"; }

bold "Russell Smith CMS — secret setup"
echo

# ---- prerequisite checks ----------------------------------------------------
command -v npx >/dev/null || { echo "npx not found (install Node 22+)"; exit 1; }
command -v gh  >/dev/null || { echo "GitHub CLI 'gh' not found: https://cli.github.com"; exit 1; }

if ! gh auth status >/dev/null 2>&1; then
  echo "Run 'gh auth login' first (needs repo + workflow scopes)."; exit 1
fi
ok "GitHub CLI authenticated"

echo "Checking Cloudflare (wrangler) login…"
if ! npx wrangler whoami >/dev/null 2>&1; then
  warn "Not logged in to Cloudflare. Running 'wrangler login' (a browser will open)…"
  npx wrangler login
fi
ok "Cloudflare authenticated"
echo
warn "If any 'wrangler secret put' below fails with a permissions/scope error,"
warn "run 'npx wrangler login' to refresh scopes (needs Workers Scripts: Edit), then re-run this."
echo

# ---- 1. Cloudflare Worker secrets (the running CMS) -------------------------
bold "1/2 · Cloudflare Worker secrets"

# SESSION_SECRET is generated for you.
SESSION_SECRET="$(openssl rand -hex 32)"
printf '%s' "$SESSION_SECRET" | npx wrangler secret put SESSION_SECRET
ok "SESSION_SECRET set (auto-generated)"

echo
echo "Choose the password Russell will type to sign in at /admin."
read -rsp "  ADMIN_PASSWORD: " ADMIN_PASSWORD; echo
[ -n "$ADMIN_PASSWORD" ] || { echo "empty password — aborting"; exit 1; }
printf '%s' "$ADMIN_PASSWORD" | npx wrangler secret put ADMIN_PASSWORD
ok "ADMIN_PASSWORD set"
unset ADMIN_PASSWORD

echo
echo "Paste a GitHub fine-grained token with this repo's Contents: Read and write."
echo "  (Create at github.com → Settings → Developer settings → Fine-grained tokens)"
read -rsp "  GITHUB_TOKEN: " GH_TOKEN; echo
[ -n "$GH_TOKEN" ] || { echo "empty token — aborting"; exit 1; }
printf '%s' "$GH_TOKEN" | npx wrangler secret put GITHUB_TOKEN
ok "GITHUB_TOKEN set"
unset GH_TOKEN

# ---- 2. GitHub Actions secrets (the deploy) ---------------------------------
echo
bold "2/2 · GitHub Actions secrets (for the deploy workflow)"

# Account id is not sensitive; default to the logged-in account.
ACCOUNT_ID="$(npx wrangler whoami 2>/dev/null | grep -oE '[0-9a-f]{32}' | head -1 || true)"
if [ -n "$ACCOUNT_ID" ]; then
  printf '%s' "$ACCOUNT_ID" | gh secret set CLOUDFLARE_ACCOUNT_ID
  ok "CLOUDFLARE_ACCOUNT_ID set ($ACCOUNT_ID)"
else
  warn "Couldn't auto-detect account id; set it manually: gh secret set CLOUDFLARE_ACCOUNT_ID"
fi

echo
echo "Create a Cloudflare API token (template: 'Edit Cloudflare Workers') at"
echo "  dash.cloudflare.com → My Profile → API Tokens, then paste it here."
read -rsp "  CLOUDFLARE_API_TOKEN: " CF_TOKEN; echo
[ -n "$CF_TOKEN" ] || { echo "empty token — aborting"; exit 1; }
printf '%s' "$CF_TOKEN" | gh secret set CLOUDFLARE_API_TOKEN
ok "CLOUDFLARE_API_TOKEN set"
unset CF_TOKEN

echo
bold "Done!"
echo "Next: push anything to main (or re-run the failed Actions run) and the site"
echo "will build + deploy. Then sign in at https://russelldsmith.com/admin"
echo "(or your Worker URL) with the ADMIN_PASSWORD you chose."
