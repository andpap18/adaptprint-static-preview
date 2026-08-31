const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const base = 'https://andpap18.github.io/adaptprint-static-preview';
const routes = ['/', '/stampes-dtf-me-to-metro/', '/services/', '/ektyposeis-se-mplouzakia/', '/ektyposeis-se-koupes/', '/diafimistika-eidi/', '/portfolio/', '/ektyposeis-xondrikis/', '/about-us/', '/contact-us/', '/terms-and-conditions/', '/privacy-policy/'];
const widths = [390,768,1280,1440,1920];
const outDir='C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_seo_golive_live_qa'; fs.mkdirSync(outDir,{recursive:true});
(async()=>{
 const browser=await chromium.launch({headless:true}); const report={ok:true,checks:0,issues:[],outDir};
 for(const w of widths){ const h=w<500?844:(w<900?1024:900); const page=await browser.newPage({viewport:{width:w,height:h}});
  for(const route of routes){ const res=await page.goto(base+route,{waitUntil:'networkidle'}); report.checks++;
   if(!res||res.status()!==200){report.ok=false;report.issues.push({type:'http',route,w,status:res&&res.status()});continue}
   const m=await page.evaluate(()=>{const h1=[...document.querySelectorAll('h1')]; const text=document.body.innerText; const canon=document.querySelector('link[rel="canonical"]')?.href||''; const robots=document.querySelector('meta[name="robots"]')?.content||''; return {h1:h1.length,text,canon,robots,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,broken:[...document.images].filter(i=>i.offsetParent!==null&&i.complete&&i.naturalWidth===0).map(i=>i.src),titleOver:h1.map(el=>{const r=el.getBoundingClientRect(),p=el.parentElement.getBoundingClientRect();return {text:el.innerText,over:Math.max(0,Math.round(r.right-p.right))}}),schemas:[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent),footer:document.querySelector('footer')?.innerText||''}});
   if(m.h1!==1){report.ok=false;report.issues.push({type:'h1',route,w,h1:m.h1})}
   if(m.sw>m.cw+2){report.ok=false;report.issues.push({type:'overflow',route,w,sw:m.sw,cw:m.cw})}
   if(m.broken.length){report.ok=false;report.issues.push({type:'broken-images',route,w,broken:m.broken})}
   if(!m.canon.startsWith('https://adaptprint.gr/')){report.ok=false;report.issues.push({type:'canonical',route,w,canon:m.canon})}
   if(m.robots!=='noindex,nofollow'){report.ok=false;report.issues.push({type:'preview-robots',route,w,robots:m.robots})}
   if(m.titleOver.some(x=>x.over>0)){report.ok=false;report.issues.push({type:'title-overflow',route,w,titleOver:m.titleOver})}
   if(route==='/stampes-dtf-me-to-metro/'){ if(!m.text.includes('Στάμπες DTF με το μέτρο')){report.ok=false;report.issues.push({type:'dtf-phrase'})} let types=[]; for(const s of m.schemas){try{const j=JSON.parse(s); for(const n of (j['@graph']||[])) types.push(n['@type'])}catch(e){report.ok=false;report.issues.push({type:'jsonld',route,error:String(e)})}} for(const t of ['LocalBusiness','BreadcrumbList','Service','FAQPage']) if(!types.includes(t)){report.ok=false;report.issues.push({type:'schema-missing',t})} await page.fill('#calcWidth','28'); await page.fill('#calcHeight','35'); await page.fill('#calcQty','40'); await page.fill('#calcPrice','12'); const calc=await page.locator('#calcResult').textContent(); if(!calc.includes('τρέχοντα μέτρα')){report.ok=false;report.issues.push({type:'calculator',calc})}}
   if(route==='/ektyposeis-se-mplouzakia/') for(const term of ['φούτερ','ζακέτες','γιλέκα εργασίας','μπουφάν']) if(!m.text.toLowerCase().includes(term)){report.ok=false;report.issues.push({type:'apparel-term',term})}
   if(route==='/portfolio/'&&w===1280){await page.click('.filter-btn[data-filter="Κούπες"]'); const visible=await page.evaluate(()=>[...document.querySelectorAll('.work-card')].filter(c=>getComputedStyle(c).display!=='none').length); if(visible<1){report.ok=false;report.issues.push({type:'portfolio-filter'})} await page.locator('.work-card').filter({hasText:'Δείγμα κούπας'}).first().locator('.work-open').click(); const lb=await page.evaluate(()=>!document.querySelector('#lightbox')?.hidden); if(!lb){report.ok=false;report.issues.push({type:'lightbox'})} await page.keyboard.press('Escape');}
   if(route==='/'&&w===390){await page.click('.menu-toggle'); const open=await page.evaluate(()=>document.querySelector('.nav')?.classList.contains('open')); if(!open){report.ok=false;report.issues.push({type:'mobile-menu'})}}
   if(['/','/stampes-dtf-me-to-metro/','/ektyposeis-se-mplouzakia/','/portfolio/','/contact-us/'].includes(route)&&[390,1280].includes(w)) await page.screenshot({path:path.join(outDir,`${w===390?'mobile':'desktop'}-${route.replaceAll('/','_root_')}.png`),fullPage:false});
  } await page.close(); }
 const page=await browser.newPage(); for(const old of ['/dtf-me-to-metro/','/%CF%87%CE%BF%CE%BD%CE%B4%CF%81%CE%B9%CE%BA%CE%AE-2/']){const r=await page.goto(base+old,{waitUntil:'domcontentloaded'}); report.oldRouteFallbacks=report.oldRouteFallbacks||[]; report.oldRouteFallbacks.push({old,status:r&&r.status(),url:page.url()});}
 await page.close(); await browser.close(); fs.writeFileSync(path.join(outDir,'live-qa-report.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify({ok:report.ok,checks:report.checks,issues:report.issues,oldRouteFallbacks:report.oldRouteFallbacks,outDir},null,2));
})();
