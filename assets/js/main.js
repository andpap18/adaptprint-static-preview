
const header=document.querySelector('.site-header');
addEventListener('scroll',()=>header?.classList.toggle('scrolled',scrollY>8),{passive:true});
const toggle=document.querySelector('.menu-toggle');const nav=document.querySelector('.nav');
toggle?.addEventListener('click',()=>{const open=!nav.classList.contains('open');nav.classList.toggle('open',open);toggle.setAttribute('aria-expanded',String(open));});
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{nav.classList.remove('open');toggle?.setAttribute('aria-expanded','false')}));
if(!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window){
 const io=new IntersectionObserver((entries)=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -40px 0px'});
 document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=(i%4)*70+'ms';io.observe(el)});
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
