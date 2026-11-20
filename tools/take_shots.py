#!/usr/bin/env python3
"""Render the four bounty screenshots with headless Chromium + PIL.

Each shot loads app/index.html with a ?shot= mode, captures a PNG with
headless Chromium, then converts it to a JPEG inside the bounty limits
(long side <= 1280 px, short side >= 480 px, <= 256 KiB).

Usage: python3 tools/take_shots.py   (run from the repo root)
"""

import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

from PIL import Image

REPO = Path(__file__).resolve().parent.parent
OUT = REPO / "screenshots"
PORT = 8471
BASE_URL = f"http://127.0.0.1:{PORT}/app/index.html"

# (mode, file, window width, window height)
SHOTS = [
    ("cover", "1-cover.jpg", 1280, 720),
    ("editor", "2-editor.jpg", 1280, 800),
    ("cover2", "3-cover.jpg", 1280, 720),
    ("square", "4-cover-square.jpg", 1024, 1024),
]

MAX_BYTES = 256 * 1024


def capture(url, width, height, png_path):
    """Screenshot with Playwright: the plain --screenshot flag crops the
    page in this environment, while Playwright captures the viewport."""
    from playwright.sync_api import sync_playwright
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": width, "height": height})
        page.goto(url)
        page.wait_for_timeout(700)
        page.screenshot(path=str(png_path))
        browser.close()


def to_jpeg(png_path, jpg_path):
    with Image.open(png_path) as img:
        img = img.convert("RGB")
        if max(img.size) > 1280:
            img.thumbnail((1280, 1280), Image.LANCZOS)
        quality = 88
        while quality >= 55:
            img.save(jpg_path, "JPEG", quality=quality, optimize=True)
            if jpg_path.stat().st_size <= MAX_BYTES:
                return
            quality -= 8
        raise SystemExit(f"{jpg_path.name} still over 256 KiB at quality 55")


def start_server():
    """Serve the repo over plain HTTP: ES modules are blocked from file://."""
    proc = subprocess.Popen(
        [sys.executable, "-m", "http.server", str(PORT), "--bind", "127.0.0.1"],
        cwd=REPO, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    deadline = time.time() + 15
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(BASE_URL, timeout=2) as resp:
                if resp.status == 200:
                    return proc
        except Exception:
            time.sleep(0.2)
    proc.kill()
    raise SystemExit("local HTTP server did not come up")


def main():
    OUT.mkdir(exist_ok=True)
    server = start_server()
    try:
        with tempfile.TemporaryDirectory() as tmp:
            for mode, name, width, height in SHOTS:
                png = Path(tmp) / f"{mode}.png"
                capture(f"{BASE_URL}?shot={mode}", width, height, png)
                jpg = OUT / name
                to_jpeg(png, jpg)
                with Image.open(jpg) as img:
                    print(f"{name}: {img.size[0]}x{img.size[1]} "
                          f"{jpg.stat().st_size} bytes")
    finally:
        server.terminate()
        server.wait(timeout=10)
    print("done")


if __name__ == "__main__":
    sys.exit(main())
