
const header=document.querySelector('.site-header');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;

// Decorative copies only; original text and its normal ink remain untouched.
const registrationMotion=matchMedia('(prefers-reduced-motion: reduce)');
const registrationSeen=new WeakSet();
function registerTitle(title){
  if(registrationSeen.has(title))return;
  registrationSeen.add(title);
  if(registrationMotion.matches||!title.animate)return;
  const text=title.textContent;
  const dark=title.dataset.registration==='dark';
  const layers=[['var(--cyan)',-3,0,1],['var(--magenta)',3,0,1],['var(--yellow)',0,2,.55]].map(([ink,x,y,strength])=>{
    const layer=document.createElement('span');
    layer.className='registration-layer';layer.hidden=true;layer.setAttribute('aria-hidden','true');
    layer.textContent=text;layer.style.setProperty('--registration-ink',ink);title.append(layer);
    return {layer,x,y,opacity:(dark?.4:.5)*strength};
  });
  title.classList.add('registration-running');
  const animations=layers.map(({layer,x,y,opacity})=>layer.animate([
    {transform:`translate(${x}px,${y}px)`,opacity},
    {transform:'translate(0px,0px)',opacity:0}
  ],{duration:500,delay:0,easing:'linear',iterations:1,fill:'none'}));
  const cleanup=()=>{animations.forEach(a=>a.cancel());layers.forEach(({layer})=>layer.remove());title.classList.remove('registration-running');registrationMotion.removeEventListener('change',cleanup);};
  registrationMotion.addEventListener('change',cleanup);
  Promise.all(animations.map(a=>a.finished)).then(cleanup,cleanup);
}
document.querySelectorAll('h1[data-registration]').forEach(registerTitle);
if('IntersectionObserver'in window){
  const titleObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){titleObserver.unobserve(entry.target);registerTitle(entry.target);}
  }),{threshold:0});
  document.querySelectorAll('h2[data-registration]').forEach(title=>titleObserver.observe(title));
}

