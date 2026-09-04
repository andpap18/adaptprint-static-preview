const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const root = process.cwd();
const base = 'http://127.0.0.1:8765';
function assert(cond,msg){ if(!cond){ throw new Error(msg); } }
(async()=>{
 const css=fs.readFileSync(path.join(root,'assets/css/styles.css'),'utf8');
 assert(!css.includes('.reveal,.reveal:not(.visible),.work-card.is-filtered'),'killer reveal rule remains');
 assert(!/\.reveal[^{}]*\{[^{}]*transition\s*:\s*none\s*!important/.test(css),'reveal transition none important remains');
 assert((css.match(/\.reveal/g)||[]).length<=8,'too many reveal selectors: '+(css.match(/\.reveal/g)||[]).length);
 assert(css.includes('.registration-motion') && css.includes('@keyframes regC'),'registration motion missing');
 assert(css.includes('.cmyk-marquee') && css.includes('@keyframes marquee'),'marquee missing');
 assert(css.includes('--max:1440px'),'max width not increased');
 assert(!css.includes('anamnistikes-plaketes-uv-protected.webp'),'protected asset referenced');
 const htmlFiles=[];
 function walk(d){ for(const f of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,f.name); if(f.isDirectory()){ if(['.git','node_modules','assets'].includes(f.name)) continue; walk(p);} else if(f.name==='index.html'||f.name.endsWith('.html')) htmlFiles.push(p); }}
 walk(root);
 const allHtml=htmlFiles.map(p=>fs.readFileSync(p,'utf8')).join('\n');
 ['image00015','image00019','image00025','image00035','image00039','image00058','Clean Sense','cleansense','transition:none!important'].forEach(x=>assert(!allHtml.includes(x),'forbidden HTML token '+x));
 assert(allHtml.includes('lifestyle-prasina-mpoufan-why-not.webp'),'round8 lifestyle image not referenced');
 assert(allHtml.includes('lefka-metallika-mpoukalia-odyssea-sublimation.webp'),'round8 bottle image not referenced');
 assert(allHtml.includes('legal-toc') && allHtml.includes('Αποδοχή Όρων') && allHtml.includes('Προστασία Ανηλίκων'),'legal full pages/toc missing');
 assert(allHtml.includes('[ΝΑ ΕΠΙΒΕΒΑΙΩΘΕΙ ΑΠΟ ΤΟΝ ΠΕΛΑΤΗ]'),'privacy confirmation flags missing');
 assert(allHtml.includes('nav-backdrop') && allHtml.includes('nav-mobile-cta'),'mobile nav markup missing');
 assert(!allHtml.includes('id="calcPrice"'),'calcPrice exists');
 assert(!allHtml.includes('€'),'visible euro sign in HTML');
 assert(allHtml.includes('maps?q=Adapt%20Print'),'Google map embed missing');
 const browser=await chromium.launch({headless:true});
 const checks=[];
 for(const vp of [{w:390,h:900,path:'/'},{w:1440,h:1000,path:'/'},{w:1920,h:1080,path:'/'},{w:390,h:900,path:'/portfolio/'},{w:390,h:900,path:'/terms-and-conditions/'},{w:390,h:900,path:'/privacy-policy/'},{w:1440,h:1000,path:'/stampes-dtf-me-to-metro/'}]){
   const page=await browser.newPage({viewport:{width:vp.w,height:vp.h}});
   await page.goto(base+vp.path,{waitUntil:'networkidle'});
   const data=await page.evaluate(()=>({
     title:document.title,
     cw:document.documentElement.clientWidth,
     sw:document.documentElement.scrollWidth,
     header:Math.round(document.querySelector('.site-header').getBoundingClientRect().height),
     hyph:[...document.querySelectorAll('h1,h2,h3')].filter(h=>getComputedStyle(h).hyphens!=='none').length,
     firstImg: (()=>{const img=document.querySelector('.hero img,.page-hero img,.contact-hero img,img'); return img?Math.round(img.getBoundingClientRect().top):null})(),
     map:!!document.querySelector('.map-embed iframe'),
     calcPrice:!!document.querySelector('#calcPrice'),
     euro:document.body.innerText.includes('€')
   }));
   assert(data.sw<=data.cw+1,`overflow ${vp.path} ${vp.w}: ${data.sw}>${data.cw}`);
   assert(data.header<=96,`header too tall ${vp.path} ${vp.w}: ${data.header}`);
   assert(data.hyph===0,`hyphen enabled ${vp.path}`);
   assert(!data.calcPrice && !data.euro,'calculator price/euro regression');
   checks.push({vp,data});
   await page.close();
 }
 // menu behavior mobile: outside click, link click, Escape, body lock, focus return
 const page=await browser.newPage({viewport:{width:390,height:900}});
 await page.goto(base+'/',{waitUntil:'networkidle'});
 await page.click('.menu-toggle');
 let state=await page.evaluate(()=>({open:document.querySelector('.nav').classList.contains('open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded'),body:document.body.classList.contains('menu-open'),pos:getComputedStyle(document.body).position}));
 assert(state.open && state.expanded==='true' && state.body && state.pos==='fixed','menu did not open/lock');
 await page.mouse.click(5,500);
 state=await page.evaluate(()=>({open:document.querySelector('.nav').classList.contains('open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded'),body:document.body.classList.contains('menu-open')}));
 assert(!state.open && state.expanded==='false' && !state.body,'menu did not close by outside click');
 await page.click('.menu-toggle'); await page.keyboard.press('Escape');
 state=await page.evaluate(()=>({open:document.querySelector('.nav').classList.contains('open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded'),active:document.activeElement.className}));
 assert(!state.open && state.expanded==='false','menu did not close by Escape');
 await page.click('.menu-toggle'); await page.click('.nav a[href="/services/"]');
 await page.waitForTimeout(200);
 state=await page.evaluate(()=>({open:document.querySelector('.nav').classList.contains('open'),expanded:document.querySelector('.menu-toggle').getAttribute('aria-expanded'),pathname:location.pathname}));
 assert(!state.open && state.expanded==='false' && state.pathname==='/services/','menu did not close by link');
 await page.close();
 // CLS sample
 for(const [vp,pth] of [[390,'/'],[1440,'/'],[1440,'/stampes-dtf-me-to-metro/'],[390,'/portfolio/']]){
   const page=await browser.newPage({viewport:{width:vp,height:900}});
   await page.addInitScript(()=>{window.__cls=0; new PerformanceObserver((list)=>{for(const e of list.getEntries()){if(!e.hadRecentInput) window.__cls+=e.value;}}).observe({type:'layout-shift',buffered:true});});
   await page.goto(base+pth,{waitUntil:'networkidle'}); await page.waitForTimeout(1000);
   const cls=await page.evaluate(()=>window.__cls||0); assert(cls<0.001,`CLS ${pth} ${vp}: ${cls}`);
   checks.push({cls:{vp,pth,cls}}); await page.close();
 }
 await browser.close();
 console.log(JSON.stringify({ok:true,cssRevealCount:(css.match(/\.reveal/g)||[]).length,checks},null,2));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
