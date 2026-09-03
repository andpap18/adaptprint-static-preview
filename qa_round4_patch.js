const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.env.QA_BASE || 'http://127.0.0.1:8765';
const tag = process.env.QA_TAG || 'round4_patch_local';
const out = path.join(process.env.LOCALAPPDATA || process.env.TEMP || '.', 'hermes/cache/adaptprint_'+tag);
fs.mkdirSync(out, {recursive:true});
function px(n){ return Math.round(n || 0); }
(async()=>{
 const browser = await chromium.launch({headless:true});
 const widths = [390,768,1024,1100,1180,1280,1440,1920];
 const results=[];
 for(const w of widths){
  const page = await browser.newPage({viewport:{width:w,height:w===390?900:900}, deviceScaleFactor:1});
  await page.goto(base+'/?v='+Date.now(), {waitUntil:'networkidle'});
  await page.evaluate(()=>window.scrollTo(0,0));
  await page.waitForTimeout(250);
  const m = await page.evaluate(()=>{
   const cs = el => getComputedStyle(el);
   const rect = el => { const r=el.getBoundingClientRect(); return {x:r.x,y:r.y,width:r.width,height:r.height,top:r.top,bottom:r.bottom}; };
   const topbar=document.querySelector('.topbar'), header=document.querySelector('.site-header'), hero=document.querySelector('.hero');
   const firstImg=[...document.querySelectorAll('.hero img')].map(img=>({img,r:rect(img)})).filter(x=>x.img.naturalWidth>0&&x.r.width>40&&x.r.height>40).sort((a,b)=>a.r.top-b.r.top)[0];
   const chips=[...document.querySelectorAll('.hero-service-strip a')].map(a=>({text:a.textContent.trim(),display:cs(a).display,padding:cs(a).padding,borderRadius:cs(a).borderRadius,textDecoration:cs(a).textDecorationLine,rect:rect(a)}));
   const stats=[...document.querySelectorAll('.trust-metrics-strip span')].map(a=>({text:a.textContent.replace(/\s+/g,' ').trim(),display:cs(a).display,padding:cs(a).padding,borderRadius:cs(a).borderRadius,rect:rect(a)}));
   const fw=document.querySelector('.floating-whatsapp');
   const serviceGrid=document.querySelector('.service-catalog');
   const heads=[...document.querySelectorAll('h1,h2,h3')].map(h=>({text:h.innerText,hyphens:cs(h).hyphens,webkit:cs(h).webkitHyphens,rect:rect(h)}));
   const darkButtons=[...document.querySelectorAll('.final-panel .btn,.ink-band .btn,.page-hero-dark .btn,.social-proof .btn')].map((b,i)=>({i,text:b.textContent.replace(/\s+/g,' ').trim(),color:cs(b).color,backgroundColor:cs(b).backgroundColor,rect:rect(b)}));
   return {
    width:innerWidth,
    headerHeight:Math.round((header?header.getBoundingClientRect().height:0)+(topbar&&cs(topbar).display!=='none'?topbar.getBoundingClientRect().height:0)),
    pageHeight:document.documentElement.scrollHeight,
    firstHeroImageTop:firstImg?Math.round(firstImg.r.top):null,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    heroMajorCount:(hero?[...hero.querySelectorAll('h1,p,.kicker,.hero-actions .btn,.product')].filter(el=>cs(el).display!=='none').length:null),
    chips, stats,
    floating:fw?{display:cs(fw).display, position:cs(fw).position, zIndex:cs(fw).zIndex, text:fw.textContent.trim(), aria:fw.getAttribute('aria-label'), rect:rect(fw)}:null,
    serviceCols:serviceGrid?new Set([...serviceGrid.children].map(c=>Math.round(c.getBoundingClientRect().left))).size:null,
    badHyphens:heads.filter(h=>h.hyphens!=='none'||(h.webkit&&h.webkit!=='none')).map(h=>h.text),
    forbidden:{flagship:document.body.innerText.includes('Σελίδα-ναυαρχίδα'),realPrint:document.body.innerText.includes('Real print work'),year2025:document.body.innerText.includes('© 2025')},
    darkButtons
   };
  });
  results.push(m);
  const strip = page.locator('.hero-service-strip').first();
  if(await strip.count()){ await strip.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); }
  if(w===390){ await page.screenshot({path:path.join(out,'post-hero-mobile-390.png'), fullPage:false}); }
  if(w===1440){
    await page.screenshot({path:path.join(out,'post-hero-desktop-1440.png'), fullPage:false});
    await page.locator('.floating-whatsapp').screenshot({path:path.join(out,'floating-whatsapp-1440.png')}).catch(()=>{});
    const fp = page.locator('.final-panel').first(); if(await fp.count()){ await fp.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await page.screenshot({path:path.join(out,'dark-panel-1440.png'), fullPage:false}); }
    const sp = page.locator('.social-proof').first(); if(await sp.count()){ await sp.scrollIntoViewIfNeeded(); await page.waitForTimeout(150); await page.screenshot({path:path.join(out,'reviews-panel-1440.png'), fullPage:false}); }
  }
  await page.close();
 }
 const routePage = await browser.newPage({viewport:{width:1280,height:900}});
 const routes = {};
 for(const u of ['/ektyposeis-se-koupes/','/sublimation-se-koupes-mpoukalia-yfasma/','/diafimistika-eidi/','/anaglyfi-uv-ektyposi-diafimistika/']){
  const res = await routePage.goto(base+u+'?v='+Date.now(), {waitUntil:'networkidle'}).catch(e=>null);
  await routePage.waitForTimeout(250);
  routes[u] = await routePage.evaluate((u)=>({
    url: location.pathname,
    statusText: document.title,
    canonical: document.querySelector('link[rel="canonical"]')?.href || null,
    robots: document.querySelector('meta[name="robots"]')?.content || null,
    refresh: document.querySelector('meta[http-equiv="refresh"]')?.content || null,
    h1: document.querySelector('h1')?.innerText || null,
    serviceSchema: [...document.querySelectorAll('script[type="application/ld+json"]')].some(s=>s.textContent.includes('"@type": "Service"') || s.textContent.includes('"@type":"Service"')),
    breadcrumbs: !!document.querySelector('.breadcrumbs'),
    linksToUV: [...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/anaglyfi-uv-ektyposi-diafimistika/'),
    linksToAds: [...document.querySelectorAll('a')].some(a=>a.getAttribute('href')==='/diafimistika-eidi/')
  }), u).catch(e=>({error:String(e), status:res?.status()}));
 }
 await routePage.close();
 await browser.close();
 const report={base,out,results,routes};
 fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})();