let lastScrollY=scrollY;
addEventListener('scroll',()=>{header?.classList.toggle('scrolled',scrollY>8);lastScrollY=scrollY},{passive:true});
const toggle=document.querySelector('.menu-toggle');
const nav=document.querySelector('#nav.mobile-nav')||document.querySelector('#nav');
const backdrop=document.querySelector('.nav-backdrop');
const panelClose=document.querySelector('.nav-panel-close');
const focusableSelector='a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
let menuLastFocus=null,lockedY=0;
function menuLinks(){return nav?[...nav.querySelectorAll(focusableSelector)]:[]}
function openMenu(){if(!toggle||!nav)return;menuLastFocus=document.activeElement;lockedY=scrollY;nav.classList.add('open');backdrop?.classList.add('open');toggle.classList.add('is-open');toggle.setAttribute('aria-expanded','true');document.documentElement.classList.add('menu-open');document.body.classList.add('menu-open');document.documentElement.style.overflow='hidden';document.body.style.overflow='hidden';setTimeout(()=>menuLinks()[0]?.focus({preventScroll:true}),80)}
function closeMenu(returnFocus=true){if(!toggle||!nav)return;const y=lockedY||lastScrollY||0;nav.classList.remove('open');backdrop?.classList.remove('open');toggle.classList.remove('is-open');toggle.setAttribute('aria-expanded','false');document.documentElement.classList.remove('menu-open');document.body.classList.remove('menu-open');document.documentElement.style.overflow='';document.body.style.overflow='';if(returnFocus)(menuLastFocus||toggle).focus?.({preventScroll:true});const restore=()=>{const sc=document.scrollingElement||document.documentElement;sc.scrollTop=y;window.scrollTo({top:y,left:0,behavior:'auto'})};requestAnimationFrame(()=>{restore();setTimeout(restore,50);setTimeout(restore,150);setTimeout(restore,300)})}
toggle?.addEventListener('click',()=>nav?.classList.contains('open')?closeMenu(true):openMenu());
panelClose?.addEventListener('click',()=>closeMenu(true));
nav?.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>closeMenu(false)));
backdrop?.addEventListener('click',()=>closeMenu(true));
document.addEventListener('pointerdown',e=>{if(!nav?.classList.contains('open'))return;if(nav.contains(e.target)||toggle?.contains(e.target))return;closeMenu(true)});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav?.classList.contains('open')){e.preventDefault();closeMenu(true)}if(e.key==='Tab'&&nav?.classList.contains('open')){const f=menuLinks();if(!f.length)return;const first=f[0],last=f[f.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}});
matchMedia('(min-width:1180px)').addEventListener('change',e=>{if(e.matches)closeMenu(false)});
// One once-only reveal cadence; registered ink stays independently visible.
const motionPreference=matchMedia('(prefers-reduced-motion: reduce)');
document.querySelectorAll('main .reveal').forEach(el=>{el.classList.remove('reveal','from-left','from-right');el.classList.add('visible')});
const motionTargets=new Set(document.querySelectorAll('main .page-head .kicker,main .page-head .btn,main .page-head+section>.wrap>p:first-child,main .service-tile,main .work-card,main .proof-card,main .info-cluster article,main .product-detail-grid figure,main .legal-card,main .contact-methods>*'));
const revealAnimations=new Set();
function showMotion(el){el.dataset.motionState='shown';el.style.removeProperty('visibility');if(motionPreference.matches)return;const frames=el.querySelector('[data-registration]')?[{opacity:0},{opacity:1}]:[{opacity:0,translate:'0 10px'},{opacity:1,translate:'0 0'}];const a=el.animate(frames,{duration:220,easing:getComputedStyle(el).getPropertyValue('--ease').trim()||'ease',delay:0});revealAnimations.add(a);a.finished.then(()=>revealAnimations.delete(a),()=>revealAnimations.delete(a));}
const revealObserver=!motionPreference.matches&&'IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){revealObserver.unobserve(e.target);showMotion(e.target)}}),{threshold:0}):null;
motionTargets.forEach(el=>{el.dataset.motionState='shown';if(revealObserver){el.dataset.motionState='pending';el.style.visibility='hidden';revealObserver.observe(el)}});
motionPreference.addEventListener('change',()=>{if(motionPreference.matches){revealObserver?.disconnect();revealAnimations.forEach(a=>a.cancel());motionTargets.forEach(el=>{el.style.removeProperty('visibility');el.dataset.motionState='shown'})}});
document.querySelectorAll('main a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const target=document.getElementById(a.hash.slice(1));if(!target)return;e.preventDefault();target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: no-preference)').matches?'smooth':'auto',block:'start'});history.replaceState(null,'',a.hash)}));
const buttons=[...document.querySelectorAll('.filter-btn')],cards=[...document.querySelectorAll('.work-card')];buttons.forEach(btn=>btn.addEventListener('click',()=>{buttons.forEach(b=>b.classList.remove('active'));btn.classList.add('active');const f=btn.dataset.filter;cards.forEach((card,i)=>{const show=f==='Όλα'||card.dataset.category===f;card.style.setProperty('--reveal-delay',Math.min(i*45,300)+'ms');card.classList.toggle('is-filtered',!show);setTimeout(()=>{card.style.display=show?'block':'none'; if(show) requestAnimationFrame(()=>card.classList.remove('is-filtered'));}, show?0:180);});}));
const lb=document.getElementById('lightbox');let lbIndex=0,lastFocus=null;function visibleOpeners(){return[...document.querySelectorAll('.work-card')].filter(c=>c.style.display!=='none').map(c=>c.querySelector('.work-open'))}function show(i){const ops=visibleOpeners();if(!ops.length||!lb)return;lbIndex=(i+ops.length)%ops.length;const b=ops[lbIndex];lb.querySelector('img').src=b.dataset.src;lb.querySelector('img').alt=b.dataset.title;lb.querySelector('figcaption').textContent=b.dataset.title+' — '+b.dataset.note;lb.hidden=false;document.body.style.overflow='hidden';lb.querySelector('.lightbox-close').focus();}document.querySelectorAll('.work-open').forEach(b=>b.addEventListener('click',()=>{lastFocus=b;show(visibleOpeners().indexOf(b));}));function closeLb(){if(!lb)return;lb.hidden=true;document.body.style.overflow='';lastFocus?.focus();}lb?.querySelector('.lightbox-close')?.addEventListener('click',closeLb);lb?.querySelector('.lightbox-prev')?.addEventListener('click',()=>show(lbIndex-1));lb?.querySelector('.lightbox-next')?.addEventListener('click',()=>show(lbIndex+1));lb?.addEventListener('click',e=>{if(e.target===lb)closeLb()});document.addEventListener('keydown',e=>{if(!lb||lb.hidden)return;if(e.key==='Escape')closeLb();if(e.key==='ArrowLeft')show(lbIndex-1);if(e.key==='ArrowRight')show(lbIndex+1);});
// Pointer-bound print sheets: cached geometry, transform-only frames.
const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
const tiltFrames=[...document.querySelectorAll('main .tilt-frame')];
const tiltResets=[];
tiltFrames.forEach(frame=>{const surface=frame.querySelector('.tilt-surface');let bounds,raf=0,timer=0,active=false,x=0,y=0;
 const enabled=()=>finePointer.matches&&!motionPreference.matches;
 const reset=(instant=false)=>{active=false;cancelAnimationFrame(raf);raf=0;clearTimeout(timer);surface.style.transition=instant?'none':'transform 500ms var(--ease)';surface.style.transform='';surface.style.removeProperty('will-change');if(instant)surface.style.removeProperty('transition')};
 const enter=e=>{if(!enabled()||e.pointerType==='touch')return;clearTimeout(timer);bounds=frame.getBoundingClientRect();active=true;surface.style.transition='transform 100ms var(--ease)';surface.style.willChange='transform'};
 frame.addEventListener('pointerenter',enter);
 frame.addEventListener('pointermove',e=>{if(!active||!enabled()||e.pointerType==='touch')return;x=Math.max(-1,Math.min(1,(e.clientX-bounds.left)/bounds.width*2-1))*5;y=Math.max(-1,Math.min(1,(e.clientY-bounds.top)/bounds.height*2-1))*-5;if(!raf)raf=requestAnimationFrame(()=>{raf=0;if(active)surface.style.transform=`rotateX(${y}deg) rotateY(${x}deg)`})});
 frame.addEventListener('pointerleave',()=>reset());frame.addEventListener('pointercancel',()=>reset(true));tiltResets.push(()=>reset(true));
});
const resetTilts=()=>tiltResets.forEach(reset=>reset());
finePointer.addEventListener('change',resetTilts);motionPreference.addEventListener('change',resetTilts);addEventListener('resize',resetTilts);addEventListener('blur',resetTilts);addEventListener('pagehide',resetTilts);
const ruler=document.querySelector('main .scroll-ruler');
if(ruler){const mobileRuler=matchMedia('(max-width:767px)');let range=0,pending=0;const draw=()=>{pending=0;if(motionPreference.matches)return;const progress=range>0?Math.max(0,Math.min(1,scrollY/range)):0;ruler.firstElementChild.style.transform=mobileRuler.matches?`scaleX(${progress})`:`translateY(${-90*progress}px)`};const queue=()=>{if(!pending&&!motionPreference.matches)pending=requestAnimationFrame(draw)};const measure=()=>{if(motionPreference.matches)return;range=Math.max(0,document.documentElement.scrollHeight-innerHeight);ruler.style.setProperty('--ruler-top',Math.max(0,header?.getBoundingClientRect().bottom||0)+'px');queue()};addEventListener('scroll',queue,{passive:true});addEventListener('resize',measure);if('ResizeObserver'in window)new ResizeObserver(measure).observe(document.body);motionPreference.addEventListener('change',()=>{cancelAnimationFrame(pending);pending=0;if(motionPreference.matches)ruler.firstElementChild.style.transform='none';else measure()});measure();}
const calcEls=['calcWidth','calcHeight','calcQty'].map(id=>document.getElementById(id));const calcResult=document.getElementById('calcResult');function updateDtfCalc(){if(!calcResult||calcEls.some(e=>!e))return;const [w,h,q]=calcEls.map(e=>parseFloat(e.value||'0'));const roll=58;if(w<=0||h<=0||q<=0){calcResult.value='Συμπληρώστε διαστάσεις και τεμάχια για ενδεικτικό υπολογισμό.';return;}const perRow=Math.max(1,Math.floor(roll/(w+1))),rows=Math.ceil(q/perRow),meters=Math.ceil((rows*(h+1))/100*10)/10;calcResult.value=`Περίπου ${meters.toString().replace('.',',')} τρέχοντα μέτρα σε ρολό 58cm (${perRow} σχέδια ανά σειρά). Η τελική τιμή δίνεται με προσφορά, ανάλογα με το αρχείο και την ποσότητα.`;}calcEls.forEach(e=>e?.addEventListener('input',updateDtfCalc));updateDtfCalc();

