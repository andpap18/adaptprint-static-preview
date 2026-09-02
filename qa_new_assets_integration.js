const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = 'http://127.0.0.1:8765';
const routes = ['/', '/stampes-dtf-me-to-metro/', '/services/', '/ektyposeis-se-mplouzakia/', '/ektyposeis-se-koupes/', '/diafimistika-eidi/', '/anaglyfi-uv-ektyposi-diafimistika/', '/sublimation-se-koupes-mpoukalia-yfasma/', '/portfolio/', '/ektyposeis-xondrikis/', '/about-us/', '/contact-us/', '/privacy-policy/', '/terms-and-conditions/'];
(async()=>{
  const browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:390,height:900}, deviceScaleFactor:1, isMobile:true});
  const outDir = path.join(process.env.LOCALAPPDATA || 'C:/Users/andpa/AppData/Local', 'hermes/cache/adaptprint_new_assets_site_qa');
  fs.mkdirSync(outDir,{recursive:true});
  const issues=[]; const summaries=[];
  for (const r of routes){
    const resp = await page.goto(base+r, {waitUntil:'domcontentloaded', timeout:30000});
    if(!resp || resp.status()>=400) issues.push({route:r,type:'bad_status',status:resp&&resp.status()});
    await page.waitForTimeout(500);
    const data = await page.evaluate(async()=>{
      const imgs=[...document.images].filter(img=>img.getAttribute('src'));
      const srcs=imgs.map(img=>img.getAttribute('src')).filter(Boolean);
      const broken=[];
      await Promise.all([...new Set(srcs)].map(async src=>{
        try{
          const u = new URL(src, location.href).href;
          const res = await fetch(u, {method:'GET', cache:'no-store'});
          if(!res.ok) broken.push(src+' status '+res.status);
        }catch(e){ broken.push(src+' '+e.message); }
      }));
      const counts={}; srcs.forEach(s=>counts[s]=(counts[s]||0)+1);
      const duplicates=Object.entries(counts).filter(([k,v])=>v>1 && !k.includes('logo'));
      const clientNew=srcs.filter(s=>s.includes('/client-new/'));
      const redacted=srcs.filter(s=>/redacted|blur/i.test(s));
      const overflow=document.documentElement.scrollWidth - document.documentElement.clientWidth;
      const h1=document.querySelectorAll('h1').length;
      const canonical=document.querySelector('link[rel="canonical"]')?.href || '';
      const nav=[...document.querySelectorAll('.nav-link')].map(a=>a.getAttribute('href'));
      return {broken,duplicates,clientNew,redacted,overflow,h1,canonical,nav,imgCount:srcs.length,title:document.title};
    });
    summaries.push({route:r,...data});
    if(data.broken.length) issues.push({route:r,type:'broken_images',items:data.broken});
    if(data.redacted.length) issues.push({route:r,type:'redacted_or_blur_refs',items:data.redacted});
    if(data.overflow>2) issues.push({route:r,type:'mobile_overflow',overflow:data.overflow});
    if(data.h1!==1) issues.push({route:r,type:'h1_count',h1:data.h1});
    if(!data.canonical.startsWith('https://adaptprint.gr')) issues.push({route:r,type:'canonical',canonical:data.canonical});
    if(['/','/services/','/portfolio/','/anaglyfi-uv-ektyposi-diafimistika/','/sublimation-se-koupes-mpoukalia-yfasma/'].includes(r)){
      await page.screenshot({path:path.join(outDir, r==='/'?'home-mobile.png':r.replaceAll('/','_')+'mobile.png'), fullPage:true});
    }
  }
  await browser.close();
  const result={ok:issues.length===0, route_count:routes.length, summaries, issues, outDir};
  fs.writeFileSync(path.join(outDir,'qa-result.json'), JSON.stringify(result,null,2));
  console.log(JSON.stringify({ok:result.ok, route_count:routes.length, issues, outDir},null,2));
  process.exit(result.ok?0:1);
})();
