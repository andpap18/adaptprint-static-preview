const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.env.QA_BASE || 'http://127.0.0.1:8765';
const tag = process.env.QA_TAG || 'round5_local';
const out = path.join(process.env.LOCALAPPDATA || '.', 'hermes', 'cache', 'adaptprint_' + tag);
fs.mkdirSync(out, {recursive:true});
function fail(msg){ throw new Error(msg); }
(async()=>{
 const browser = await chromium.launch({headless:true});
 const report = {out, viewports:[], portfolio:{}, reveal:{}, calculator:{}, routes:{}, cls:{}};
 for (const w of [390,768,1024,1100,1180,1280,1440,1920]){
   const page = await browser.newPage({viewport:{width:w,height:w===390?844:900}, deviceScaleFactor:1});
   await page.goto(base+'/?v='+Date.now(), {waitUntil:'networkidle'});
   const metrics = await page.evaluate(()=>{
     const header=document.querySelector('.site-header')?.getBoundingClientRect();
     const first=document.querySelector('.print-composition img')?.getBoundingClientRect();
     const h1=[...document.querySelectorAll('h1,h2,h3')].filter(h=>getComputedStyle(h).hyphens==='auto').length;
     return {headerHeight:Math.round(header?.height||0), firstImageTop:Math.round(first?.top||0), pageHeight:document.documentElement.scrollHeight, overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth, hyphenHeadings:h1};
   });
   report.viewports.push({w,...metrics});
   if(metrics.overflow>1) fail('overflow '+w+' '+metrics.overflow);
   if(metrics.hyphenHeadings) fail('hyphen headings '+w);
   if(w<=1100 && metrics.headerHeight!==74) fail('header mobile/tablet '+w+' '+metrics.headerHeight);
   if(w>=1180 && metrics.headerHeight!==92) fail('header desktop '+w+' '+metrics.headerHeight);
   if(w===390 && metrics.firstImageTop>=600) fail('first image too low '+metrics.firstImageTop);
   if(w===390 && metrics.pageHeight>=7000) fail('mobile page too tall '+metrics.pageHeight);
   if(w>=1180 && metrics.pageHeight>=5000) fail('desktop page too tall '+w+' '+metrics.pageHeight);
   if(w===390 || w===1440){
     await page.goto(base+'/portfolio/?v='+Date.now(), {waitUntil:'networkidle'});
     await page.screenshot({path:path.join(out,`portfolio-${w}.png`), fullPage:true});
   }
   await page.close();
 }
 const page = await browser.newPage({viewport:{width:1440,height:900}, deviceScaleFactor:1});
 await page.goto(base+'/?v='+Date.now(), {waitUntil:'networkidle'});
 const reveal = await page.evaluate(()=>{
   const hero=[...document.querySelectorAll('.hero .reveal')].map(el=>getComputedStyle(el).opacity+','+getComputedStyle(el).transform);
   const below=[...document.querySelectorAll('main .reveal')].filter(el=>!el.closest('.hero')).slice(0,12).map(el=>{const cs=getComputedStyle(el); return {opacity:cs.opacity, transform:cs.transform, visible:el.classList.contains('visible')};});
   return {hero, below};
 });
 report.reveal.initial = reveal;
 if(reveal.hero.some(v=>!v.startsWith('1,'))) fail('hero reveal affected');
 if(!reveal.below.some(x=>x.opacity==='0' && x.transform!=='none')) fail('below-fold reveal not initially hidden/moved');
 await page.evaluate(()=>window.scrollTo(0, 1600));
 await page.waitForTimeout(900);
 report.reveal.afterScroll = await page.evaluate(()=>[...document.querySelectorAll('main .reveal.visible')].filter(el=>!el.closest('.hero')).length);
 await page.screenshot({path:path.join(out,'home-scroll-after-reveal.png'), fullPage:false});
 // CLS during scroll
 await page.goto(base+'/?v='+Date.now(), {waitUntil:'networkidle'});
 await page.evaluate(()=>{window.__cls=0; new PerformanceObserver(list=>{for(const e of list.getEntries()) if(!e.hadRecentInput) window.__cls+=e.value;}).observe({type:'layout-shift', buffered:true});});
 for (const y of [0,600,1200,1800,2600,3400,4200,5200]){ await page.evaluate(y=>window.scrollTo(0,y), y); await page.waitForTimeout(160); }
 report.cls.home = await page.evaluate(()=>window.__cls || 0);
 if(report.cls.home > 0.01) fail('CLS > .01 '+report.cls.home);
 await page.goto(base+'/portfolio/?v='+Date.now(), {waitUntil:'networkidle'});
 const port = await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.work-card')].map(c=>{const r=c.getBoundingClientRect(); const cta=c.querySelector('.work-cta')?.getBoundingClientRect(); const meta=c.querySelector('.work-meta')?.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height), ctaBottom:Math.round(cta?.bottom-r.bottom||0), metaTop:Math.round(meta?.top-r.top||0), metaBottom:Math.round(meta?.bottom-r.bottom||0), overflow:getComputedStyle(c).overflow};});
   return {count:cards.length, cards};
 });
 report.portfolio.desktop = port;
 if(port.count < 12) fail('too few portfolio cards');
 const sizes = new Set(port.cards.map(c=>c.w+'x'+c.h));
 if(sizes.size > 2) fail('portfolio desktop unequal sizes '+[...sizes].join(','));
 if(port.cards.some(c=>c.ctaBottom>1)) fail('portfolio cta clipped');
 if(port.cards.some(c=>c.metaTop < 0 || c.metaBottom > 1)) fail('portfolio meta outside card');
 await page.click('.filter-btn[data-filter="UV"]'); await page.waitForTimeout(360);
 report.portfolio.filterVisible = await page.evaluate(()=>[...document.querySelectorAll('.work-card')].filter(c=>getComputedStyle(c).display!=='none').map(c=>c.dataset.category));
 if(!report.portfolio.filterVisible.every(c=>c==='UV')) fail('filter failed');
 await page.locator('.work-card[data-category="UV"] .work-open').first().click(); await page.waitForTimeout(200);
 report.portfolio.lightboxOpen = await page.evaluate(()=>!document.getElementById('lightbox')?.hasAttribute('hidden'));
 if(!report.portfolio.lightboxOpen) fail('lightbox did not open');
 await page.keyboard.press('ArrowRight'); await page.keyboard.press('Escape'); await page.waitForTimeout(100);
 report.portfolio.lightboxClosedEsc = await page.evaluate(()=>document.getElementById('lightbox')?.hasAttribute('hidden'));
 if(!report.portfolio.lightboxClosedEsc) fail('lightbox escape failed');
 await page.goto(base+'/stampes-dtf-me-to-metro/?v='+Date.now(), {waitUntil:'networkidle'});
 report.calculator = await page.evaluate(()=>({hasPrice:!!document.getElementById('calcPrice'), text:document.body.innerText, result:document.getElementById('calcResult')?.value}));
 if(report.calculator.hasPrice) fail('calcPrice still exists');
 if(report.calculator.text.includes('€')) fail('visible euro exists');
 if(!/τρέχοντα μέτρα/.test(report.calculator.result||'')) fail('calculator result missing meters');
 await browser.close();
 fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:true,out, cls:report.cls.home, viewports:report.viewports, portfolioCards:report.portfolio.desktop.count, calc:report.calculator.result}));
})().catch(e=>{console.error(e); process.exit(1);});
