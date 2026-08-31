const { chromium } = require('playwright');
const fs = require('fs'); const path = require('path');
const base = 'http://127.0.0.1:8765';
const routes = ['/', '/stampes-dtf-me-to-metro/', '/services/', '/ektyposeis-se-mplouzakia/', '/ektyposeis-se-koupes/', '/diafimistika-eidi/', '/portfolio/', '/ektyposeis-xondrikis/', '/about-us/', '/contact-us/', '/terms-and-conditions/', '/privacy-policy/'];
const widths = [390,768,1280,1440,1920];
const outDir='C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_seo_golive_qa'; fs.mkdirSync(outDir,{recursive:true});
function lum(hex){hex=hex.replace('#',''); const a=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)); return .2126*a[0]+.7152*a[1]+.0722*a[2]}
function ratio(a,b){const x=lum(a),y=lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={ok:true, checks:0, issues:[], screenshots:outDir, contrast:{yellowOnInk:ratio('#f7c600','#0d0e10'), whiteOnInk:ratio('#ffffff','#0d0e10'), inkOnOrange:ratio('#0d0e10','#f47b20'), inkOnPaper:ratio('#0d0e10','#fffaf2')}};
 for(const [name,val] of Object.entries(report.contrast)){ if(val<4.5){report.ok=false; report.issues.push({type:'contrast',name,val});}}
 for(const w of widths){
  const h=w<500?844:(w<900?1024:900); const page=await browser.newPage({viewport:{width:w,height:h}});
  page.on('pageerror',e=>{report.ok=false; report.issues.push({type:'pageerror',width:w,text:String(e)})});
  for(const route of routes){
   const res=await page.goto(base+route,{waitUntil:'networkidle'}); report.checks++;
   if(!res||res.status()!==200){report.ok=false; report.issues.push({type:'http',route,width:w,status:res&&res.status()}); continue;}
   const info=await page.evaluate(()=>{
    const h1=[...document.querySelectorAll('h1')];
    const title=document.title; const desc=document.querySelector('meta[name="description"]')?.content||''; const canon=document.querySelector('link[rel="canonical"]')?.href||'';
    const text=document.body.innerText; const htmlLang=document.documentElement.lang;
    const broken=[...document.images].filter(i=>i.offsetParent!==null && i.complete && i.naturalWidth===0).map(i=>i.src);
    const jsonlds=[...document.querySelectorAll('script[type="application/ld+json"]')].map(s=>s.textContent);
    const titleOver=h1.map(el=>{const r=el.getBoundingClientRect(), pr=el.parentElement.getBoundingClientRect(); return {text:el.innerText, over:Math.max(0,Math.round(r.right-pr.right)), width:Math.round(r.width), parent:Math.round(pr.width)}});
    const revealHero=!!document.querySelector('.hero.reveal,.page-hero.reveal,.contact-hero.reveal');
    return {title,desc,canon,text,htmlLang,broken,jsonlds,titleOver,revealHero,sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth, h1:h1.length, footer:document.querySelector('footer')?.innerText||'', images:[...document.images].map(i=>({src:i.getAttribute('src'),alt:i.getAttribute('alt')||''}))};
   });
   if(info.htmlLang!=='el'){report.ok=false; report.issues.push({type:'lang',route,width:w,lang:info.htmlLang});}
   if(info.h1!==1){report.ok=false; report.issues.push({type:'h1',route,width:w,h1:info.h1});}
   if(info.sw>info.cw+2){report.ok=false; report.issues.push({type:'overflow',route,width:w,sw:info.sw,cw:info.cw});}
   if(info.broken.length){report.ok=false; report.issues.push({type:'broken-images',route,width:w,broken:info.broken});}
   for(const o of info.titleOver){ if(o.over>0){report.ok=false; report.issues.push({type:'title-overflow',route,width:w,...o});}}
   if(info.revealHero){report.ok=false; report.issues.push({type:'above-fold-reveal',route,width:w});}
   if(info.footer.includes('Static preview')||info.footer.includes('Δημιουργός')){report.ok=false; report.issues.push({type:'preview-footer-copy',route,width:w});}
   if(route==='/stampes-dtf-me-to-metro/'){
    if(!info.title.toLowerCase().startsWith('στάμπες dtf με το μέτρο')){report.ok=false; report.issues.push({type:'dtf-title',title:info.title});}
    if(!info.desc.includes('Στάμπες DTF με το μέτρο')){report.ok=false; report.issues.push({type:'dtf-meta',desc:info.desc});}
    if(!info.text.includes('Στάμπες DTF με το μέτρο')){report.ok=false; report.issues.push({type:'dtf-phrase-visible'});}
    let types=[]; for(const s of info.jsonlds){try{const j=JSON.parse(s); for(const n of (j['@graph']||[])) types.push(n['@type']);}catch(e){report.ok=false; report.issues.push({type:'jsonld-parse',route,error:String(e)});}}
    for(const t of ['LocalBusiness','BreadcrumbList','Service','FAQPage']) if(!types.includes(t)){report.ok=false; report.issues.push({type:'schema-missing',route,t});}
    await page.fill('#calcWidth','28'); await page.fill('#calcHeight','35'); await page.fill('#calcQty','40'); await page.fill('#calcPrice','12'); const calc=await page.locator('#calcResult').textContent(); if(!calc.includes('τρέχοντα μέτρα')){report.ok=false; report.issues.push({type:'calculator',calc});}
   }
   if(route==='/ektyposeis-se-mplouzakia/') for(const term of ['φούτερ','ζακέτες','γιλέκα εργασίας','μπουφάν']) if(!info.text.toLowerCase().includes(term)){report.ok=false; report.issues.push({type:'apparel-term',term});}
   if(route==='/portfolio/'&&w===1280){await page.click('.filter-btn[data-filter="Κούπες"]'); const visible=await page.evaluate(()=>[...document.querySelectorAll('.work-card')].filter(c=>getComputedStyle(c).display!=='none').length); if(visible<1){report.ok=false; report.issues.push({type:'portfolio-filter'});} await page.locator('.work-card').filter({hasText:'Δείγμα κούπας'}).first().locator('.work-open').click(); const lb=await page.evaluate(()=>!document.querySelector('#lightbox')?.hidden); if(!lb){report.ok=false; report.issues.push({type:'lightbox'});} await page.keyboard.press('Escape');}
   if(route==='/'&&w===390){await page.click('.menu-toggle'); const open=await page.evaluate(()=>document.querySelector('.nav')?.classList.contains('open')); if(!open){report.ok=false; report.issues.push({type:'mobile-menu'});}}
   if(['/','/stampes-dtf-me-to-metro/','/ektyposeis-se-mplouzakia/','/portfolio/','/contact-us/'].includes(route) && [390,1280].includes(w)) await page.screenshot({path:path.join(outDir,`${w===390?'mobile':'desktop'}-${route.replaceAll('/','_root_')}.png`),fullPage:false});
  }
  await page.close();
 }
 const extra=await browser.newPage({viewport:{width:1280,height:800}});
 for(const old of ['/dtf-me-to-metro/','/%CF%87%CE%BF%CE%BD%CE%B4%CF%81%CE%B9%CE%BA%CE%AE-2/']){const r=await extra.goto(base+old,{waitUntil:'domcontentloaded'}); report.redirectFallbacks=report.redirectFallbacks||[]; report.redirectFallbacks.push({old,status:r&&r.status(),url:extra.url()});}
 await extra.close(); await browser.close();
 fs.writeFileSync(path.join(outDir,'qa-report.json'),JSON.stringify(report,null,2)); console.log(JSON.stringify({ok:report.ok,checks:report.checks,issues:report.issues,contrast:report.contrast,outDir},null,2));
})();
