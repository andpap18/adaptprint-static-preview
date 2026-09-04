const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const out = 'C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_round8_artifacts';
fs.mkdirSync(out,{recursive:true});
const base='http://127.0.0.1:8765';
async function shot(page,name,full=false){const p=path.join(out,name); await page.screenshot({path:p,fullPage:full}); return p;}
(async()=>{
 const browser=await chromium.launch({headless:true});
 const artifacts=[];
 for(const [w,h,name] of [[1920,1080,'home_1920_fullbleed.png'],[1440,1000,'home_1440_fullbleed.png'],[390,900,'home_390_mobile_no_overflow.png']]){
  const page=await browser.newPage({viewport:{width:w,height:h}}); await page.goto(base+'/',{waitUntil:'networkidle'}); artifacts.push(await shot(page,name,false)); await page.close();
 }
 for(const [url,name] of [['/terms-and-conditions/','legal_terms_full.png'],['/privacy-policy/','legal_privacy_full.png']]){
  const page=await browser.newPage({viewport:{width:1440,height:1400}}); await page.goto(base+url,{waitUntil:'networkidle'}); artifacts.push(await shot(page,name,true)); await page.close();
 }
 for(const [w,h,name] of [[1440,900,'scroll_desktop.webm'],[390,900,'scroll_mobile.webm']]){
  const ctx=await browser.newContext({viewport:{width:w,height:h}, recordVideo:{dir:out,size:{width:w,height:h}}});
  const page=await ctx.newPage(); await page.goto(base+'/',{waitUntil:'networkidle'}); await page.waitForTimeout(800); for(let y of [500,1200,2100,3200]){await page.evaluate(y=>window.scrollTo({top:y,behavior:'smooth'}),y); await page.waitForTimeout(900);} await page.close(); await ctx.close();
  const vids=fs.readdirSync(out).filter(f=>f.endsWith('.webm')).map(f=>path.join(out,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs); if(vids[0]){const target=path.join(out,name); fs.renameSync(vids[0],target); artifacts.push(target);}
 }
 const ctx=await browser.newContext({viewport:{width:390,height:900}, recordVideo:{dir:out,size:{width:390,height:900}}});
 const page=await ctx.newPage(); await page.goto(base+'/',{waitUntil:'networkidle'});
 await page.click('.menu-toggle'); await page.waitForTimeout(700); await page.mouse.click(8,500); await page.waitForTimeout(500);
 await page.click('.menu-toggle'); await page.waitForTimeout(500); await page.click('.nav a[href="/services/"]'); await page.waitForTimeout(700);
 await page.goto(base+'/',{waitUntil:'networkidle'}); await page.click('.menu-toggle'); await page.waitForTimeout(500); await page.keyboard.press('Escape'); await page.waitForTimeout(500);
 await page.close(); await ctx.close();
 const vids=fs.readdirSync(out).filter(f=>f.endsWith('.webm')).map(f=>path.join(out,f)).sort((a,b)=>fs.statSync(b).mtimeMs-fs.statSync(a).mtimeMs); if(vids[0]){const target=path.join(out,'mobile_menu_close_methods.webm'); fs.renameSync(vids[0],target); artifacts.push(target);}
 await browser.close();
 console.log(JSON.stringify({out,artifacts},null,2));
})();
