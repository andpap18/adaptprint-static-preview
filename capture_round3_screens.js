const { chromium } = require('playwright');
const path=require('path');
(async()=>{
 const out='C:/Users/andpa/AppData/Local/hermes/cache/adaptprint_round3_screens';
 const browser=await chromium.launch({headless:true});
 const targets=[
  ['before-home-header','https://andpap18.github.io/adaptprint-static-preview/',1280,820],
  ['before-home-reviews','https://andpap18.github.io/adaptprint-static-preview/',1280,900,'.social-proof'],
  ['after-home-header','http://127.0.0.1:8765/',1280,820],
  ['after-home-reviews','http://127.0.0.1:8765/',1280,900,'.social-proof'],
  ['after-home-full-mobile','http://127.0.0.1:8765/',390,1600],
  ['after-dtf-video','http://127.0.0.1:8765/stampes-dtf-me-to-metro/',1280,1100,'.media-feature'],
  ['after-footer-logo','http://127.0.0.1:8765/',1280,900,'.site-footer']
 ];
 require('fs').mkdirSync(out,{recursive:true});
 const made=[];
 for(const [name,url,w,h,sel] of targets){
  const page=await browser.newPage({viewport:{width:w,height:h}, deviceScaleFactor:1});
  await page.goto(url,{waitUntil:'networkidle'});
  if(sel){ const loc=page.locator(sel).first(); await loc.scrollIntoViewIfNeeded(); await page.waitForTimeout(300); await loc.screenshot({path:path.join(out,name+'.png')}); }
  else await page.screenshot({path:path.join(out,name+'.png'), fullPage:false});
  made.push(path.join(out,name+'.png'));
  await page.close();
 }
 await browser.close();
 console.log(JSON.stringify({out,made},null,2));
})();
