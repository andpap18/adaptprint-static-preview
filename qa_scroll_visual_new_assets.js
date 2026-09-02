const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async()=>{
 const out=path.join(process.env.LOCALAPPDATA || 'C:/Users/andpa/AppData/Local','hermes/cache/adaptprint_new_assets_scroll_qa');
 fs.mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true});
 const page=await browser.newPage({viewport:{width:390,height:900}, deviceScaleFactor:1, isMobile:true});
 for (const [url,name,selector] of [
   ['http://127.0.0.1:8765/','home-selected-proof','.selected-work'],
   ['http://127.0.0.1:8765/portfolio/','portfolio-grid','.portfolio-section'],
   ['http://127.0.0.1:8765/services/','services-grid','.service-catalog'],
 ]){
   await page.goto(url,{waitUntil:'domcontentloaded'});
   await page.waitForTimeout(500);
   await page.evaluate(async()=>{
     for (let y=0;y<document.documentElement.scrollHeight;y+=500){ window.scrollTo(0,y); await new Promise(r=>setTimeout(r,130)); }
     window.scrollTo(0,0);
     const imgs=[...document.images].filter(i=>i.src);
     await Promise.race([Promise.all(imgs.map(i=>i.decode().catch(()=>null))), new Promise(r=>setTimeout(r,5000))]);
   });
   const loc=page.locator(selector).first();
   await loc.scrollIntoViewIfNeeded();
   await page.waitForTimeout(600);
   await loc.screenshot({path:path.join(out,name+'.png')});
 }
 await browser.close();
 console.log(JSON.stringify({ok:true,out},null,2));
})();
