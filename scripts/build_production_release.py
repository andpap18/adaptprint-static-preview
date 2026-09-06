from __future__ import annotations

import shutil
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'dist-production'
EXCLUDED_PARTS = {'.git', 'node_modules', 'dist-production', 'deploy', 'docs', 'scripts', 'qa-screenshots', '__pycache__'}
EXCLUDED_NAMES = {
    'package.json', 'package-lock.json', 'postprocess_performance.py', 'prepare_github_pages_preview.py',
    'qa-report.json', 'qa-report-v2.json', 'qa_all_v2.js', 'qa_preview.js', 'qa_quote_endpoint.js',
    'qa_production_release.py', 'ui_audit_current.js', 'visual_capture_v2.js',
}
ALLOWED_TOP_LEVEL = {
    'index.html', '404.html', 'robots.txt', 'sitemap.xml', 'assets', 'api',
    'about-us', 'anaglyfi-uv-ektyposi-diafimistika', 'contact-us', 'diafimistika-eidi',
    'ektyposeis-se-mplouzakia', 'ektyposeis-xondrikis', 'portfolio', 'privacy-policy',
    'services', 'stampes-dtf-me-to-metro', 'sublimation-se-koupes-mpoukalia-yfasma',
    'terms-and-conditions',
}
TEXT_SUFFIXES = {'.html', '.css', '.js', '.php', '.xml', '.txt'}

if OUTPUT.exists():
    shutil.rmtree(OUTPUT)
OUTPUT.mkdir()

for source in ROOT.rglob('*'):
    relative = source.relative_to(ROOT)
    if relative.parts[0] not in ALLOWED_TOP_LEVEL or any(part in EXCLUDED_PARTS for part in relative.parts) or source.name in EXCLUDED_NAMES:
        continue
    if source.is_dir():
        continue
    destination = OUTPUT / relative
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.suffix.lower() in TEXT_SUFFIXES:
        content = source.read_text(encoding='utf-8')
        content = content.replace('/adaptprint-static-preview/', '/')
        if source.suffix.lower() == '.html':
            content = re.sub(r'<meta\s+name="robots"\s+content="noindex,follow">', '', content, flags=re.I)
        destination.write_text(content, encoding='utf-8')
    else:
        shutil.copy2(source, destination)

(OUTPUT / 'robots.txt').write_text(
    'User-agent: *\nAllow: /\n\nSitemap: https://adaptprint.gr/sitemap.xml\n', encoding='utf-8'
)
(OUTPUT / 'DEPLOYMENT_README.txt').write_text(
    'Upload this directory CONTENTS to the MyIP document root (normally public_html).\n'
    'Do not upload deploy/private/.\n'
    'Create the private quote form config outside public_html before activating the production domain.\n'
    'Run qa_production_release.py locally before packaging; verify all production URLs and email delivery after upload.\n',
    encoding='utf-8',
)
print(f'Built production release: {OUTPUT}')
