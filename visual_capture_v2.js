const { chromium } = require('playwright');
const fs=require('fs');
const shots=[{name:'home-desktop-full-static-header',url:'/',w:1440,h:1200,full:true},{name:'home-mobile-full-static-header',url:'/',w:390,h:844,full:true},{name:'home-tablet-full-static-header',url:'/',w:768,h:1024,full:true},{name:'portfolio-desktop-full-static-header',url:'/portfolio/',w:1440,h:1000,full:true},{name:'contact-desktop-full-static-header',url:'/contact-us/',w:1440,h:1000,full:true},{name:'home-desktop-fold',url:'/',w:1440,h:1000,full:false}];
async function loadAllImages(page){
 await page.evaluate(async()=>{
  for(let y=0;y<document.body.scrollHeight;y+=250){scrollTo(0,y); await new Promise(r=>setTimeout(r,130));}
  await Promise.all([...document.images].map(img=>{
    if(img.loading==='lazy') img.loading='eager';
    if(img.complete && img.naturalWidth>0) return Promise.resolve();
    return img.decode ? img.decode().catch(()=>{}) : new Promise(res=>{img.onload=res;img.onerror=res;});
  }));
  scrollTo(0,0); await new Promise(r=>setTimeout(r,500));
 });
}
(async()=>{const browser=await chromium.launch({headless:true});fs.mkdirSync('qa-screenshots/final-clean-v2',{recursive:true});const report=[];for(const s of shots){const p=await browser.newPage({viewport:{width:s.w,height:s.h}, deviceScaleFactor:1});await p.goto('http://127.0.0.1:8765'+s.url,{waitUntil:'networkidle',timeout:60000});await loadAllImages(p);await p.addStyleTag({content:'.site-header{position:static!important}.topbar{position:static!important}' });const imgs=await p.evaluate(()=>[...document.images].map(i=>({src:(i.currentSrc||i.src).split('/').pop(),ok:i.complete&&i.naturalWidth>0,nw:i.naturalWidth,nh:i.naturalHeight})));await p.screenshot({path:`qa-screenshots/final-clean-v2/${s.name}.png`,fullPage:s.full});report.push({name:s.name,bad:imgs.filter(i=>!i.ok)});await p.close();}await browser.close();console.log(JSON.stringify({ok:report.every(r=>r.bad.length===0),report},null,2));})();
