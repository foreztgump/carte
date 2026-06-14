#!/usr/bin/env bash
# Grep gates — fail CI if pre-v0.13 / pre-0.18 plugin patterns reappear in plugin source.
#
# Scope: packages/*/src only (excludes tests, harness config, and docs, where some
# of these tokens are legitimate). Each gate is a (pattern, human label) pair plus an
# optional allow-regex for lines that are legitimate uses of an otherwise-banned token.
#
# Acceptance: PRO-848 #3 — zero hits for the obsolete platform surface and
# pre-sandboxed-format vocabulary on the converted plugin family.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
status=0

# Resolve the plugin-source roots once, from the repo root. Fail closed: if the
# glob matches nothing (layout changed, run from the wrong tree), abort rather
# than silently passing — a gate that scans zero files is worse than no gate.
SRC_GLOB="packages/*/src"
SRC_DIRS=()
for d in $SRC_GLOB; do
  [[ -d "$d" ]] && SRC_DIRS+=("$d")
done
if [[ "${#SRC_DIRS[@]}" -eq 0 ]]; then
  echo "::error::grep gate ABORTED — no plugin-source dirs matched '$SRC_GLOB' under $ROOT" >&2
  exit 1
fi

# Banned tokens with no legitimate use anywhere in plugin source.
HARD_BANS=(
  'sandbox-entry'
  'tender:payment'
  'atomicDecrement'
  'putIfAbsent'
  'adminEntry'
  'ctx\.logger'
  'format: "native"'
  'adminPages'
)

# Tokens banned in the plugin sense but with narrow legitimate uses.
# Format: "pattern|||allow-regex" — lines matching the allow-regex are exempt.
SCOPED_BANS=(
  'as never|||\.test\.(ts|tsx):'           # test-only structural casts are allowed
  'trusted|||untrusted'                    # the "untrusted" IP bucket is unrelated to plugin trust
)

report() {
  local label="$1" hits="$2"
  echo "::error::grep gate FAILED — '$label' must not appear in plugin source:"
  echo "$hits"
  status=1
}

for pat in "${HARD_BANS[@]}"; do
  if hits="$(grep -rEn --include='*.ts' --include='*.tsx' "$pat" "${SRC_DIRS[@]}" 2>/dev/null)"; then
    report "$pat" "$hits"
  fi
done

for entry in "${SCOPED_BANS[@]}"; do
  pat="${entry%%|||*}"
  allow="${entry##*|||}"
  if hits="$(grep -rEn --include='*.ts' --include='*.tsx' "$pat" "${SRC_DIRS[@]}" 2>/dev/null | grep -Ev "$allow")"; then
    report "$pat (excluding /$allow/)" "$hits"
  fi
done

if [[ "$status" -eq 0 ]]; then
  echo "All grep gates green — no obsolete plugin patterns in $SRC_GLOB."
fi
exit "$status"
