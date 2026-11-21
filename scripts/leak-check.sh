#!/usr/bin/env bash
# Scan the working tree and git history for secrets and private patterns.
# Exits 1 if anything is found. Safe to run from any cwd; it locates the repo root.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RED=$'\033[31m'
GRN=$'\033[32m'
YEL=$'\033[33m'
RST=$'\033[0m'
FAIL=0
HITS=0

PRIVATE_DENYLIST="${AMC_PRIVATE_DENYLIST:-/workspace/amc-private-denylist.txt}"
GENERIC_DENYLIST="$ROOT/scripts/denylist.txt"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

# Collect unique regex patterns from the denylist files (skip comments/blank).
patterns="$tmp/patterns.txt"
: > "$patterns"
for f in "$GENERIC_DENYLIST" "$PRIVATE_DENYLIST"; do
  if [[ -f "$f" ]]; then
    echo "${YEL}Using denylist:${RST} $f" >&2
    # strip comments and blank lines
    sed -e 's/#.*$//' -e '/^[[:space:]]*$/d' "$f" >> "$patterns"
  else
    if [[ "$f" == "$PRIVATE_DENYLIST" ]]; then
      echo "${YEL}No private denylist at $f (set AMC_PRIVATE_DENYLIST to override). Generic patterns only.${RST}" >&2
    fi
  fi
done

# Text files in the working tree (not gitignored). Skip binary-looking files by extension.
list_text_files() {
  if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    git ls-files -c -o --exclude-standard
  else
    find . -type f -not -path './.git/*'
  fi | sed 's|^\./||' | grep -Ev '\.(png|jpg|jpeg|gif|webp|pdf|ico|woff2?|zip|gz|tgz|bin)$' \
    | grep -Ev '(^|/)?scripts/denylist\.txt$|(^|/)amc-private-denylist\.txt$' || true
}

scan_file() {
  local file="$1"
  local source="$2"
  [[ -f "$file" || "$source" == "history" ]] || return 0
  # For history, $file is a patch dump path
  if [[ ! -s "$patterns" ]]; then
    return 0
  fi
  # grep -E each pattern; collect hits
  local pat
  while IFS= read -r pat; do
    [[ -n "$pat" ]] || continue
    if grep -n -E -i -e "$pat" -- "$file" >/dev/null 2>&1; then
      local lines
      lines="$(grep -n -E -i -e "$pat" -- "$file" | head -n 20 || true)"
      if [[ -n "$lines" ]]; then
        echo "${RED}HIT${RST}  pattern=${pat}  source=${source}  file=${file}"
        echo "$lines" | sed 's/^/    /'
        HITS=$((HITS + 1))
        FAIL=1
      fi
    fi
  done < "$patterns"
}

echo "=== Custom denylist: working tree ==="
while IFS= read -r f; do
  [[ -n "$f" ]] || continue
  scan_file "$f" "tree"
done < <(list_text_files)

# Strings from screenshots / images, so compressed binary can't hide a name
echo "=== Custom denylist: strings in images ==="
if command -v python3 >/dev/null 2>&1; then
  set +e
  python3 "$ROOT/scripts/scan-images.py" "$patterns" "$ROOT"
  img_status=$?
  set -e
  if [[ $img_status -ne 0 ]]; then
    FAIL=1
    HITS=$((HITS + 1))
  fi
fi

echo "=== Custom denylist: git history ==="
if git rev-parse --is-inside-work-tree >/dev/null 2>&1 && [[ -n "$(git log --oneline -1 2>/dev/null || true)" ]]; then
  git log -p --all --full-history -- . ":(exclude)scripts/denylist.txt" ":(exclude)amc-private-denylist.txt" > "$tmp/history.patch" 2>/dev/null || true
  if [[ -s "$tmp/history.patch" ]]; then
    scan_file "$tmp/history.patch" "history"
  fi
else
  echo "No git history yet, skipped."
fi

echo "=== gitleaks ==="
if command -v gitleaks >/dev/null 2>&1; then
  if [[ -d "$ROOT/.git" ]]; then
    if ! gitleaks detect --source "$ROOT" --no-banner --redact --exit-code 1; then
      echo "${RED}gitleaks reported findings${RST}"
      FAIL=1
    else
      echo "${GRN}gitleaks clean${RST}"
    fi
  else
    if ! gitleaks detect --no-git --source "$ROOT" --no-banner --redact --exit-code 1; then
      echo "${RED}gitleaks reported findings${RST}"
      FAIL=1
    else
      echo "${GRN}gitleaks clean${RST}"
    fi
  fi
else
  echo "${YEL}gitleaks not installed, skipped${RST}"
fi

echo "=== trufflehog ==="
if command -v trufflehog >/dev/null 2>&1; then
  if [[ -d "$ROOT/.git" ]]; then
    if ! trufflehog git "file://$ROOT" --no-update --fail 2>&1; then
      echo "${RED}trufflehog reported findings${RST}"
      FAIL=1
    else
      echo "${GRN}trufflehog clean${RST}"
    fi
  else
    if ! trufflehog filesystem "$ROOT" --no-update --fail 2>&1; then
      echo "${RED}trufflehog reported findings${RST}"
      FAIL=1
    else
      echo "${GRN}trufflehog clean${RST}"
    fi
  fi
else
  echo "${YEL}trufflehog not installed, skipped${RST}"
fi

# Confirm example data and the embedded block stay in sync
echo "=== example.json ↔ index.html ==="
if python3 - << 'PY'
import json, re, pathlib, sys
root = pathlib.Path(".")
html = (root / "index.html").read_text()
m = re.search(r'<script type="application/json" id="amc-data">\s*(.*?)\s*</script>', html, re.S)
if not m:
    print("embedded #amc-data block missing from index.html")
    sys.exit(1)
a = json.loads(m.group(1))
b = json.loads((root / "data/example.json").read_text())
if a != b:
    print("data/example.json and the embedded block in index.html differ")
    sys.exit(1)
if not a.get("meta", {}).get("example"):
    print("meta.example is not true")
    sys.exit(1)
print("embedded JSON matches data/example.json")
PY
then
  echo "${GRN}data sync clean${RST}"
else
  FAIL=1
fi

if [[ $FAIL -ne 0 ]]; then
  echo "${RED}LEAK CHECK FAILED${RST} (${HITS} custom-pattern hit groups; see above)"
  exit 1
fi
echo "${GRN}LEAK CHECK PASSED${RST}"
exit 0
