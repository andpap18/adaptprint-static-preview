const { chromium } = require('playwright');
const fs=require('fs');
const path=require('path');
const base='http://127.0.0.1:8765';
const viewports=[{name:'desktop',width:1440,height:1200},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844},{name:'small',width:320,height:740},{name:'wide',width:1920,height:1100}];
(async()=>{
 const browser=await chromium.launch({headless:true});
 fs.mkdirSync('qa-screenshots/ui-pass-current',{recursive:true});
 const results=[];
 for(const vp of viewports){
  const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}, deviceScaleFactor:1});
  await page.goto(base+'/',{waitUntil:'networkidle'});
  await page.screenshot({path:`qa-screenshots/ui-pass-current/home-${vp.name}-full.png`, fullPage:true});
  const m=await page.evaluate(()=>{
   const sec=[...document.querySelectorAll('main > section')].map((s,i)=>{const r=s.getBoundingClientRect(); return {i, cls:s.className, top:Math.round(r.top+scrollY), h:Math.round(r.height), first:(s.querySelector('h1,h2,h3')?.textContent||'').trim(), buttons:[...s.querySelectorAll('a.btn,button.btn')].map(b=>({text:b.textContent.trim(), x:Math.round(b.getBoundingClientRect().left), y:Math.round(b.getBoundingClientRect().top+scrollY)}))};});
   return {title:document.title, scrollWidth:document.documentElement.scrollWidth, clientWidth:document.documentElement.clientWidth, headerH:Math.round(document.querySelector('.site-header')?.getBoundingClientRect().height||0), topbarH:Math.round(document.querySelector('.topbar')?.getBoundingClientRect().height||0), sections:sec};
  });
  results.push({viewport:vp,...m, overflow:m.scrollWidth-m.clientWidth});
  await page.close();
 }
 await browser.close();
 fs.writeFileSync('qa-screenshots/ui-pass-current/metrics.json',JSON.stringify(results,null,2));
 console.log(JSON.stringify({ok:true, results:results.map(r=>({viewport:r.viewport.name, overflow:r.overflow, headerH:r.headerH, topbarH:r.topbarH, sections:r.sections.length}))},null,2));
})();
