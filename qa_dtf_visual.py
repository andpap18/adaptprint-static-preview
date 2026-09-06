"""Responsive DTF release QA; run after building and serving dist-production on :8876."""
import json
from pathlib import Path
from playwright.sync_api import sync_playwright

OUT = Path.home() / 'AppData/Local/hermes/cache/dtf-astra-evidence'
OUT.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(1440, 1000), (390, 844), (360, 800), (768, 1024)]:
        page = browser.new_page(viewport={'width': width, 'height': height}, device_scale_factor=1)
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.goto('http://127.0.0.1:8876/stampes-dtf-me-to-metro/', wait_until='networkidle')
        page.locator('.dtf-faq-photo').scroll_into_view_if_needed()
        page.locator('.dtf-faq-photo img').evaluate('(img) => img.decode()')
        page.evaluate('window.scrollTo(0,0)')
        page.screenshot(path=str(OUT / f'dtf-{width}-full.png'), full_page=True)
        page.screenshot(path=str(OUT / f'dtf-{width}-fold.png'))
        metrics = page.evaluate('''() => {
          const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
          return {width:innerWidth,scroll:document.documentElement.scrollWidth,total:document.documentElement.scrollHeight,hero:box('.dtf-hero'),image:box('.dtf-hero__image'),calculator:box('#calculator'),trust:box('.dtf-proof'),quote:box('.dtf-quote-panel'),badImages:[...document.querySelectorAll('main img')].filter(i=>!i.complete||!i.naturalWidth).length};
        }''')
        assert metrics['scroll'] <= width, metrics
        assert metrics['badImages'] == 0
        assert metrics['image']['y'] < height, 'Real photograph must appear above fold'
        assert metrics['calculator']['y'] < (1250 if width < 800 else 1100), metrics
        assert metrics['quote']['y'] - (metrics['trust']['y'] + metrics['trust']['height']) >= 28
        assert page.locator('.dtf-proof .stars svg').count() == 5
        for w, h, qty, expected in [('25','30','20','3.1'), ('57','99','1','1')]:
            for ident, value in [('calcWidth',w),('calcHeight',h),('calcQty',qty)]:
                page.locator('#'+ident).fill(value)
            text=page.locator('#calcResult').inner_text()
            assert expected in text.replace(',', '.'), text
        page.locator('#sendCalc').click()
        assert page.locator('#quote textarea[name="message"]').input_value(), 'Calculation transfers to form'
        page.locator('.dtf-seo-details summary').click()
        assert page.locator('.dtf-seo-details').get_attribute('open') is not None
        assert not errors, errors
        results.append(metrics)
        page.close()
    browser.close()
(OUT / 'responsive-results.json').write_text(json.dumps(results, indent=2), encoding='utf8')
print(json.dumps(results, indent=2))
print('PASS 4 responsive widths, loaded image, above-fold media, compact route to calculator, trust separation, calculator transfer and details')
