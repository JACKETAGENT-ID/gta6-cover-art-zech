"""Takes the entry's screenshots: serves app/ locally, opens each scene
from shots.json in headless Chromium, waits until the app reports itself
ready, and saves a JPEG into screenshots/.

Usage (from the repository root):
    python3 tools/take_shots.py [--port 8903] [--quality 82]

Each shot is checked against the bounty limits (long side at most 1280,
short side at least 480, at most 256 KiB) and the script exits non-zero
if one breaks them. Nothing is written anywhere except screenshots/.
"""

import argparse
import json
import os
import subprocess
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SHOTS_FILE = os.path.join(HERE, "shots.json")
SHOTS_DIR = os.path.join(HERE, "screenshots")


def wait_for_server(url, timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.5)
    return False


def check_shot(path, width, height):
    problems = []
    size = os.path.getsize(path)
    if size > 262144:
        problems.append(f"over 256 KiB ({size} bytes)")
    if max(width, height) > 1280:
        problems.append(f"long side {max(width, height)} over 1280")
    if min(width, height) < 480:
        problems.append(f"short side {min(width, height)} under 480")
    return problems


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8903)
    parser.add_argument("--quality", type=int, default=82)
    args = parser.parse_args()

    with open(SHOTS_FILE, encoding="utf-8") as handle:
        shots = json.load(handle)
    os.makedirs(SHOTS_DIR, exist_ok=True)

    server = subprocess.Popen(
        ["node", "serve.ts", "--port", str(args.port)],
        cwd=HERE,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        base = f"http://127.0.0.1:{args.port}"
        if not wait_for_server(base + "/index.html"):
            print("server did not come up", file=sys.stderr)
            return 1

        from playwright.sync_api import sync_playwright

        failures = []
        with sync_playwright() as playwright:
            browser = playwright.chromium.launch()
            try:
                for shot in shots:
                    page = browser.new_page(viewport={"width": shot["w"], "height": shot["h"]})
                    page.goto(base + "/index.html" + shot["query"])
                    try:
                        page.wait_for_function("window.__shotReady === true", timeout=15000)
                    except Exception:
                        print(f"{shot['name']}: app never reported ready", file=sys.stderr)
                        failures.append(shot["name"])
                    page.wait_for_timeout(400)
                    out = os.path.join(SHOTS_DIR, shot["name"])
                    page.screenshot(path=out, type="jpeg", quality=args.quality)
                    page.close()
                    problems = check_shot(out, shot["w"], shot["h"])
                    size = os.path.getsize(out)
                    print(f"{shot['name']}: {shot['w']}x{shot['h']} {size} bytes"
                          + (f"  PROBLEM: {'; '.join(problems)}" if problems else ""))
                    failures.extend(f"{shot['name']}: {p}" for p in problems)
            finally:
                browser.close()
        return 1 if failures else 0
    finally:
        server.terminate()
        server.wait(timeout=10)


if __name__ == "__main__":
    raise SystemExit(main())
