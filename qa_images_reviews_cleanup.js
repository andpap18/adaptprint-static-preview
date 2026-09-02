const { chromium } = require('playwright');
const fs=require('fs'), path=require('path');
const base='http://127.0.0.1:8765';
const routes=['/','/stampes-dtf-me-to-metro/','/services/','/ektyposeis-se-mplouzakia/','/ektyposeis-se-koupes/','/diafimistika-eidi/','/portfolio/','/ektyposeis-xondrikis/','/about-us/','/contact-us/','/terms-and-conditions/','/privacy-policy/'];
const widths=[390,768,1280,1440,1920];
(async()=>{
 const out='C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_images_reviews_cleanup'; fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({headless:true}); const issues=[]; const perPage={};
 for(const route of routes){
  const p=await b.newPage({viewport:{width:390,height:1000}, isMobile:true}); await p.goto(base+route,{waitUntil:'networkidle'});
  const imgs=await p.$$eval('main img', els=>els.map(e=>({src:e.currentSrc||e.src, alt:e.alt, box:(()=>{const r=e.getBoundingClientRect(); return {w:Math.round(r.width),h:Math.round(r.height),top:Math.round(r.top)}})()})));
  const names=imgs.map(i=>i.src.split('/assets/images/').pop()?.split('?')[0]||i.src);
  perPage[route]=names;
  const red=names.filter(n=>/redacted|blur/i.test(n)); if(red.length) issues.push({type:'redacted-or-blur-ref',route,red});
  const counts={}; for(const n of names){ if(!/logo/i.test(n)) counts[n]=(counts[n]||0)+1; }
  for(const [n,c] of Object.entries(counts)){ if(c>1) issues.push({type:'duplicate-image-same-page',route,n,c}); }
  for(const width of widths){ await p.setViewportSize({width,height:900}); await p.goto(base+route+'?w='+width,{waitUntil:'networkidle'}); const ov=await p.evaluate(()=>({sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth})); if(ov.sw>ov.cw+2) issues.push({type:'overflow',route,width,ov}); }
  await p.close();
 }
 const p=await b.newPage({viewport:{width:390,height:900}, isMobile:true}); await p.goto(base+'/',{waitUntil:'networkidle'});
 await p.screenshot({path:path.join(out,'home-mobile-full.png'),fullPage:true});
 await p.locator('.trust-strip').screenshot({path:path.join(out,'home-trust-strip.png')});
 await p.locator('.social-proof').first().screenshot({path:path.join(out,'home-reviews.png')});
 await p.locator('.service-catalog').screenshot({path:path.join(out,'home-services.png')});
 await p.goto(base+'/ektyposeis-se-koupes/',{waitUntil:'networkidle'}); await p.screenshot({path:path.join(out,'mugs-mobile.png'),fullPage:true});
 await p.goto(base+'/diafimistika-eidi/',{waitUntil:'networkidle'}); await p.screenshot({path:path.join(out,'promo-mobile.png'),fullPage:true});
 await p.goto(base+'/portfolio/',{waitUntil:'networkidle'}); await p.screenshot({path:path.join(out,'portfolio-mobile.png'),fullPage:true});
 await b.close(); console.log(JSON.stringify({ok:issues.length===0, issueCount:issues.length, issues:issues.slice(0,40), perPage, out},null,2)); process.exit(issues.length?1:0);
})();
