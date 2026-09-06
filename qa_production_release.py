from pathlib import Path
import re
import sys

root = Path(__file__).resolve().parent
release = root / 'dist-production'
assert release.is_dir(), 'production release directory is missing; run scripts/build_production_release.py'

pages = [release / 'index.html'] + sorted(release.glob('*/index.html'))
assert len(pages) == 13, f'expected 13 production pages, found {len(pages)}'
for page in pages:
    html = page.read_text(encoding='utf-8')
    assert 'noindex,follow' not in html, f'noindex remains in {page}'
    assert '/adaptprint-static-preview/' not in html, f'preview path remains in {page}'
    assert re.search(r'<link rel="canonical" href="https://adaptprint\.gr(?:/[^\"]*)?">', html), f'production canonical missing: {page}'

robots = (release / 'robots.txt').read_text(encoding='utf-8')
assert 'Disallow: /' not in robots, 'production robots must not block crawling'
assert 'Sitemap: https://adaptprint.gr/sitemap.xml' in robots, 'production sitemap declaration missing'
assert (release / 'assets/images/og-adaptprint.jpg').is_file(), 'OG image missing from production release'
assert (release / 'api/quote.php').is_file(), 'quote endpoint missing from production release'
assert not (release / 'deploy/private/adaptprint-quote-config.example.php').exists(), 'private config example must not be in web release'
print('PASS production release: 13 pages, indexable robots, production paths, OG asset, quote endpoint')
