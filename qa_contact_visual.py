"""Actual browser QA against a local production build; never sends real requests."""
import json
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://127.0.0.1:8892/contact-us/'
OUT = Path.home() / 'AppData/Local/hermes/cache/contact-refinement-evidence'
OUT.mkdir(parents=True, exist_ok=True)
results = []
with sync_playwright() as p:
    browser = p.chromium.launch()
    for width, height in [(320,800),(360,800),(390,844),(768,1024),(1024,900),(1440,1000),(1920,1080)]:
        page = browser.new_page(viewport={'width':width,'height':height}, device_scale_factor=1)
        errors, failed_local, maps = [], [], []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('response', lambda r: failed_local.append(r.url) if '127.0.0.1' in r.url and r.status>=400 else None)
        page.on('request', lambda r: maps.append(r.url) if 'google.com/maps?q=' in r.url else None)
        page.goto(URL, wait_until='networkidle')
        page.evaluate('document.fonts.ready')
        page.locator('.contact-intro__image').evaluate('(i)=>i.decode()')
        page.locator('footer').scroll_into_view_if_needed()
        page.evaluate('scrollTo(0,0)')
        page.wait_for_timeout(350)
        page.screenshot(path=str(OUT/f'contact-{width}-full.png'), full_page=True)
        page.screenshot(path=str(OUT/f'contact-{width}-fold.png'))
        for selector, name in [('.contact-shop','visit'),('.contact-quote','quote')]:
            page.locator(selector).screenshot(path=str(OUT/f'contact-{width}-{name}.png'))
        page.evaluate('scrollTo(0,0)')
        metrics = page.evaluate('''() => {
          const box = s => {const r=document.querySelector(s).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom}};
          return {width:innerWidth,scroll:document.documentElement.scrollWidth,total:document.documentElement.scrollHeight,
          image:box('.contact-intro__image'),copy:box('.contact-intro__copy'),map:box('.shop-map'),card:box('.contact-visit-card'),hours:box('.hours-list'),quote:box('.contact-quote'),
          cardDisplay:getComputedStyle(document.querySelector('.contact-visit-card')).display,
          formBackground:getComputedStyle(document.querySelector('#quote')).backgroundColor,
          quoteBackground:getComputedStyle(document.querySelector('.contact-quote')).backgroundImage,
          brokenImages:[...document.querySelectorAll('img')].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src),
          overflow:[...document.querySelectorAll('main *')].filter(e=>e.getBoundingClientRect().right>innerWidth+1||e.getBoundingClientRect().left < -1).map(e=>e.className)};
        }''')
        assert metrics['scroll'] <= width and not metrics['overflow'], metrics
        assert not metrics['brokenImages'] and not errors and not failed_local, (metrics,errors,failed_local)
        assert metrics['hours']['width'] >= metrics['card']['width']-62, 'Hours must use full inner card width'
        assert metrics['cardDisplay'] == 'block'
        assert metrics['formBackground'] == 'rgb(255, 255, 255)'
        assert 'linear-gradient' in metrics['quoteBackground']
        assert maps and page.locator('.map-embed iframe').get_attribute('loading') == 'eager', 'Map loads without clicking'
        if width > 900:
            assert metrics['image']['x'] > metrics['copy']['x']+metrics['copy']['width']
            assert abs(metrics['map']['y']-metrics['card']['y']) < 2
            assert metrics['map']['right'] < metrics['card']['x']
            assert abs(metrics['map']['height']-metrics['card']['height']) < 2
        else:
            assert metrics['card']['y'] >= metrics['map']['bottom']
        if page.locator('.menu-toggle').is_visible():
            page.locator('.menu-toggle').click()
            assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'true'
            page.keyboard.press('Escape')
            assert page.locator('.menu-toggle').get_attribute('aria-expanded') == 'false'
        page.locator('#quote button[type="submit"]').click()
        assert not page.locator('#quote').evaluate('(f)=>f.checkValidity()')
        page.locator('#quote [name="name"]').fill('Local QA - not sent')
        page.locator('#quote [name="contact"]').fill('invalid')
        page.locator('#quote button[type="submit"]').click()
        assert 'έγκυρο' in page.locator('#quote .form-errors').inner_text()
        for selector, name in [('.shop-map','map-viewport'),('.contact-visit-card','hours-viewport'),('.contact-quote','quote-viewport')]:
            page.locator(selector).evaluate('(e)=>window.scrollTo(0,window.scrollY+e.getBoundingClientRect().top-document.querySelector("header").getBoundingClientRect().height-12)')
            page.wait_for_timeout(700)
            page.screenshot(path=str(OUT/f'contact-{width}-{name}.png'))
        metrics['mapRequestedAutomatically'] = bool(maps)
        metrics['pageErrors'] = errors
        metrics['failedLocalRequests'] = failed_local
        results.append(metrics)
        (OUT/'responsive-results.json').write_text(json.dumps(results,indent=2),encoding='utf8')
        page.close()
    browser.close()
assert len(results)==7
print(json.dumps(results,indent=2))
print('PASS 7 widths: geometry, full-width hours, eager map request, loaded images, light form, mobile menu, invalid form, no JS errors or local 404s')
