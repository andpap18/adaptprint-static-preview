/* Homepage-only 3D motion. Static, visible composition is the no-JS fallback. */
(()=>{
  const hero=document.querySelector('.home-depth-hero'); if(!hero)return;
  const stage=hero.querySelector('.home-depth-stage'),cards=[...hero.querySelectorAll('.home-depth-card')];
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
  let raf=0,animations=[],x=0,y=0,tx=0,ty=0,scroll=0,visible=true,entering=false;
  const enabled=()=>!reduced.matches&&fine.matches&&innerWidth>820&&navigator.maxTouchPoints===0;
  const base=card=>{const s=getComputedStyle(card);return {z:parseFloat(s.getPropertyValue('--z'))||0,r:parseFloat(s.getPropertyValue('--r'))||0}};
  let poses=cards.map(base);
  function draw(){raf=0;if(!enabled()||!visible||entering)return;x+=(tx-x)*.085;y+=(ty-y)*.085;
    cards.forEach((c,i)=>{const d=[1,.38,.62,1.25,.72,.9][i],p=poses[i];c.style.transform=`translate3d(${x*16*d}px,${y*12*d-scroll*(i%2?35:58)*d}px,${p.z-scroll*45*d}px) rotateX(${-y*4*d}deg) rotateY(${x*5.5*d}deg) rotate(${p.r+scroll*(i%2?3:-3)}deg)`});
    if(Math.abs(tx-x)+Math.abs(ty-y)>.005)raf=requestAnimationFrame(draw);
  }
  const queue=()=>{if(!raf&&enabled()&&visible&&!entering)raf=requestAnimationFrame(draw)};
  function reset(){cancelAnimationFrame(raf);raf=0;animations.forEach(a=>a.cancel());animations=[];entering=false;x=y=tx=ty=scroll=0;cards.forEach(c=>c.style.removeProperty('transform'));poses=cards.map(base);hero.dataset.motion=enabled()&&visible?'active':'static';if(enabled())queue()}
  hero.addEventListener('pointermove',e=>{if(!enabled()||e.pointerType==='touch')return;const b=hero.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-b.left)/b.width*2-1));ty=Math.max(-1,Math.min(1,(e.clientY-b.top)/b.height*2-1));queue()},{passive:true});
  hero.addEventListener('pointerleave',()=>{tx=ty=0;queue()});
  addEventListener('scroll',()=>{if(!enabled())return;const b=hero.getBoundingClientRect();scroll=Math.max(0,Math.min(1,-b.top/b.height));queue()},{passive:true});
  addEventListener('resize',reset);addEventListener('blur',()=>{tx=ty=0;queue()});addEventListener('pagehide',reset);
  reduced.addEventListener('change',reset);fine.addEventListener('change',reset);
  document.addEventListener('visibilitychange',()=>{visible=!document.hidden;reset()});
  if('IntersectionObserver'in window)new IntersectionObserver(es=>{visible=es[0].isIntersecting&&!document.hidden;hero.dataset.motion=enabled()&&visible?'active':'static';if(visible)queue();else{cancelAnimationFrame(raf);raf=0}},{threshold:0}).observe(hero);
  reset();
  if(enabled()){
    entering=true;
    /* Enter from depth inside the stage, not across the copy or viewport edge. */
    animations=cards.map((c,i)=>{const p=poses[i],sign=i%2?1:-1;return c.animate([{opacity:0,transform:`translate3d(${sign*24}px,18px,-220px) rotateX(${sign*18}deg) rotateY(${sign*20}deg) rotate(${p.r+sign*12}deg)`},{opacity:1,transform:`translate3d(0,0,${p.z}px) rotateX(0deg) rotateY(0deg) rotate(${p.r}deg)`}],{duration:1500,delay:i*120,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})});
    Promise.all(animations.map(a=>a.finished.catch(()=>{}))).then(()=>{entering=false;queue()});
  }
})();
