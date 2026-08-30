const { chromium } = require('playwright');
const fs=require('fs');
const pages=['/','/dtf-me-to-metro/','/services/','/ektyposeis-se-mplouzakia/','/ektyposeis-se-koupes/','/diafimistika-eidi/','/portfolio/','/χονδρική-2/','/about-us/','/contact-us/','/terms-and-conditions/','/privacy-policy/'];
const vps=[{name:'desktop',width:1440,height:1000},{name:'tablet',width:768,height:1024},{name:'mobile',width:390,height:844},{name:'small',width:320,height:740},{name:'wide',width:1920,height:1100}];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const bad=[]; let count=0;
 for(const pagePath of pages){
  for(const vp of vps){
   const page=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
   const errors=[];
   page.on('pageerror',e=>errors.push(String(e)));
   page.on('requestfailed',r=>{ if(!r.url().startsWith('mailto:')&&!r.url().startsWith('tel:')) errors.push('request failed '+r.url()) });
   await page.goto('http://127.0.0.1:8765'+pagePath,{waitUntil:'networkidle',timeout:60000});
   await page.evaluate(async()=>{ for(let y=0;y<document.body.scrollHeight;y+=300){scrollTo(0,y); await new Promise(r=>setTimeout(r,120));} await new Promise(r=>setTimeout(r,600)); scrollTo(0,0); await new Promise(r=>setTimeout(r,120)); });
   const res=await page.evaluate(()=>{
    const overflow=document.documentElement.scrollWidth-document.documentElement.clientWidth;
    const imgs=[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.currentSrc||i.src);
    const h1=document.querySelectorAll('h1').length;
    const desc=!!document.querySelector('meta[name="description"]');
    const canon=!!document.querySelector('link[rel="canonical"]');
    const telBad=[...document.querySelectorAll('a[href^="tel:"]')].filter(a=>a.getAttribute('href').includes('*')).map(a=>a.outerHTML);
    const missingDim=[...document.images].filter(i=>!i.hasAttribute('width')||!i.hasAttribute('height')).map(i=>i.src);
    return {overflow, imgs, h1, desc, canon, telBad, missingDim, headerH:Math.round(document.querySelector('.site-header')?.getBoundingClientRect().height||0)};
   });
   if(res.overflow>2||res.imgs.length||res.h1!==1||!res.desc||!res.canon||res.telBad.length||res.missingDim.length||errors.length){bad.push({page:pagePath,vp:vp.name,res,errors});}
   if(pagePath==='/' && ['desktop','mobile','tablet'].includes(vp.name)) await page.screenshot({path:`qa-screenshots/final-v2-home-${vp.name}.png`, fullPage:true});
   if(['/dtf-me-to-metro/','/portfolio/','/contact-us/'].includes(pagePath) && vp.name==='desktop') await page.screenshot({path:`qa-screenshots/final-v2-${pagePath.replaceAll('/','_') || 'home'}-desktop.png`, fullPage:true});
   await page.close(); count++;
  }
 }
 await browser.close();
 fs.writeFileSync('qa-report-v2.json',JSON.stringify({ok:bad.length===0,count,bad},null,2));
 console.log(JSON.stringify({ok:bad.length===0,count,bad:bad.slice(0,8)},null,2));
})();
