#!/usr/bin/env bash
# Install a pre-push hook that runs scripts/leak-check.sh and blocks the push on failure.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Not a git repository. Run git init first."
  exit 1
fi
HOOK_DIR="$(git rev-parse --git-path hooks)"
mkdir -p "$HOOK_DIR"
cat > "$HOOK_DIR/pre-push" << 'HOOK'
#!/usr/bin/env bash
set -euo pipefail
ROOT="$(git rev-parse --show-toplevel)"
echo "Running leak-check before push…"
exec "$ROOT/scripts/leak-check.sh"
HOOK
chmod +x "$HOOK_DIR/pre-push"
echo "Installed pre-push hook at $HOOK_DIR/pre-push"
echo "It runs scripts/leak-check.sh and blocks the push if anything is flagged."
