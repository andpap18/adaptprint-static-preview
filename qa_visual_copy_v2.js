const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const base = 'http://127.0.0.1:8765';
const routes = ['/', '/dtf-me-to-metro/', '/services/', '/ektyposeis-se-mplouzakia/', '/ektyposeis-se-koupes/', '/diafimistika-eidi/', '/portfolio/', '/χονδρική-2/', '/about-us/', '/contact-us/', '/terms-and-conditions/', '/privacy-policy/'];
const widths = [360,390,768,1280,1440];
const forbidden = ['πρέπει να εγκρι', 'χρειάζεται επιβεβαίωση', 'anchor', 'sticky', 'DTF60', 'μήνμα', 'Static preview', 'Δημιουργός', 'Λιγότερο DTF60', 'διαδικασία φαίνεται', 'πρωτότυπο', 'Προσχέδιο placeholder'];
const outDir='C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_v2_qa'; fs.mkdirSync(outDir,{recursive:true});
(async()=>{
 const browser = await chromium.launch({headless:true});
 const report={ok:true, checks:0, issues:[], screenshots:outDir};
 for(const w of widths){
  const h = w<500?844:(w<900?1024:720);
  const page = await browser.newPage({viewport:{width:w,height:h}});
  page.on('pageerror', e=>{report.ok=false; report.issues.push({type:'pageerror', width:w, text:String(e)})});
  for(const route of routes){
   const res=await page.goto(base+route,{waitUntil:'networkidle'}); report.checks++;
   const m=await page.evaluate((forbidden)=>{
    const body=document.body.innerText;
    return {
     statusText: body.slice(0,80), h1:document.querySelectorAll('h1').length,
     scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth,
     broken:[...document.images].filter(i=>i.offsetParent!==null && i.complete && i.naturalWidth===0).map(i=>i.src),
     forbidden:forbidden.filter(t=>body.includes(t)),
     revealOpacity:[...document.querySelectorAll('.reveal')].slice(0,5).map(e=>getComputedStyle(e).opacity),
     forms:document.querySelectorAll('form').length,
     footerText:document.querySelector('footer')?.innerText||''
    }
   }, forbidden);
   if(!res || res.status()!==200){report.ok=false; report.issues.push({type:'http',route,width:w,status:res&&res.status()})}
   if(m.h1!==1){report.ok=false; report.issues.push({type:'h1',route,width:w,h1:m.h1})}
   if(m.scrollWidth>m.clientWidth+2){report.ok=false; report.issues.push({type:'overflow',route,width:w,sw:m.scrollWidth,cw:m.clientWidth})}
   if(m.broken.length){report.ok=false; report.issues.push({type:'broken-images',route,width:w,broken:m.broken})}
   if(m.forbidden.length){report.ok=false; report.issues.push({type:'forbidden-copy',route,width:w,terms:m.forbidden})}
   if(m.revealOpacity.some(o=>Number(o)<0.9)){report.ok=false; report.issues.push({type:'slow-fade-risk',route,width:w,opacities:m.revealOpacity})}
   if(m.footerText.includes('Static preview')||m.footerText.includes('Δημιουργός')){report.ok=false; report.issues.push({type:'footer-preview-text',route,width:w})}
   if(['/','/dtf-me-to-metro/','/ektyposeis-se-mplouzakia/','/portfolio/','/contact-us/'].includes(route) && [390,1280].includes(w)){
    await page.screenshot({path:path.join(outDir, `${w===390?'mobile':'desktop'}-${route.replaceAll('/','_root_')}.png`), fullPage:false});
   }
   if(route==='/ektyposeis-se-mplouzakia/' && w===1280){
    const gap=await page.evaluate(()=>{const figs=document.querySelector('.product-detail-grid'); const next=figs?.nextElementSibling; if(!figs||!next)return null; return Math.round(next.getBoundingClientRect().top - figs.getBoundingClientRect().bottom)});
    if(gap!==null && gap>120){report.ok=false; report.issues.push({type:'apparel-large-gap',gap})}
   }
   if(route==='/' && w===1280){
    const ctas=await page.evaluate(()=>[...document.querySelectorAll('.hero .btn')].map(b=>b.getBoundingClientRect().bottom));
    if(ctas.some(y=>y>720)){report.ok=false; report.issues.push({type:'hero-cta-below-fold',bottoms:ctas})}
    await page.mouse.move(930,360); await page.waitForTimeout(50);
   }
   if(route==='/' && w===390){ await page.click('.menu-toggle'); const open=await page.evaluate(()=>document.querySelector('.nav')?.classList.contains('open')); if(!open){report.ok=false; report.issues.push({type:'mobile-menu'})} }
   if(route==='/portfolio/' && w===1280){ await page.click('.filter-btn[data-filter="Κούπες"]'); const visible=await page.evaluate(()=>[...document.querySelectorAll('.work-card')].filter(c=>getComputedStyle(c).display!=='none').length); if(visible<1){report.ok=false;report.issues.push({type:'filter-empty'})} await page.locator('.work-card').filter({hasText:'Δείγμα κούπας'}).first().locator('.work-open').click(); const lb=await page.evaluate(()=>!document.querySelector('#lightbox')?.hidden); if(!lb){report.ok=false;report.issues.push({type:'lightbox'})} await page.keyboard.press('Escape'); }
   if(route==='/dtf-me-to-metro/' && w===390){ await page.click('a[href="#quote"]'); await page.waitForTimeout(300); const y=await page.evaluate(()=>document.querySelector('#quote-title')?.getBoundingClientRect().top); if(y<62){report.ok=false;report.issues.push({type:'anchor-covered', y})} }
  }
  await page.close();
 }
 await browser.close(); fs.writeFileSync(path.join(outDir,'qa-report.json'), JSON.stringify(report,null,2)); console.log(JSON.stringify({ok:report.ok,checks:report.checks,issues:report.issues,outDir},null,2));
})();
