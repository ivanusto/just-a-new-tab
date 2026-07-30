#!/usr/bin/env bash
#
# Sync shared files from the Firefox folder (source of truth) to the Chrome folder.
# Everything is shared EXCEPT manifest.json, which is maintained separately per browser.
#
# Usage: ./sync.sh
#
set -e

cd "$(dirname "$0")"

SRC="just-new-tab"
DST="just-new-tab-chrome"

# Shared top-level files (manifest.json and store_description.md deliberately
# excluded — both are maintained separately per browser)
SHARED_FILES=(
  newtab.html
  newtab.css
  newtab.js
  db.js
  privacy_policy.md
)

for f in "${SHARED_FILES[@]}"; do
  cp "$SRC/$f" "$DST/$f"
done

# Shared directories
rsync -a --delete "$SRC/_locales/" "$DST/_locales/"
rsync -a --delete "$SRC/images/"   "$DST/images/"
rsync -a --delete "$SRC/icons/"    "$DST/icons/"
rsync -a --delete "$SRC/js/"       "$DST/js/"

echo "Synced shared files: $SRC -> $DST (manifest.json left untouched)."
