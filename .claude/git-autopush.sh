#!/usr/bin/env bash
# Auto-commit + push after each Claude Code turn (Linux/Remote-SSH).
# Pushes code changes to GitHub -> Lovable auto-deploys. Never commits .env.
cd /srv/projects/workforce-crm 2>/dev/null || exit 0

# Stage everything except local-only .env (server-node.mjs/package-lock.json are gitignored).
git add -A -- ':!.env' 2>/dev/null

# Nothing staged => nothing to do (silent, no empty commits).
if git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

git commit -m "Auto-commit via Claude Code" >/dev/null 2>&1

# Push; if rejected (Lovable pushed meanwhile), rebase and retry once.
if git push origin main >/dev/null 2>&1; then
  echo '{"systemMessage":"✅ Auto-pushed to GitHub → Lovable is deploying (~1-2 min)"}'
elif git pull --rebase origin main >/dev/null 2>&1 && git push origin main >/dev/null 2>&1; then
  echo '{"systemMessage":"✅ Auto-pushed (after sync) → Lovable is deploying (~1-2 min)"}'
else
  echo '{"systemMessage":"⚠️ Auto-push failed — run git push manually or check conflicts"}'
fi
exit 0
