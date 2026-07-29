#!/usr/bin/env bash
# After an implementation pass leaves code changes, auto-request a Ponytail Full audit.
set -euo pipefail

input=$(cat)
status=$(printf '%s' "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('status',''))" 2>/dev/null || echo "")
loop_count=$(printf '%s' "$input" | python3 -c "import sys,json; print(json.load(sys.stdin).get('loop_count',0))" 2>/dev/null || echo "0")

if [[ "$status" != "completed" ]] || [[ "${loop_count:-0}" -gt 0 ]]; then
  printf '%s\n' '{}'
  exit 0
fi

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  printf '%s\n' '{}'
  exit 0
fi

# Only trigger when this turn left meaningful product/test/schema changes.
changed=$(
  {
    git diff --name-only
    git diff --cached --name-only
    git ls-files --others --exclude-standard
  } 2>/dev/null | grep -E '^(src/|db/|tests/|scripts/|package\.json|eslint\.config\.|next\.config\.|wrangler\.|docker-compose\.yml|\.github/)' || true
)

if [[ -z "$changed" ]]; then
  printf '%s\n' '{}'
  exit 0
fi

python3 - <<'PY'
import json
print(json.dumps({
  "followup_message": (
    "Ponytail Full audit now for the pass just completed: hard-floor scorecard "
    "(Pass/Partial/Fail with paths), Ponytail smells, regressions introduced, "
    "and ranked next P0/P1 (max 5). Do not start new feature work unless a hard floor fails."
  )
}))
PY
