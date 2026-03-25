#!/usr/bin/env bash
set -euo pipefail
export GIT_TERMINAL_PROMPT=0
export GIT_ASKPASS=true

ROOT="/Users/anwarito/Desktop/conversioncraft5"
SOURCES_DIR="$ROOT/tools/sources"
mkdir -p "$SOURCES_DIR"

repos=(
  "https://github.com/Anwarito-lbd/conversion.craft-.git conversion.craft-"
  "https://github.com/Anwarito-lbd/conversioncraft.git conversioncraft"
  "https://github.com/Anwarito-lbd/conversion-craft-.git conversion-craft-"
)

echo "[1/3] Cloning/updating source repositories..."
for item in "${repos[@]}"; do
  url="${item%% *}"
  dir="${item##* }"
  target="$SOURCES_DIR/$dir"

  if [[ -d "$target/.git" ]]; then
    echo "- update $dir"
    git -C "$target" fetch --all --prune || true
    git -C "$target" pull --ff-only || true
  else
    echo "- clone $dir"
    git clone "$url" "$target"
  fi
done

echo "[2/3] Comparing source trees against unified repo..."
for dir in conversion.craft- conversioncraft conversion-craft-; do
  if [[ -d "$SOURCES_DIR/$dir" ]]; then
    echo "\n=== diff report: $dir ==="
    diff -qr \
      -x .git \
      -x __pycache__ \
      -x node_modules \
      -x venv \
      -x .next \
      -x '*.pyc' \
      "$SOURCES_DIR/$dir" "$ROOT" | head -n 120 || true
  fi
done

echo "[3/3] Done."
