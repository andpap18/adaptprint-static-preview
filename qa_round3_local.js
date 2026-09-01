const { chromium } = require('playwright');
const fs=require('fs');
const path=require('path');
const base='http://127.0.0.1:8765';
const routes=['/','/stampes-dtf-me-to-metro/','/services/','/ektyposeis-se-mplouzakia/','/ektyposeis-se-koupes/','/diafimistika-eidi/','/portfolio/','/ektyposeis-xondrikis/','/about-us/','/contact-us/','/terms-and-conditions/','/privacy-policy/'];
const widths=[390,768,1280,1440,1920];
const forbidden=['WordPress','νέο site','μεταφέρεται','schema','preview','slug','canonical','SEO','Προβάλλουμε'];
(async()=>{
 const browser=await chromium.launch({headless:true});
 const report={ok:true,issues:[],pages:[],fontRequests:[]};
 const ctx=await browser.newContext({viewport:{width:1280,height:900}, deviceScaleFactor:1});
 ctx.on('request',r=>{if(r.url().includes('/assets/fonts/')) report.fontRequests.push(r.url())});
 for(const route of routes){
  for(const w of widths){
   const page=await ctx.newPage(); await page.setViewportSize({width:w,height:900});
   const resp=await page.goto(base+route,{waitUntil:'networkidle'});
   const m=await page.evaluate((route)=>{
    const text=document.body.innerText;
    const selects=[...document.querySelectorAll('select')].map(s=>[...s.options].map(o=>o.textContent.trim()).filter(Boolean));
    const dupSelects=selects.map(opts=>opts.filter((v,i,a)=>a.indexOf(v)!==i)).filter(d=>d.length);
    const h3max=Math.max(0,...[...document.querySelectorAll('.service-tile h3,.process-step h3,.info-cluster h2')].map(e=>parseFloat(getComputedStyle(e).fontSize)));
    const cardZero=[...document.querySelectorAll('.service-tile a,.process-step,.info-cluster article,.social-proof,.form-section')].filter(e=>getComputedStyle(e).borderRadius==='0px').map(e=>e.className||e.tagName);
    return {
     status: document.readyState, text, h1:document.querySelectorAll('h1').length,
     sw:document.documentElement.scrollWidth,cw:document.documentElement.clientWidth,
     broken:[...document.images].filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src),
     breadcrumbs:document.querySelectorAll('.breadcrumbs').length,
     dropdownDupes:dupSelects,
     h3max, cardZero,
     headerSpan:!!document.querySelector('.brand-lockup span'),
     logoW:document.querySelector('.brand-lockup img')?.getBoundingClientRect().width||0,
     footerLogoW:document.querySelector('.footer-logo')?.getBoundingClientRect().width||0,
     svgCount:document.querySelectorAll('svg').length,
     fontCheck:document.fonts.check('700 32px Manrope'),
     bodyFont:getComputedStyle(document.body).fontFamily,
     mixedFont:getComputedStyle(document.querySelector('h1')||document.body).fontFamily,
     reviewText:[...document.querySelectorAll('.social-proof,.review-mini')].map(e=>e.innerText).join('\n'),
     stars:document.querySelectorAll('.stars svg').length,
     videos:document.querySelectorAll('video').length,
     homeWords: route==='/' ? text.split(/\s+/).filter(Boolean).length : 0
    }
   }, route);
   if(!resp || !resp.ok()) {report.ok=false;report.issues.push({type:'http',route,w,status:resp&&resp.status()});}
   if(m.sw>m.cw+2){report.ok=false;report.issues.push({type:'overflow',route,w,sw:m.sw,cw:m.cw});}
   if(m.h1!==1){report.ok=false;report.issues.push({type:'h1',route,w,h1:m.h1});}
   if(m.broken.length){report.ok=false;report.issues.push({type:'broken-img',route,w,broken:m.broken});}
   const bad=forbidden.filter(f=>m.text.includes(f)); if(bad.length){report.ok=false;report.issues.push({type:'forbidden-visible',route,w,bad});}
   if(route==='/' && m.breadcrumbs!==0){report.ok=false;report.issues.push({type:'home-breadcrumbs',w,count:m.breadcrumbs});}
   if(route!=='/' && m.breadcrumbs!==1){report.ok=false;report.issues.push({type:'inner-breadcrumbs',route,w,count:m.breadcrumbs});}
   if(m.dropdownDupes.length){report.ok=false;report.issues.push({type:'dropdown-dupe',route,w,dupes:m.dropdownDupes});}
   if(m.headerSpan){report.ok=false;report.issues.push({type:'header-logo-span',route,w});}
   if(m.logoW<199 || m.logoW>241){report.ok=false;report.issues.push({type:'header-logo-size',route,w,logoW:m.logoW});}
   if(w>=768 && m.footerLogoW<340){report.ok=false;report.issues.push({type:'footer-logo-size',route,w,footerLogoW:m.footerLogoW});}
   if(m.h3max>24.5){report.ok=false;report.issues.push({type:'card-title-size',route,w,h3max:m.h3max});}
   if(m.cardZero.length){report.ok=false;report.issues.push({type:'zero-radius-card',route,w,cardZero:m.cardZero});}
   if(!m.fontCheck){report.ok=false;report.issues.push({type:'font-check',route,w,bodyFont:m.bodyFont});}
   if(route==='/' && m.svgCount<15){report.ok=false;report.issues.push({type:'svg-count-home',w,svgCount:m.svgCount});}
   if((route==='/'||route==='/stampes-dtf-me-to-metro/') && !m.reviewText.includes('5,0')){report.ok=false;report.issues.push({type:'reviews-missing',route,w});}
   if((route==='/'||route==='/stampes-dtf-me-to-metro/') && m.stars<5){report.ok=false;report.issues.push({type:'stars-missing',route,w,stars:m.stars});}
   if(route==='/' && m.homeWords<500){report.ok=false;report.issues.push({type:'home-word-count',w,words:m.homeWords});}
   report.pages.push({route,w,logoW:m.logoW,footerLogoW:m.footerLogoW,h3max:m.h3max,svgCount:m.svgCount,homeWords:m.homeWords,fontCheck:m.fontCheck});
   await page.close();
  }
 }
 // mixed-font visual metrics page
 const page=await ctx.newPage(); await page.goto(base+'/about-us/',{waitUntil:'networkidle'});
 report.mixedPhrase=await page.evaluate(()=>{
  const el=[...document.querySelectorAll('h1')].find(e=>e.textContent.includes('Adapt Print'));
  return {text:el?.textContent||'',font:getComputedStyle(el||document.body).fontFamily,size:getComputedStyle(el||document.body).fontSize,weight:getComputedStyle(el||document.body).fontWeight,check:document.fonts.check('800 40px Manrope')};
 });
 await browser.close();
 fs.writeFileSync('qa_round3_local_report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({ok:report.ok,issueCount:report.issues.length,fontRequests:[...new Set(report.fontRequests)].length,mixedPhrase:report.mixedPhrase,firstIssues:report.issues.slice(0,20)},null,2));
 process.exit(report.ok?0:1);
})();
