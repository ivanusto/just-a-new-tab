#!/usr/bin/env bash
#
# Build store-ready zips for Chrome Web Store and Mozilla AMO.
# Each zip has manifest.json at its ROOT (required by both stores).
# Listing-only docs (*.md) and OS junk are excluded from the package.
#
# Usage: ./package.sh
# Output: dist/just-a-new-tab-chrome-v<version>.zip
#         dist/just-a-new-tab-firefox-v<version>.zip
#
set -euo pipefail

cd "$(dirname "$0")"

# Keep the two folders in sync first (Firefox folder is the source of truth).
./sync.sh

VERSION=$(python3 -c "import json; print(json.load(open('just-new-tab/manifest.json'))['version'])")
DIST="dist"
rm -rf "$DIST"
mkdir -p "$DIST"

# Files/patterns to exclude from every package
EXCLUDES=( -x "*.DS_Store" -x "*/.DS_Store" -x "*.md" -x "privacy_policy.md" -x "store_description.md" )

build() {
  local src="$1" out="$2"
  ( cd "$src" && zip -r -X "../$DIST/$out" . "${EXCLUDES[@]}" >/dev/null )
  echo "  $DIST/$out"
}

echo "Packaging v$VERSION ..."
build "just-new-tab-chrome" "just-a-new-tab-chrome-v${VERSION}.zip"
build "just-new-tab"        "just-a-new-tab-firefox-v${VERSION}.zip"

echo "Done."
echo
echo "Contents check (Chrome):"
unzip -l "$DIST/just-a-new-tab-chrome-v${VERSION}.zip" | awk 'NR>3 {print "  "$4}' | sed '/^  $/d'
