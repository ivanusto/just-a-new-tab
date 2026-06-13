#!/usr/bin/env bash
#
# Build distributable theme-pack zips for upload to the download host.
#
# Each theme pack lives in its own top-level folder containing background
# images (bg*.jpg / bg*.png) and a quotes.txt (optionally a metadata.json).
# A pack zip mirrors that folder with the files at the zip ROOT, matching the
# existing packs (e.g. nature_zen.zip, christian_pack.zip) that the in-app
# OFFICIAL_THEMES list downloads and imports.
#
# Folders without any background image are skipped (not ready to publish yet),
# so this can be run safely while new packs are still being assembled.
#
# Usage:
#   ./package-themes.sh                 # package every ready theme folder
#   ./package-themes.sh pets gaming     # package only the named folders
#
# Output: <folder>.zip at the repo root (zips are gitignored).

set -euo pipefail

cd "$(dirname "$0")"

# Folders that are NOT theme packs, even if a stray quotes.txt appears.
NON_PACK=("just-new-tab" "just-new-tab-chrome" "dist" "node_modules")

is_non_pack() {
  local name="$1"
  for n in "${NON_PACK[@]}"; do
    [[ "$name" == "$n" ]] && return 0
  done
  return 1
}

# Decide which folders to process: explicit args, or auto-detect every folder
# that has a quotes.txt.
targets=()
if [[ $# -gt 0 ]]; then
  targets=("$@")
else
  for d in */; do
    d="${d%/}"
    is_non_pack "$d" && continue
    [[ -f "$d/quotes.txt" ]] && targets+=("$d")
  done
fi

if [[ ${#targets[@]} -eq 0 ]]; then
  echo "No theme-pack folders found."
  exit 0
fi

built=0
skipped=0

for pack in "${targets[@]}"; do
  pack="${pack%/}"

  if [[ ! -d "$pack" ]]; then
    echo "  ✗ $pack — folder not found, skipping"
    skipped=$((skipped + 1))
    continue
  fi

  # A pack needs at least one background image to be worth publishing.
  shopt -s nullglob
  images=("$pack"/bg*.jpg "$pack"/bg*.jpeg "$pack"/bg*.png)
  shopt -u nullglob

  if [[ ${#images[@]} -eq 0 ]]; then
    echo "  ⏭  $pack — no background images yet, skipping"
    skipped=$((skipped + 1))
    continue
  fi

  if [[ ! -f "$pack/quotes.txt" ]]; then
    echo "  ⏭  $pack — no quotes.txt, skipping"
    skipped=$((skipped + 1))
    continue
  fi

  out="$pack.zip"
  rm -f "$out"
  # Zip from inside the folder so paths sit at the archive root, excluding junk.
  ( cd "$pack" && zip -r -X "../$out" . -x "*.DS_Store" >/dev/null )
  echo "  ✓ $out ($(unzip -l "$out" | tail -1 | awk '{print $2}') files)"
  built=$((built + 1))
done

echo
echo "Done. Packaged $built, skipped $skipped."
if [[ $built -gt 0 ]]; then
  echo "Upload the new .zip(s) to the download host, then add a matching entry"
  echo "to OFFICIAL_THEMES in just-new-tab/newtab.js and run ./sync.sh."
fi
