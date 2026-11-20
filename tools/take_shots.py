"""Takes this entry's screenshots with headless Chromium (Playwright):
- export scenes open the ?shot=cover page, press EXPORT, and keep the real PNG
  the app wrote, shrunk to the gate limits with Pillow;
- the editor scene screenshots the live editor page with scenes loaded.
Scenes come from shots.json; files land in screenshots/."""
import json
import os
import subprocess
import sys
import time

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = os.path.expanduser("~/workspace/makefun/entries/zech-gta6cover")
PORT = 8080
BASE = f"http://localhost:{PORT}/index.html"
TMP = "/tmp/zech-gta6-shots"
os.makedirs(TMP, exist_ok=True)

# name -> (long side max, short side max) after scaling.
LIMITS = {
    "1-cover.jpg": (1280, 720),
    "2-editor.jpg": (1280, 1280),
    "3-cover.jpg": (1024, 1280),
    "4-cover-square.jpg": (1024, 1024),
}


def save_jpeg(src_path, dst_path, max_w, max_h):
    """Shrinks an image to the limits and saves it as a JPEG under 256 KiB."""
    img = Image.open(src_path).convert("RGB")
    img.thumbnail((max_w, max_h), Image.LANCZOS)
    quality = 88
    for quality in (88, 82, 75, 68):
        img.save(dst_path, "JPEG", quality=quality, optimize=True)
        if os.path.getsize(dst_path) <= 256 * 1024:
            break
    final = Image.open(dst_path)
    print(f"{os.path.basename(dst_path)}: {final.size[0]}x{final.size[1]} "
          f"{os.path.getsize(dst_path)} bytes (q={quality})")
    assert os.path.getsize(dst_path) <= 256 * 1024, "over 256 KiB"
    assert max(final.size) <= 1280 and min(final.size) >= 480, "size gate"


def shoot_scene(page, scene):
    """Opens one scene and returns when the app signals it is painted."""
    page.goto(BASE + scene["query"])
    page.wait_for_function("window.__shotReady === true", timeout=20000)
    page.wait_for_timeout(400)


def main():
    with open(os.path.join(ROOT, "shots.json")) as f:
        scenes = json.load(f)
    server = subprocess.Popen(
        ["node", "serve.ts", "--port", str(PORT)],
        cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        time.sleep(2)
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            for scene in scenes:
                name = scene["name"]
                print(f"scene {name}: {scene['query']}")
                page = browser.new_page(viewport={"width": scene["w"], "height": scene["h"]})
                page.on("console", lambda m: print(f"  console [{m.type}]: {m.text}") if m.type in ("error", "warning") else None)
                page.on("pageerror", lambda e: print(f"  pageerror: {e}"))
                shoot_scene(page, scene)
                max_w, max_h = LIMITS[name]
                if scene.get("export"):
                    with page.expect_download(timeout=15000) as dl:
                        page.evaluate("document.getElementById('export').click()")
                    download = dl.value
                    raw = os.path.join(TMP, download.suggested_filename)
                    download.save_as(raw)
                    print(f"{name}: exported {download.suggested_filename} "
                          f"{os.path.getsize(raw)} bytes")
                    save_jpeg(raw, os.path.join(ROOT, "screenshots", name), max_w, max_h)
                else:
                    shot = os.path.join(TMP, name)
                    # Full page: the controls column is taller than the viewport.
                    page.screenshot(path=shot, full_page=True)
                    save_jpeg(shot, os.path.join(ROOT, "screenshots", name), max_w, max_h)
                page.close()
            browser.close()
    finally:
        server.terminate()
        server.wait(timeout=10)


if __name__ == "__main__":
    main()
    print("OK")
