const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base='http://127.0.0.1:8765';
const pages=['/','/dtf-me-to-metro/','/services/','/portfolio/','/contact-us/','/χονδρική-2/'];
async function scrollAll(page){
  await page.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=500){window.scrollTo(0,y); await new Promise(r=>setTimeout(r,35));} window.scrollTo(0,0);});
  await page.waitForTimeout(150);
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results=[];
 for (const vp of [{name:'desktop',width:1440,height:1000},{name:'mobile',width:390,height:844},{name:'small-mobile',width:320,height:740}]){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}, deviceScaleFactor:1});
  for (const u of pages){
   await page.goto(base+u,{waitUntil:'networkidle'});
   if ((vp.name==='desktop' && ['/', '/dtf-me-to-metro/'].includes(u)) || (vp.name==='mobile' && ['/', '/contact-us/'].includes(u))) {
    const safe=u==='/'?'home':u.replaceAll('/','_').replaceAll('%','');
    await page.screenshot({path:path.join('qa-screenshots', `${vp.name}${safe}.png`), fullPage:false});
   }
   await scrollAll(page);
   const data=await page.evaluate(()=>{
    const missingImgs=[...document.images].filter(i=>!i.complete || i.naturalWidth===0).map(i=>i.getAttribute('src'));
    const desktopMenuVisible = window.innerWidth>900 ? !!(document.querySelector('.menu-toggle')?.offsetWidth) : null;
    const cta=[...document.querySelectorAll('a,button')].filter(a=>/Προσφορά|Καλέστε|DTF|Μενού/.test(a.textContent||'')).slice(0,8).map(a=>({text:(a.textContent||'').trim(), href:a.href||null, visible:!!(a.offsetWidth&&a.offsetHeight)}));
    return {title:document.title, h1:[...document.querySelectorAll('h1')].map(x=>x.textContent.trim()), scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, missingImgs, cta, desktopMenuVisible};
   });
   if (vp.name==='mobile'){
    await page.click('.menu-toggle');
    data.mobileMenuOpen=await page.locator('.nav.open').count();
   }
   results.push({viewport:vp.name,url:u,...data, overflow:data.scrollWidth-data.clientWidth});
  }
  await page.close();
 }
 await browser.close();
 const bad=results.filter(r=>r.missingImgs.length||r.overflow>2||r.h1.length!==1||(r.viewport==='mobile'&&r.mobileMenuOpen!==1)||(r.desktopMenuVisible===true));
 fs.writeFileSync('qa-report.json', JSON.stringify(results,null,2));
 console.log(JSON.stringify({ok:bad.length===0, count:results.length, bad},null,2));
})();
