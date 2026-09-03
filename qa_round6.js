const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const base = process.env.QA_BASE || 'http://127.0.0.1:8765';
const tag = process.env.QA_TAG || 'round6_local';
const out = path.join(process.env.LOCALAPPDATA || '.', 'hermes','cache','adaptprint_'+tag);
fs.mkdirSync(out,{recursive:true});
function fail(msg){throw new Error(msg)}
async function revealAll(page){ const h=await page.evaluate(()=>document.documentElement.scrollHeight); for(let y=0;y<=h;y+=700){ await page.evaluate(y=>scrollTo(0,y),y); await page.waitForTimeout(120);} await page.evaluate(()=>scrollTo(0,0)); await page.waitForTimeout(150); }
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={out,viewports:[],portfolioMobile:[],headerShots:[],map:{},social:{}};
 for(const w of [390,768,1024,1100,1180,1280,1440,1920]){
  const page=await browser.newPage({viewport:{width:w,height:w===390?844:900},deviceScaleFactor:1});
  await page.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'});
  const m=await page.evaluate(()=>{const h=document.querySelector('.site-header')?.getBoundingClientRect();const first=document.querySelector('.print-composition img')?.getBoundingClientRect();return {headerHeight:Math.round(h?.height||0),firstImageTop:Math.round(first?.top||0),pageHeight:document.documentElement.scrollHeight,overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,hyphenHeadings:[...document.querySelectorAll('h1,h2,h3')].filter(x=>getComputedStyle(x).hyphens==='auto').length};});
  report.viewports.push({w,...m});
  if(m.overflow>1) fail('overflow '+w+' '+m.overflow);
  if(m.hyphenHeadings) fail('hyphen '+w);
  if(w<=1100&&m.headerHeight!==74) fail('header '+w+' '+m.headerHeight);
  if(w>=1180&&m.headerHeight!==92) fail('header '+w+' '+m.headerHeight);
  if(w===390&&m.firstImageTop>=600) fail('first image '+m.firstImageTop);
  if(w===390&&m.pageHeight>=7000) fail('mobile height '+m.pageHeight);
  if(w>=1180&&m.pageHeight>=5000) fail('desktop height '+w+' '+m.pageHeight);
  await page.close();
 }
 for(const w of [360,390,430]){
  const page=await browser.newPage({viewport:{width:w,height:900},deviceScaleFactor:1});
  await page.goto(base+'/portfolio/?v='+Date.now(),{waitUntil:'networkidle'}); await revealAll(page);
  const gaps=await page.evaluate(()=>[...document.querySelectorAll('.work-card')].map((c,i)=>{const small=c.querySelector('.work-meta small').getBoundingClientRect();const cta=c.querySelector('.work-cta').getBoundingClientRect();const card=c.getBoundingClientRect();return {i,gap:Math.round(cta.top-small.bottom),smallBottom:Math.round(small.bottom-card.top),ctaTop:Math.round(cta.top-card.top),ctaBottomDelta:Math.round(cta.bottom-card.bottom)};}));
  report.portfolioMobile.push({w,gaps});
  if(gaps.some(g=>g.gap<8)) fail('mobile portfolio gap '+w+' '+JSON.stringify(gaps.filter(g=>g.gap<8).slice(0,3)));
  await page.screenshot({path:path.join(out,`portfolio-mobile-${w}.png`),fullPage:true});
  await page.close();
 }
 for(const w of [1180,1440,1920]){
  const page=await browser.newPage({viewport:{width:w,height:320},deviceScaleFactor:1});
  await page.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'});
  await page.screenshot({path:path.join(out,`header-${w}.png`),fullPage:false});
  report.headerShots.push(`header-${w}.png`);
  await page.close();
 }
 const contact=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await contact.goto(base+'/contact-us/?v='+Date.now(),{waitUntil:'networkidle'});
 await contact.locator('.map-card').scrollIntoViewIfNeeded(); await contact.waitForTimeout(1000);
 await contact.screenshot({path:path.join(out,'map-contact-desktop.png'),fullPage:false});
 report.map=await contact.evaluate(()=>{const iframe=document.querySelector('.map-embed iframe');const dir=document.querySelector('.map-card a.btn')?.href;return {iframe:!!iframe,src:iframe?.src,title:iframe?.title,height:Math.round(iframe?.getBoundingClientRect().height||0),directions:dir,target:document.querySelector('.map-card a.btn')?.target};});
 if(!report.map.iframe||!report.map.src.includes('output=embed')) fail('map iframe missing');
 if(!report.map.directions.includes('/maps/dir/')||report.map.target!=='_blank') fail('directions link wrong');
 const footer=await browser.newPage({viewport:{width:1440,height:900},deviceScaleFactor:1});
 await footer.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'}); await footer.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await footer.waitForTimeout(250); await footer.screenshot({path:path.join(out,'footer-social-desktop.png'),fullPage:false});
 report.social.footer=await footer.evaluate(()=>[...document.querySelectorAll('.social-row a')].map(a=>({label:a.getAttribute('aria-label'),hasSvg:!!a.querySelector('svg'),text:a.textContent.trim(),box:a.getBoundingClientRect().toJSON?.()||{}})));
 if(report.social.footer.some(x=>!x.hasSvg||x.text)) fail('footer social not svg-only');
 await footer.close();
 const mob=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 await mob.goto(base+'/?v='+Date.now(),{waitUntil:'networkidle'}); await mob.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight)); await mob.waitForTimeout(250); await mob.screenshot({path:path.join(out,'footer-whatsapp-mobile.png'),fullPage:false});
 report.social.whatsapp=await mob.evaluate(()=>{const a=document.querySelector('.floating-whatsapp');const r=a?.getBoundingClientRect();const cs=a?getComputedStyle(a):null;return {exists:!!a,hasSvg:!!a?.querySelector('svg'),bg:cs?.backgroundColor,w:Math.round(r?.width||0),h:Math.round(r?.height||0),right:Math.round(innerWidth-(r?.right||0)),bottom:Math.round(innerHeight-(r?.bottom||0))};});
 if(!report.social.whatsapp.exists||!report.social.whatsapp.hasSvg||report.social.whatsapp.w<56||!report.social.whatsapp.bg.includes('37, 211, 102')) fail('whatsapp style wrong '+JSON.stringify(report.social.whatsapp));
 await browser.close();
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:true,out,metrics:report.viewports,portfolioGaps:report.portfolioMobile.map(x=>({w:x.w,minGap:Math.min(...x.gaps.map(g=>g.gap))})),map:report.map,whatsapp:report.social.whatsapp}));
})().catch(e=>{console.error(e);process.exit(1)});
