const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = 'http://127.0.0.1:8765';
const routes = ['/', '/dtf-me-to-metro/', '/services/', '/ektyposeis-se-mplouzakia/', '/ektyposeis-se-koupes/', '/diafimistika-eidi/', '/portfolio/', '/χονδρική-2/', '/about-us/', '/contact-us/', '/terms-and-conditions/', '/privacy-policy/'];
const widths = [360,390,768,1280,1440];
const outDir = 'C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_redesign_qa';
fs.mkdirSync(outDir, {recursive:true});
(async()=>{
  const browser = await chromium.launch({headless:true});
  const report = {ok:true, checks:[], issues:[], screenshots:{before:'C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_baseline', after:outDir}};
  for (const w of widths){
    const h = w < 500 ? 844 : (w < 900 ? 1024 : 720);
    const page = await browser.newPage({viewport:{width:w,height:h}});
    page.on('console', msg => { if(['error'].includes(msg.type())) report.issues.push({type:'console', width:w, text:msg.text()}); });
    for (const route of routes){
      const url = base + route;
      const res = await page.goto(url, {waitUntil:'networkidle'});
      const status = res ? res.status() : 0;
      const metrics = await page.evaluate(() => ({
        title: document.title,
        h1: document.querySelectorAll('h1').length,
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
        robots: document.querySelector('meta[name="robots"]')?.content || null,
        canonical: document.querySelector('link[rel="canonical"]')?.href || null,
        forms: document.querySelectorAll('form').length,
        details: document.querySelectorAll('details').length,
        imgs: [...document.images].filter(i=>i.offsetParent !== null && i.complete && i.naturalWidth===0).map(i=>i.src),
        ctaQuoteTop: document.querySelector('#quote')?.getBoundingClientRect().top ?? null
      }));
      const check = {route,width:w,status,...metrics};
      if(status !== 200) { report.ok=false; report.issues.push({type:'http', route, width:w, status}); }
      if(metrics.h1 !== 1) { report.ok=false; report.issues.push({type:'h1', route, width:w, h1:metrics.h1}); }
      if(metrics.scrollWidth > metrics.clientWidth + 2) { report.ok=false; report.issues.push({type:'overflow', route, width:w, scrollWidth:metrics.scrollWidth, clientWidth:metrics.clientWidth}); }
      if(metrics.imgs.length) { report.ok=false; report.issues.push({type:'broken-images', route, width:w, imgs:metrics.imgs}); }
      report.checks.push(check);
      if(['/','/dtf-me-to-metro/','/portfolio/','/contact-us/'].includes(route) && [390,1280].includes(w)){
        const name = `${w===390?'mobile':'desktop'}-${route.replaceAll('/','_root_')}.png`;
        await page.screenshot({path:path.join(outDir,name), fullPage:false});
      }
      if(w===390 && route==='/'){
        await page.click('.menu-toggle');
        const open = await page.evaluate(() => ({expanded:document.querySelector('.menu-toggle')?.getAttribute('aria-expanded'), navOpen:document.querySelector('.nav')?.classList.contains('open')}));
        if(open.expanded !== 'true' || !open.navOpen){ report.ok=false; report.issues.push({type:'mobile-menu', route, width:w, open}); }
      }
      if(route==='/portfolio/' && w===1280){
        await page.click('.filter-btn[data-filter="Κούπες"]');
        const visible = await page.evaluate(() => [...document.querySelectorAll('.work-card')].filter(c => getComputedStyle(c).display !== 'none').length);
        if(visible < 1){ report.ok=false; report.issues.push({type:'portfolio-filter', visible}); }
        await page.locator('.work-card').filter({has: page.locator('.work-open')}).filter({hasText: 'Δείγμα κούπας'}).first().locator('.work-open').click();
        const lbOpen = await page.evaluate(() => !document.querySelector('#lightbox')?.hidden);
        if(!lbOpen){ report.ok=false; report.issues.push({type:'lightbox-open'}); }
        await page.keyboard.press('Escape');
        const lbClosed = await page.evaluate(() => document.querySelector('#lightbox')?.hidden);
        if(!lbClosed){ report.ok=false; report.issues.push({type:'lightbox-escape'}); }
      }
      if(route==='/dtf-me-to-metro/' && w===390){
        await page.click('a[href="#quote"]');
        await page.waitForTimeout(350);
        const y = await page.evaluate(() => document.querySelector('#quote')?.getBoundingClientRect().top);
        if(y !== null && y < 60){ report.ok=false; report.issues.push({type:'anchor-covered', route, width:w, top:y}); }
      }
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync(path.join(outDir,'qa-report.json'), JSON.stringify(report,null,2));
  console.log(JSON.stringify({ok:report.ok, checks:report.checks.length, issues:report.issues, outDir}, null, 2));
})();
