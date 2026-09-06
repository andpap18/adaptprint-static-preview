const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const base = process.env.BASE_URL || 'http://127.0.0.1:8767';
const widths = [360, 390, 430];
const label = process.env.LABEL || 'after';
const out = path.join(__dirname, 'qa-artifacts', 'mobile-whatsapp-clearance');

function overlap(a, b) {
  return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) *
    Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}

(async () => {
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const report = { base, pass: true, widths: [] };
  try {
    for (const width of widths) {
      const page = await browser.newPage({ viewport: { width, height: 844 }, deviceScaleFactor: 1 });
      const response = await page.goto(base + '/', { waitUntil: 'networkidle' });
      await page.evaluate(() => {
        const address = document.querySelector('.home-intro-media .trust-metrics-strip .wrap > span:last-child');
        const whatsapp = document.querySelector('.floating-whatsapp');
        const addressRect = address.getBoundingClientRect();
        const whatsappRect = whatsapp.getBoundingClientRect();
        // Reproduce the live-equivalent scroll where the fixed control crosses the address row.
        window.scrollTo(0, window.scrollY + addressRect.bottom - (whatsappRect.top + 44));
      });
      await page.screenshot({ path: path.join(out, `${label}-${width}.png`), fullPage: false });
      const metrics = await page.evaluate(() => {
        const rect = el => { const r = el.getBoundingClientRect(); return { left:r.left, top:r.top, right:r.right, bottom:r.bottom, width:r.width, height:r.height }; };
        return {
          trust: rect(document.querySelector('.home-intro-media .trust-metrics-strip > .wrap')),
          address: rect(document.querySelector('.home-intro-media .trust-metrics-strip .wrap > span:last-child')),
          whatsapp: rect(document.querySelector('.floating-whatsapp')),
          services: document.querySelectorAll('.home-intro-media .home-service-links a').length,
          cta: document.querySelector('.home-intro-media .moved-head-actions .btn')?.textContent.trim(),
        };
      });
      const addressOverlap = overlap(metrics.address, metrics.whatsapp);
      const trustOverlap = overlap(metrics.trust, metrics.whatsapp);
      const row = { width, status: response?.status(), ...metrics, addressOverlap, trustOverlap };
      report.widths.push(row);
      if (row.status !== 200 || row.services !== 4 || !row.cta || addressOverlap !== 0) report.pass = false;
      await page.close();
    }
  } finally {
    await browser.close();
  }
  fs.writeFileSync(path.join(out, `report-${label}.json`), JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.pass ? 0 : 1);
})();
