#!/usr/bin/env python3
"""Build store-ready packages on Windows (the bundled package.sh needs `zip`,
which isn't available here). Chrome -> .zip, Firefox -> .xpi. manifest.json at
root; *.md and OS junk excluded. Mirrors the exclusion rules in package.sh."""
import json
import os
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
version = json.loads((ROOT / "just-new-tab" / "manifest.json").read_text(encoding="utf-8"))["version"]

dist = ROOT / "dist"
if dist.exists():
    shutil.rmtree(dist)
dist.mkdir()


def skip(rel: str) -> bool:
    base = os.path.basename(rel)
    if base in (".DS_Store", "Thumbs.db", "desktop.ini"):
        return True
    return rel.lower().endswith(".md")


def build(src_name: str, out_name: str) -> Path:
    src = ROOT / src_name
    out = dist / out_name
    count = 0
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as z:
        for path in sorted(src.rglob("*")):
            if path.is_dir():
                continue
            rel = path.relative_to(src).as_posix()
            if skip(rel):
                continue
            z.write(path, rel)
            count += 1
    print(f"  {out.relative_to(ROOT)}  ({count} files, {out.stat().st_size / 1024:.0f} KB)")
    return out


print(f"Packaging v{version} ...")
build("just-new-tab-chrome", f"just-a-new-tab-chrome-v{version}.zip")
ff = build("just-new-tab", f"just-a-new-tab-firefox-v{version}.xpi")

with zipfile.ZipFile(ff) as z:
    names = z.namelist()
    assert "manifest.json" in names, "manifest.json not at root!"
    assert not any(n.lower().endswith(".md") for n in names), "md leaked into package"
    assert "newtab.js" in names and "db.js" in names
print("Sanity OK: root manifest.json present, .md excluded.")
