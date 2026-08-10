#!/usr/bin/env bash
# Copy Coach Studio boceto JPGs into the ARMATUS mobile assets folder.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/public/bocetos"
DEST="$(cd "$ROOT/../ARMATUS/mobile/assets/bocetos" && pwd)"
rsync -av --include='*.jpg' --exclude='*' "$SRC/" "$DEST/"
echo "Synced bocetos → $DEST"
