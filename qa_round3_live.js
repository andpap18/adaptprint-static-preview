const { chromium } = require('playwright');
const base='https://andpap18.github.io/adaptprint-static-preview';
const routes=['/','/stampes-dtf-me-to-metro/','/services/','/ektyposeis-se-mplouzakia/','/ektyposeis-se-koupes/','/diafimistika-eidi/','/portfolio/','/ektyposeis-xondrikis/','/about-us/','/contact-us/','/terms-and-conditions/','/privacy-policy/'];
const widths=[390,768,1280,1440,1920];
const forbidden=['WordPress','νέο site','μεταφέρεται','schema','preview','slug','canonical','SEO','Προβάλλουμε'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const issues=[]; let fontRequests=0;
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 page.on('response',r=>{ if(r.url().includes('/assets/fonts/')) fontRequests++; });
 for(const route of routes){
  await page.goto(base+route+'?v=46284b8',{waitUntil:'networkidle'});
  const status=await page.evaluate(()=>document.readyState);
  const text=await page.locator('main,header,footer').innerText().catch(()=>page.locator('body').innerText());
  for(const w of forbidden){ if(text.includes(w)) issues.push({type:'forbidden',route,w}); }
  if(route==='/' && await page.locator('.breadcrumbs').count()) issues.push({type:'home-breadcrumb'});
  if(route!=='/' && !(await page.locator('.breadcrumbs').count())) issues.push({type:'missing-breadcrumb',route});
  const dup=await page.$$eval('select',sels=>sels.map(s=>{const vals=[...s.options].map(o=>o.textContent.trim()).filter(Boolean); return vals.filter((v,i)=>vals.indexOf(v)!==i)}).flat());
  if(dup.length) issues.push({type:'duplicate-select',route,dup});
  const maxCardTitle=await page.$$eval('.shop-card h2,.shop-card h3,.info-cluster h2,.process-step h3',els=>Math.max(0,...els.map(e=>parseFloat(getComputedStyle(e).fontSize))));
  if(maxCardTitle>24.5) issues.push({type:'large-card-title',route,maxCardTitle});
  const radii=await page.$$eval('.process-step,.shop-card,.info-cluster article,.visual-card',els=>els.map(e=>getComputedStyle(e).borderRadius));
  if(radii.some(r=>parseFloat(r)===0)) issues.push({type:'zero-radius-card',route,radii});
  if(route==='/' && (await page.locator('svg').count())<12) issues.push({type:'few-svg'});
  for(const width of widths){
    await page.setViewportSize({width,height:900}); await page.goto(base+route+'?w='+width+'&v=46284b8',{waitUntil:'networkidle'});
    const ov=await page.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,off:[...document.querySelectorAll('body *')].filter(e=>e.scrollWidth>e.clientWidth+3 || e.getBoundingClientRect().right>document.documentElement.clientWidth+3).slice(0,5).map(e=>({tag:e.tagName,cls:e.className,sw:e.scrollWidth,cw:e.clientWidth,right:e.getBoundingClientRect().right}))}));
    if(ov.sw>ov.cw+2) issues.push({type:'overflow',route,width,ov});
  }
 }
 await page.setViewportSize({width:1280,height:900}); await page.goto(base+'/?fontcheck=1',{waitUntil:'networkidle'});
 const font=await page.evaluate(async()=>{await document.fonts.ready; const el=[...document.querySelectorAll('h1')].find(e=>e.textContent.includes('Adapt Print'))||document.querySelector('h1'); const sample='Η Adapt Print στον Πειραιά'; return {family:getComputedStyle(el).fontFamily,check:document.fonts.check('700 20px Manrope', sample),text:sample};});
 if(!font.check || !font.family.includes('Manrope')) issues.push({type:'font',font});
 const logo=await page.locator('.brand-lockup span').count(); if(logo) issues.push({type:'brand-span'});
 console.log(JSON.stringify({ok:issues.length===0,issueCount:issues.length,fontRequests,font,issues:issues.slice(0,20)},null,2));
 await browser.close();
 process.exit(issues.length?1:0);
})();
