const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.env.QA_BASE || 'http://127.0.0.1:8765';
const tag = process.env.QA_TAG || 'round7_local';
const out = path.join(process.env.LOCALAPPDATA || '.', 'hermes','cache','adaptprint_'+tag);
fs.mkdirSync(out,{recursive:true});
function fail(m){ throw new Error(m); }
async function shot(page, file, selector){
  if(selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(350);
  await page.screenshot({path:path.join(out,file), fullPage:false});
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={out,viewports:[],portfolio:{},calc:{},sections:{}};
 for(const w of [390,768,1024,1100,1180,1280,1440,1920]){
  const page=await browser.newPage({viewport:{width:w,height:w===390?844:900},deviceScaleFactor:1});
  await page.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'});
  const m=await page.evaluate(()=>{const h=document.querySelector('.site-header')?.getBoundingClientRect(); const first=document.querySelector('.print-composition img')?.getBoundingClientRect(); return {w:innerWidth,headerHeight:Math.round(h?.height||0),firstImageTop:Math.round(first?.top||0),pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,hyphenHeadings:[...document.querySelectorAll('h1,h2,h3')].filter(x=>getComputedStyle(x).hyphens==='auto').length};});
  report.viewports.push(m);
  if(m.overflow>1) fail('overflow '+w);
  if(m.hyphenHeadings) fail('hyphen headings '+w);
  if(w<=1100 && m.headerHeight!==74) fail('header '+w+' '+m.headerHeight);
  if(w>=1180 && m.headerHeight!==92) fail('header '+w+' '+m.headerHeight);
  if(w===390 && m.firstImageTop>=600) fail('first image '+m.firstImageTop);
  if(w===390 && m.pageHeight>=7000) fail('mobile height '+m.pageHeight);
  if(w>=1180 && m.pageHeight>=5000) fail('desktop height '+m.pageHeight);
  await page.close();
 }
 const home=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await home.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'});
 await shot(home,'hero-home-1440.png','.hero');
 await shot(home,'service-cards-1440.png','.home-services');
 await shot(home,'new-work-1440.png','.home-selected');
 await home.close();
 const dtf=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await dtf.goto(base+'/stampes-dtf-me-to-metro/?v='+Date.now(),{waitUntil:'networkidle'});
 await shot(dtf,'dtf-page-1440.png','.production-strip');
 report.calc=await dtf.evaluate(()=>({hasPrice:!!document.querySelector('#calcPrice'), euro:document.body.innerText.includes('€'), output:document.querySelector('#calcResult')?.innerText||''}));
 if(report.calc.hasPrice || report.calc.euro) fail('calculator price/euro present');
 await dtf.close();
 const port=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await port.goto(base+'/portfolio/?v='+Date.now(),{waitUntil:'networkidle'});
 await port.locator('.portfolio-section').scrollIntoViewIfNeeded(); await port.waitForTimeout(400);
 await port.screenshot({path:path.join(out,'portfolio-1440.png'),fullPage:false});
 report.portfolio=await port.evaluate(()=>({cards:document.querySelectorAll('.work-card').length, filters:[...document.querySelectorAll('.filters button')].map(b=>b.innerText.trim()), cleanSense:document.body.innerText.toLowerCase().includes('cleansense'), notebook:[...document.images].some(i=>i.src.includes('notebook'))}));
 if(report.portfolio.cards<8) fail('too few clean portfolio cards');
 if(report.portfolio.cleanSense || report.portfolio.notebook) fail('CleanSense/notebook remains');
 await port.close();
 const whats=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await whats.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'});
 report.whatsapp=await whats.evaluate(()=>{const a=document.querySelector('.floating-whatsapp'); const r=a?.getBoundingClientRect(); const p=a?.querySelector('path')?.getAttribute('d')||''; return {exists:!!a,viewBox:a?.querySelector('svg')?.getAttribute('viewBox'),pathStart:p.slice(0,32),w:Math.round(r?.width||0),h:Math.round(r?.height||0),bg:getComputedStyle(a).backgroundColor};});
 if(report.whatsapp.viewBox!=='0 0 24 24' || !report.whatsapp.pathStart.startsWith('M17.472')) fail('WhatsApp glyph not replaced');
 await whats.close();
 await browser.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:true,out,metrics:report.viewports,portfolio:report.portfolio,calc:report.calc,whatsapp:report.whatsapp}));
})().catch(e=>{console.error(e);process.exit(1)});
