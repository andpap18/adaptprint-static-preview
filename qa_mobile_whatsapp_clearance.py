"""Asset-prefix mapped local mobile clearance audit for the home CTA/trust panel."""
import json
import mimetypes
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
PREFIX = "/adaptprint-static-preview"
WIDTHS = (360, 390, 430)
VIEWPORT_HEIGHT = 844
LABEL = "after"
OUT = ROOT / "qa-artifacts" / "mobile-whatsapp-clearance"


def overlap(a, b):
    return max(0, min(a["right"], b["right"]) - max(a["left"], b["left"])) * max(
        0, min(a["bottom"], b["bottom"]) - max(a["top"], b["top"])
    )


class AssetMappedHandler(SimpleHTTPRequestHandler):
    def translate_path(self, request_path):
        pathname = unquote(urlparse(request_path).path)
        if pathname in (PREFIX, f"{PREFIX}/"):
            relative = "index.html"
        elif pathname.startswith(f"{PREFIX}/"):
            relative = pathname[len(PREFIX) + 1 :]
        else:
            relative = pathname.lstrip("/")
        candidate = (ROOT / relative).resolve()
        return str(candidate if ROOT in candidate.parents or candidate == ROOT else ROOT / "__missing__")

    def log_message(self, *_):
        pass


def metrics(page):
    return page.evaluate(
        """() => {
          const rect = el => { const r = el.getBoundingClientRect(); return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}; };
          const cta = document.querySelector('.home-intro-media .moved-head-actions .btn');
          const trust = [...document.querySelectorAll('.home-intro-media .trust-metrics-strip > .wrap > span')];
          return { cta: rect(cta), trust: trust.map(rect), whatsapp: rect(document.querySelector('.floating-whatsapp')) };
        }"""
    )


def probe_positions(page):
    return page.evaluate(
        """() => {
          const cta = document.querySelector('.home-intro-media .moved-head-actions .btn');
          const trust = document.querySelector('.home-intro-media .trust-metrics-strip');
          const max = document.documentElement.scrollHeight - innerHeight;
          const clamp = y => Math.max(0, Math.min(max, y));
          return [
            ['top', 0],
            ['cta-near-bottom', clamp(cta.offsetTop + cta.offsetHeight - innerHeight + 24)],
            ['cta-at-rest', clamp(cta.offsetTop - 24)],
            ['trust-near-bottom', clamp(trust.offsetTop + trust.offsetHeight - innerHeight + 24)],
            ['trust-at-rest', clamp(trust.offsetTop - 24)],
            ['page-end', max]
          ];
        }"""
    )


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer(("127.0.0.1", 0), AssetMappedHandler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    base = f"http://127.0.0.1:{server.server_port}{PREFIX}"
    report = {"base": base, "pass": True, "widths": []}
    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            for width in WIDTHS:
                page = browser.new_page(viewport={"width": width, "height": VIEWPORT_HEIGHT}, device_scale_factor=1)
                response = page.goto(f"{base}/", wait_until="networkidle")
                checks = []
                for name, y in probe_positions(page):
                    page.evaluate("y => scrollTo(0, y)", y)
                    page.wait_for_timeout(80)
                    current = metrics(page)
                    cta_overlap = overlap(current["cta"], current["whatsapp"])
                    trust_overlaps = [overlap(item, current["whatsapp"]) for item in current["trust"]]
                    checks.append({"name": name, "y": y, **current, "ctaOverlap": cta_overlap, "trustOverlaps": trust_overlaps})
                page.screenshot(path=str(OUT / f"{LABEL}-{width}.png"), full_page=False)
                row = {"width": width, "status": response.status if response else None, "checks": checks}
                row["pass"] = row["status"] == 200 and all(
                    check["ctaOverlap"] == 0 and not any(check["trustOverlaps"]) for check in checks
                )
                report["widths"].append(row)
                report["pass"] = report["pass"] and row["pass"]
                page.close()
            browser.close()
    finally:
        server.shutdown()
        server.server_close()
    (OUT / f"report-{LABEL}.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))
    raise SystemExit(0 if report["pass"] else 1)


if __name__ == "__main__":
    main()