/* AP audit: accessibility and validation enhancements, shared across static pages. */
(()=>{
  const MOBILE_BREAKPOINT=1024;
  const mobile=matchMedia(`(max-width:${MOBILE_BREAKPOINT-1}px)`);
  const nav=document.querySelector('#nav.mobile-nav')||document.querySelector('#nav');
  const toggle=document.querySelector('.menu-toggle');
  const backdrop=document.querySelector('.nav-backdrop');
  const focusable='a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';
  function resetMenu(){
    nav?.classList.remove('open');toggle?.classList.remove('is-open');toggle?.setAttribute('aria-expanded','false');
    document.documentElement.classList.remove('menu-open');document.body.classList.remove('menu-open');
    document.documentElement.style.overflow='';document.body.style.overflow='';
    if(backdrop){backdrop.classList.remove('open');backdrop.hidden=true;backdrop.inert=true;backdrop.setAttribute('aria-hidden','true');}
  }
  if(backdrop){backdrop.hidden=true;backdrop.inert=true;backdrop.setAttribute('aria-hidden','true');}
  mobile.addEventListener('change',e=>{if(!e.matches)resetMenu()});
  document.addEventListener('click',e=>{if(e.target===toggle&&mobile.matches&&backdrop){requestAnimationFrame(()=>{const open=nav?.classList.contains('open');backdrop.hidden=!open;backdrop.inert=!open;backdrop.setAttribute('aria-hidden',String(!open));});}});

  const filterButtons=[...document.querySelectorAll('.filter-btn')],cards=[...document.querySelectorAll('.work-card')];
  const count=document.getElementById('filterCount'),empty=document.getElementById('portfolioEmpty');
  function applyFilter(button){const filter=button.dataset.filter;let visible=0;filterButtons.forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});cards.forEach(card=>{const show=filter==='Όλα'||(card.dataset.categories||card.dataset.category||'').split('|').includes(filter);card.hidden=!show;card.style.display=show?'block':'none';if(show)visible++;});if(count)count.textContent=`${visible} ${visible===1?'δείγμα':'δείγματα'}${filter==='Όλα'?'':' · '+filter}`;if(empty)empty.hidden=visible!==0;}
  filterButtons.forEach(button=>button.addEventListener('click',()=>applyFilter(button)));if(filterButtons.length)applyFilter(filterButtons.find(b=>b.classList.contains('active'))||filterButtons[0]);

  const lightbox=document.getElementById('lightbox');let opener=null;
  function trapFocus(event){if(!lightbox||lightbox.hidden||event.key!=='Tab')return;const nodes=[...lightbox.querySelectorAll(focusable)].filter(x=>!x.hidden);if(!nodes.length)return;const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus()}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus()}}
  document.addEventListener('keydown',trapFocus);
  document.querySelectorAll('.work-open').forEach(button=>button.addEventListener('click',()=>{opener=button;requestAnimationFrame(()=>lightbox?.querySelector('.lightbox-close')?.focus())}));
  function restoreLightboxFocus(){if(lightbox?.hidden)opener?.focus({preventScroll:true});}
  lightbox?.querySelector('.lightbox-close')?.addEventListener('click',()=>setTimeout(restoreLightboxFocus));
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!lightbox?.hidden)setTimeout(restoreLightboxFocus)});

  const params=new URLSearchParams(location.search);
  document.querySelectorAll('.quote-form').forEach(form=>{
    const service=form.elements.service_context,project=form.elements.project_context;
    if(service)service.value=params.get('service')||'';if(project)project.value=params.get('project')||'';
    const status=form.querySelector('.quote-status'),errors=form.querySelector('.form-errors');
    const invalid=(message)=>{errors.textContent=message;status.textContent='';errors.focus({preventScroll:true});};
    form.addEventListener('submit',event=>{
      const contact=(form.elements.contact?.value||'').trim(),file=(form.elements.file_link?.value||'').trim();
      const isValidContact=value=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)||/^\+?[0-9][0-9\s().-]{6,}$/.test(value);
      const isValidUrl=value=>{try{const u=new URL(value);return /^https?:$/.test(u.protocol)}catch{return false}};
      if(!isValidContact(contact)){event.preventDefault();invalid('Συμπληρώστε έγκυρο email ή ελληνικό/διεθνές τηλέφωνο.');return;}
      if(file&&!isValidUrl(file)){event.preventDefault();invalid('Το link αρχείου πρέπει να είναι έγκυρο URL (http ή https).');return;}
      errors.textContent='';status.textContent='Θα ανοίξει το πρόγραμμα email σας με τα στοιχεία για έλεγχο πριν τα στείλετε.';
    });
  });

  const width=document.getElementById('calcWidth'),height=document.getElementById('calcHeight'),qty=document.getElementById('calcQty'),result=document.getElementById('calcResult');
  function validDecimal(input){const raw=input?.value.trim()||'';return /^\d+(?:[.,]\d)?$/.test(raw)&&Number.isFinite(Number(raw.replace(',','.')))&&Number(raw.replace(',','.'))>0;}
  function calculateDtf(){if(!result||!width||!height||!qty)return null;if(!validDecimal(width)||!validDecimal(height)||!/^[1-9]\d*$/.test(qty.value.trim())){result.textContent='Συμπληρώστε θετικές διαστάσεις έως ένα δεκαδικό και ακέραιο αριθμό τεμαχίων.';return null;}const w=Number(width.value.replace(',','.')),h=Number(height.value.replace(',','.')),q=Number(qty.value),roll=58,margin=1;const layouts=[[w,h,'χωρίς περιστροφή'],[h,w,'με περιστροφή']].map(([a,b,orientation])=>{const across=Math.floor(roll/(a+margin));if(across<1)return null;const rows=Math.ceil(q/across),cm=rows*(b+margin);return {a,b,orientation,across,rows,cm,meters:Math.ceil(cm)/100};}).filter(Boolean);if(!layouts.length){result.textContent='Οι διαστάσεις δεν χωρούν στο ρολό 58cm με περιθώριο 1cm σε κάθε άξονα.';return null;}const best=layouts.reduce((x,y)=>y.meters<x.meters?y:x);result.textContent=`Ενδεικτικά ${best.meters.toFixed(2).replace('.',',')} τρέχοντα μέτρα · ${best.across} ανά σειρά · ${best.orientation}. Ρολό 58cm και περιθώριο 1cm ανά σχέδιο σε πλάτος και μήκος.`;return {w,h,q,margin,roll,...best};}
  [width,height,qty].forEach(input=>input?.addEventListener('input',calculateDtf));calculateDtf();
  document.getElementById('sendCalc')?.addEventListener('click',()=>{const data=calculateDtf();if(!data)return;const form=document.querySelector('.quote-form'),message=form?.elements.message;if(message&&!message.dataset.dtfInserted){message.value=(message.value?message.value+'\n\n':'')+`Υπολογιστής DTF\nΔιαστάσεις: ${data.w} × ${data.h} cm\nΤεμάχια: ${data.q}\nΡολό: ${data.roll}cm\nΠεριθώριο: ${data.margin}cm ανά σχέδιο / και στους δύο άξονες\nΠροσανατολισμός: ${data.orientation}\nΑποτέλεσμα: ${data.meters.toFixed(2).replace('.',',')} τρέχοντα μέτρα`;message.dataset.dtfInserted='true';}if(form?.elements.quantity)form.elements.quantity.value=`${data.q} τεμάχια · ${data.w} × ${data.h} cm`;form?.querySelector('[name="service_context"]')&&(form.elements.service_context.value='Στάμπες DTF με το μέτρο');});

  document.querySelectorAll('.map-load').forEach(button=>button.addEventListener('click',()=>{const target=document.getElementById(button.dataset.mapTarget),src=button.dataset.mapSrc;if(target&&src&&!target.querySelector('iframe')){const frame=document.createElement('iframe');frame.src=src;frame.title='Χάρτης Adapt Print';frame.loading='lazy';frame.referrerPolicy='no-referrer-when-downgrade';frame.allowFullscreen=true;target.replaceChildren(frame);button.hidden=true;}}));
})();
