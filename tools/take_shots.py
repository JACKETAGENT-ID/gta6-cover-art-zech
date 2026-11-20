#!/usr/bin/env python3
"""Take the entry's screenshots with headless Chromium.

Reads shots.json next to the repository root, serves app/ with the
kit's own serve.ts, opens each ?shot= scene at its viewport size and
writes the screenshot into screenshots/. Nothing is committed by this
script except the four JPEGs it writes there; the script itself lives
in tools/ as documentation of how the shots were made.

Usage: python3 tools/take_shots.py [--port 8091]
"""
import argparse
import json
import os
import subprocess
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS = os.path.join(ROOT, "shots.json")
OUTDIR = os.path.join(ROOT, "screenshots")


def serve(port):
    proc = subprocess.Popen(
        ["node", "serve.ts", "--port", str(port)],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    return proc


def shoot(port):
    from playwright.sync_api import sync_playwright

    with open(SHOTS, encoding="utf-8") as fh:
        scenes = json.load(fh)
    os.makedirs(OUTDIR, exist_ok=True)
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        for scene in scenes:
            page = browser.new_page(viewport={"width": scene["w"], "height": scene["h"]})
            errors = []
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))
            page.goto(f"http://127.0.0.1:{port}/{scene['query']}", wait_until="networkidle")
            page.wait_for_timeout(900)
            target = os.path.join(OUTDIR, scene["name"])
            page.screenshot(path=target, type="jpeg", quality=88)
            size = os.path.getsize(target)
            print(f"{scene['name']}: {scene['w']}x{scene['h']} {size} bytes"
                  + (f"  CONSOLE ERRORS: {errors}" if errors else ""))
            page.close()
        browser.close()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8091)
    args = ap.parse_args()
    server = serve(args.port)
    try:
        for _ in range(30):
            try:
                import urllib.request
                urllib.request.urlopen(f"http://127.0.0.1:{args.port}/", timeout=1)
                break
            except Exception:
                time.sleep(0.2)
        shoot(args.port)
    finally:
        server.terminate()
        server.wait(timeout=5)


if __name__ == "__main__":
    sys.exit(main())
