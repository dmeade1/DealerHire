#!/usr/bin/env bash
# Local mirror of .github/workflows/ci.yml for G1-01 evidence when hosted runners are unavailable.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
OUT="$ROOT/artifacts/ci-local"
mkdir -p "$OUT"

{
  echo "started_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "git_sha=$(git rev-parse HEAD)"
  echo "git_branch=$(git rev-parse --abbrev-ref HEAD)"
  echo "node=$(node -v)"
  echo "pnpm=$(pnpm -v)"
} >"$OUT/provenance.txt"

pnpm install --frozen-lockfile
pnpm verify
pnpm scan:pii
pnpm audit --audit-level=high || true
pnpm sbom
cp -f artifacts/sbom.cdx.json "$OUT/sbom.cdx.json" 2>/dev/null || true

if [[ -n "${DATABASE_URL_ADMIN:-${DATABASE_URL:-}}" ]]; then
  pnpm db:migrate
  pnpm test:integration
  echo "integration=pass" >>"$OUT/provenance.txt"
else
  echo "integration=skipped_no_database_url" >>"$OUT/provenance.txt"
fi

echo "finished_at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" >>"$OUT/provenance.txt"
echo "OK ci-local evidence in $OUT"
cat "$OUT/provenance.txt"
