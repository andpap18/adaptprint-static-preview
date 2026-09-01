const { chromium } = require('playwright');
const base='http://127.0.0.1:8765';
const routes=['/','/stampes-dtf-me-to-metro/','/services/','/ektyposeis-se-mplouzakia/','/ektyposeis-se-koupes/','/diafimistika-eidi/','/portfolio/','/ektyposeis-xondrikis/','/about-us/','/contact-us/','/terms-and-conditions/','/privacy-policy/'];
const widths=[390,768,1280,1440,1920];
const forbidden=['WordPress','νέο site','μεταφέρεται','schema','preview','slug','canonical','SEO','Προβάλλουμε'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const issues=[]; let fontRequests=0;
 page.on('response',r=>{ if(r.url().includes('/assets/fonts/')) fontRequests++; });
 for(const route of routes){
   await page.goto(base+route,{waitUntil:'networkidle'});
   const text=await page.$$eval('main,header,footer', els=>els.map(e=>e.innerText||'').join('\n'));
   for(const w of forbidden){ if(text.includes(w)) issues.push({type:'forbidden-visible',route,w}); }
   const brandSpan=await page.locator('.brand-lockup span').count(); if(brandSpan) issues.push({type:'brand-span',route});
   if(route==='/' && await page.locator('.breadcrumbs').count()) issues.push({type:'home-breadcrumb'});
   if(route!=='/' && !(await page.locator('.breadcrumbs').count())) issues.push({type:'missing-breadcrumb',route});
   const dup=await page.$$eval('select',sels=>sels.map(s=>{const vals=[...s.options].map(o=>o.textContent.trim()).filter(Boolean); return vals.filter((v,i)=>vals.indexOf(v)!==i)}).flat());
   if(dup.length) issues.push({type:'duplicate-select',route,dup});
   const maxCardTitle=await page.$$eval('.service-tile h3,.shop-card h2,.shop-card h3,.info-cluster h2,.process-step h3',els=>Math.max(0,...els.map(e=>parseFloat(getComputedStyle(e).fontSize))));
   if(maxCardTitle>24.5) issues.push({type:'large-card-title',route,maxCardTitle});
   const zeroR=await page.$$eval('.process-step',els=>els.map(e=>getComputedStyle(e).borderRadius));
   if(zeroR.some(r=>parseFloat(r)===0)) issues.push({type:'zero-radius-process',route,zeroR});
   for(const width of widths){
     await page.setViewportSize({width,height:900}); await page.goto(base+route+'?w='+width,{waitUntil:'networkidle'});
     const ov=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,off:[...document.querySelectorAll('body *')].filter(e=>e.getBoundingClientRect().right>document.documentElement.clientWidth+3).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,right:e.getBoundingClientRect().right,cw:document.documentElement.clientWidth}))}));
     if(ov.sw>ov.cw+2) issues.push({type:'overflow',route,width,ov});
   }
 }
 await page.setViewportSize({width:1280,height:900}); await page.goto(base+'/?fontcheck=1',{waitUntil:'networkidle'});
 const font=await page.evaluate(async()=>{await document.fonts.ready; const sample='Η Adapt Print στον Πειραιά'; const h1=document.querySelector('h1'); return {family:getComputedStyle(h1).fontFamily, weight:getComputedStyle(h1).fontWeight, check:document.fonts.check('700 20px Manrope', sample), sample};});
 if(!font.check || !font.family.includes('Manrope')) issues.push({type:'font',font});
 const countUpRating=await page.locator('[data-count="5.0"]').count(); if(countUpRating) issues.push({type:'animated-rating-countup'});
 console.log(JSON.stringify({ok:issues.length===0, issueCount:issues.length, fontRequests, font, issues:issues.slice(0,30)},null,2));
 await browser.close(); process.exit(issues.length?1:0);
})();
