const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const widths = [390, 768, 1024, 1100, 1180, 1280, 1440, 1920];
const base = process.env.QA_BASE || 'http://127.0.0.1:8765/';
const tag = process.env.QA_TAG || 'baseline';
const out = path.join(process.env.LOCALAPPDATA || 'C:/Users/andpa/AppData/Local', 'hermes/cache/adaptprint_breathing_audit_' + tag);
fs.mkdirSync(out, {recursive:true});

function luminance([r,g,b]){
  const srgb=[r,g,b].map(v=>{v/=255; return v<=0.03928 ? v/12.92 : Math.pow((v+0.055)/1.055,2.4)});
  return 0.2126*srgb[0]+0.7152*srgb[1]+0.0722*srgb[2];
}
function contrast(a,b){
  const L1=luminance(a), L2=luminance(b); return (Math.max(L1,L2)+0.05)/(Math.min(L1,L2)+0.05);
}
function rgb(s){
  const m = String(s).match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/); return m ? [Number(m[1]),Number(m[2]),Number(m[3])] : null;
}

(async()=>{
 const browser = await chromium.launch({headless:true});
 const results=[];
 for (const w of widths){
   const page = await browser.newPage({viewport:{width:w,height:w===390?900:980}, deviceScaleFactor:1, isMobile:w<600});
   await page.goto(base + (base.includes('?')?'&':'?') + 'audit=' + tag + '-' + w, {waitUntil:'domcontentloaded', timeout:45000});
   await page.waitForTimeout(900);
   await page.evaluate(async()=>{await Promise.race([Promise.all([...document.images].map(i=>i.decode().catch(()=>null))), new Promise(r=>setTimeout(r,6000))]);});
   const data = await page.evaluate(() => {
     const header = document.querySelector('.site-header') || document.querySelector('header');
     const topbar = document.querySelector('.topbar');
     const hero = document.querySelector('.hero');
     const visibleRect = el => { const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,width:r.width,height:r.height}; };
     const firstPhoto = [...document.querySelectorAll('.hero img')].map(img=>({img, r:visibleRect(img)})).filter(x=>x.img.naturalWidth>0 && x.r.width>40 && x.r.height>40 && x.r.bottom>0).sort((a,b)=>a.r.top-b.r.top)[0]?.r;
     const heroInteractive = hero ? hero.querySelectorAll('a,button,.trust-card,.product,figure,.hero-proof-badge,.hero-service-pills a').length : 0;
     const heroMajor = hero ? hero.querySelectorAll('.kicker,h1,p,.btn,.hero-service-pills a,.trust-card,.product,.hero-proof-badge').length : 0;
     const heads=[...document.querySelectorAll('h1,h2,h3')].map(el=>{const cs=getComputedStyle(el); const r=el.getBoundingClientRect(); return {text:el.innerText, hyphens:cs.hyphens, overflowWrap:cs.overflowWrap, textWrap:cs.textWrap || cs['text-wrap'], width:r.width, scrollWidth:el.scrollWidth};});
     const darkButtons=[...document.querySelectorAll('.final-panel .btn,.page-hero-dark .btn,.ink-band .btn')].map(el=>{const cs=getComputedStyle(el), r=el.getBoundingClientRect(); let parent=el.parentElement, bg=cs.backgroundColor; while(parent && (bg==='rgba(0, 0, 0, 0)' || bg==='transparent')){bg=getComputedStyle(parent).backgroundColor; parent=parent.parentElement;} return {text:el.innerText.trim(), color:cs.color, bg, border:cs.borderColor, visible:r.width>0 && r.height>0};});
     return {
       width: innerWidth,
       headerHeight: header ? Math.round(header.getBoundingClientRect().height + (topbar && getComputedStyle(topbar).display !== 'none' ? topbar.getBoundingClientRect().height : 0)) : null,
       navRows: header ? Math.round(header.getBoundingClientRect().height / 96 * 100)/100 : null,
       pageHeight: Math.round(document.documentElement.scrollHeight),
       firstImageTop: firstPhoto ? Math.round(firstPhoto.top) : null,
       heroTop: hero ? Math.round(hero.getBoundingClientRect().top) : null,
       heroHeight: hero ? Math.round(hero.getBoundingClientRect().height) : null,
       heroMajorCount: heroMajor,
       heroInteractiveCount: heroInteractive,
       overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
       heads,
       darkButtons,
       forbidden: {
         flagship: document.body.innerText.includes('Σελίδα-ναυαρχίδα'),
         realPrint: document.body.innerText.includes('Real print work'),
         year2025: document.body.innerText.includes('© 2025')
       },
       serviceGrid: (()=>{const g=document.querySelector('.service-catalog'); if(!g) return null; const cards=[...g.children].map(c=>{const r=c.getBoundingClientRect(); return {top:Math.round(r.top),height:Math.round(r.height),left:Math.round(r.left),width:Math.round(r.width)}}); return {columns:new Set(cards.map(c=>c.left)).size, cards};})(),
     }
   });
   data.darkButtons = data.darkButtons.map(b=>{const c=rgb(b.color), bg=rgb(b.bg); return {...b, contrast: c&&bg ? Math.round(contrast(c,bg)*100)/100 : null};});
   results.push(data);
   const shotName = w===390 ? 'hero-mobile-390.png' : w===1024 ? 'header-1024.png' : w===1440 ? 'hero-desktop-1440.png' : `viewport-${w}.png`;
   await page.screenshot({path:path.join(out,shotName), fullPage:false});
   if (w===1440){
     const svcLoc=page.locator('.service-catalog').first();
     if(await svcLoc.count()){ await svcLoc.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); await page.screenshot({path:path.join(out,'service-cards-1440.png'), fullPage:false}); }
     const spLoc=page.locator('.social-proof').first();
     if(await spLoc.count()){ await spLoc.scrollIntoViewIfNeeded(); await page.waitForTimeout(250); await page.screenshot({path:path.join(out,'reviews-panel-1440.png'), fullPage:false}); }
   }
   await page.close();
 }
 await browser.close();
 const report={tag, base, out, results};
 fs.writeFileSync(path.join(out,'report.json'), JSON.stringify(report,null,2));
 console.log(JSON.stringify(report,null,2));
})();
