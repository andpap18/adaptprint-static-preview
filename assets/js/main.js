
const header=document.querySelector('.site-header');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>8),{passive:true});
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');
toggle?.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));
if(!reduced && 'IntersectionObserver' in window){
 const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.08,rootMargin:'0px 0px -24px 0px'});
 document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=Math.min((i%3)*40,80)+'ms';io.observe(el)});
}else{document.querySelectorAll('.reveal').forEach(el=>el.classList.add('visible'))}
const buttons=[...document.querySelectorAll('.filter-btn')];const cards=[...document.querySelectorAll('.work-card')];
buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;cards.forEach(card=>{const show=f==='Όλα'||card.dataset.category===f;card.style.display=show?'block':'none';});}));
const lb=document.getElementById('lightbox');let lbIndex=0;let lastFocus=null;
function visibleOpeners(){return [...document.querySelectorAll('.work-card')].filter(c=>c.style.display!=='none').map(c=>c.querySelector('.work-open'))}
function show(i){const ops=visibleOpeners(); if(!ops.length)return; lbIndex=(i+ops.length)%ops.length; const b=ops[lbIndex]; lb.querySelector('img').src=b.dataset.src; lb.querySelector('img').alt=b.dataset.title; lb.querySelector('figcaption').textContent=b.dataset.title+' — '+b.dataset.note; lb.hidden=false; document.body.style.overflow='hidden'; lb.querySelector('.lightbox-close').focus();}
document.querySelectorAll('.work-open').forEach((b,i)=>b.addEventListener('click',()=>{lastFocus=b;show(visibleOpeners().indexOf(b));}));
function closeLb(){lb.hidden=true;document.body.style.overflow='';lastFocus?.focus();}
lb?.querySelector('.lightbox-close')?.addEventListener('click',closeLb);lb?.querySelector('.lightbox-prev')?.addEventListener('click',()=>show(lbIndex-1));lb?.querySelector('.lightbox-next')?.addEventListener('click',()=>show(lbIndex+1));
lb?.addEventListener('click',e=>{if(e.target===lb)closeLb()});
document.addEventListener('keydown',e=>{if(!lb||lb.hidden)return; if(e.key==='Escape')closeLb(); if(e.key==='ArrowLeft')show(lbIndex-1); if(e.key==='ArrowRight')show(lbIndex+1);});
if(!reduced){
 const hero=document.querySelector('.print-composition');
 hero?.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width-.5; const y=(e.clientY-r.top)/r.height-.5; hero.querySelectorAll('.product').forEach((el,i)=>{const depth=(i+1)*7; el.style.translate=(x*depth)+'px '+(y*depth)+'px';});});
 hero?.addEventListener('pointerleave',()=>hero.querySelectorAll('.product').forEach(el=>el.style.translate='0 0'));
 const animateCounter=(el)=>{const target=parseFloat(el.dataset.count||el.textContent.replace(',','.')); const dec=parseInt(el.dataset.decimals||'0',10); let start=null; const dur=650; function step(ts){start??=ts; const p=Math.min((ts-start)/dur,1); const eased=1-Math.pow(1-p,3); const value=target*eased; el.textContent=value.toLocaleString('el-GR',{minimumFractionDigits:dec,maximumFractionDigits:dec}); if(p<1) requestAnimationFrame(step);} requestAnimationFrame(step);};
 if('IntersectionObserver' in window){const cio=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){animateCounter(e.target);cio.unobserve(e.target)}}),{threshold:.5}); document.querySelectorAll('.counter').forEach(c=>cio.observe(c));}else document.querySelectorAll('.counter').forEach(animateCounter);
}
