/* Only this page owns these IDs: legacy single-design listeners remain inactive. */
(() => {
  'use strict';
  const root=document.getElementById('dtf-mixed');
  if (!root || !window.DtfPacking) return;
  const get=id=>document.getElementById(id), rowsHost=get('dtf-rows'), template=rowsHost.firstElementChild.cloneNode(true);
  const result=get('dtf-result'), error=get('dtf-error'), diagram=get('dtf-diagram'), legend=get('dtf-legend');
  const add=get('dtf-add'), send=get('dtf-send'), form=document.querySelector('.quote-form');
  const colors=['#d2eaf1','#f5d4bd','#dcd9f1','#d3e5c6','#f4e2ad'];
  const number=value=>Number(String(value).replace(',','.'));
  const fmt=value=>Number(value).toLocaleString('el-GR',{maximumFractionDigits:1,useGrouping:false});
  const meters=value=>(Math.ceil(Math.round(value*10)/10)/100).toFixed(2).replace('.',',');
  let current=null, timer, insertedQuantity='';
  function clearQuote() {
    if (!form) return;
    const message=form.elements.message;
    if (message && message.value.includes('[Υπολογιστής DTF — ενδεικτικό]')) {
      message.value=message.value.replace(/\n*\[Υπολογιστής DTF — ενδεικτικό\][\s\S]*?\[\/Υπολογιστής DTF\]/g,'');
      const status=form.querySelector('.quote-status');
      if (status) status.textContent='Τα στοιχεία του υπολογιστή άλλαξαν. Μεταφέρετε ξανά το νέο αποτέλεσμα πριν ζητήσετε προσφορά.';
    }
    if (insertedQuantity && form.elements.quantity?.value===insertedQuantity) form.elements.quantity.value='';
    insertedQuantity='';
  }
  function renumber() {
    const all=[...rowsHost.children];
    all.forEach((row,i)=>{
      row.querySelector('legend').textContent=`Σχέδιο ${i+1}`;
      const remove=row.querySelector('button');remove.disabled=all.length===1;remove.setAttribute('aria-label',`Αφαίρεση σχεδίου ${i+1}`);
      row.querySelectorAll('input').forEach(input=>input.setAttribute('aria-label',`Σχέδιο ${i+1} · ${input.parentElement.firstChild.textContent}`));
    });
    add.disabled=all.length>=20;
  }
  function svgNode(tag,attrs,text) {
    const node=document.createElementNS('http://www.w3.org/2000/svg',tag);
    Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));
    if (text!==undefined) node.textContent=text;
    return node;
  }
  function draw(data, rows, options) {
    diagram.replaceChildren();legend.replaceChildren();
    const svg=svgNode('svg',{viewBox:`0 0 ${options.width} ${data.length}`,role:'img','aria-labelledby':'dtf-svg-title dtf-svg-desc',preserveAspectRatio:'xMidYMid meet'});
    svg.append(svgNode('title',{id:'dtf-svg-title'},`Ενδεικτική διάταξη ${data.placements.length} τεμαχίων`),svgNode('desc',{id:'dtf-svg-desc'},`Πλάτος ${fmt(options.width)} cm, μήκος ${fmt(data.length)} cm. Οι αριθμοί αντιστοιχούν στα σχέδια της λίστας. Περιθώριο ${fmt(options.gap)} cm δεξιά και κάτω από κάθε σχέδιο. Η λευκή περιοχή δεν χρησιμοποιείται.`));
    svg.append(svgNode('rect',{width:options.width,height:data.length,fill:'#fff',stroke:'#637481','stroke-width':1,'vector-effect':'non-scaling-stroke'}));
    const scale=Math.min(340/options.width,320/data.length);
    for (const p of data.placements) {
      const rect=svgNode('rect',{x:p.x,y:p.y,width:p.width,height:p.height,fill:colors[p.row%colors.length],stroke:'#526777','stroke-width':0.7,'vector-effect':'non-scaling-stroke','data-row':p.row});
      rect.append(svgNode('title',{},`Σχέδιο ${p.row+1}: ${fmt(p.width)} × ${fmt(p.height)} cm${p.rotated?' · περιστροφή 90°':''}`));svg.append(rect);
      if (Math.min(p.width,p.height)*scale>=18) svg.append(svgNode('text',{x:p.x+p.width/2,y:p.y+p.height/2,'text-anchor':'middle','dominant-baseline':'central','font-size':12/scale,fill:'#213343','font-weight':700},p.row+1));
    }
    diagram.append(svg);
    get('dtf-caption').textContent=`← ${fmt(options.width)} cm πλάτος → · ${fmt(data.length)} cm μήκος ↓`;
    rows.forEach((r,i)=>{
      const li=document.createElement('li'),swatch=document.createElement('span');swatch.className='dtf-swatch';swatch.style.background=colors[i%colors.length];swatch.textContent=i+1;
      li.append(swatch,document.createTextNode(`${fmt(number(r.width))} × ${fmt(number(r.height))} cm · ${r.quantity} τεμάχια`));legend.append(li);
    });
  }
  function calculate() {
    clearTimeout(timer);current=null;
    const rows=[...rowsHost.children].map(row=>({width:row.querySelector('[data-dtf-width]').value,height:row.querySelector('[data-dtf-height]').value,quantity:row.querySelector('[data-dtf-quantity]').value}));
    const options={width:get('dtf-roll').value,gap:get('dtf-gap').value,rotation:get('dtf-rotation').checked};
    try {
      const data=window.DtfPacking.pack(rows,options);
      options.width=number(options.width);options.gap=number(options.gap);
      root.querySelector('summary span').textContent=`${fmt(options.width)} cm · περιθώριο ${fmt(options.gap)} cm · ${options.rotation?'με':'χωρίς'} περιστροφή`;
      result.textContent=`${meters(data.length)} τρέχοντα μέτρα · ${data.placements.length} τεμάχια`;
      error.hidden=true;error.textContent='';get('dtf-layout').hidden=false;send.disabled=false;
      draw(data,rows,options);current={data,rows,options};
    } catch (e) {
      result.textContent='Δεν υπάρχει έγκυρη εκτίμηση.';error.textContent=e.message;error.hidden=false;
      diagram.replaceChildren();legend.replaceChildren();get('dtf-layout').hidden=true;send.disabled=true;
    }
    return current;
  }
  root.addEventListener('input',()=>{
    clearQuote();current=null;send.disabled=true;result.textContent='Ενημέρωση εκτίμησης…';diagram.replaceChildren();legend.replaceChildren();
    clearTimeout(timer);timer=setTimeout(calculate,120);
  });
  add.addEventListener('click',()=>{
    if (rowsHost.children.length>=20) return;
    clearQuote();const row=template.cloneNode(true);row.querySelectorAll('input').forEach(input=>input.value=input.hasAttribute('data-dtf-quantity')?'1':'');
    rowsHost.append(row);renumber();calculate();row.querySelector('input').focus();
  });
  rowsHost.addEventListener('click',event=>{
    const button=event.target.closest('.dtf-remove');if (!button || rowsHost.children.length===1) return;
    clearQuote();const row=button.closest('.dtf-row'),next=row.nextElementSibling||row.previousElementSibling;row.remove();renumber();calculate();next.querySelector('input').focus();
  });
  send.addEventListener('click',()=>{
    const state=calculate();if (!state || !form) return;
    clearQuote();const {data,rows,options}=state;
    const block=['[Υπολογιστής DTF — ενδεικτικό]',...rows.map((r,i)=>`Σχέδιο ${i+1}: ${fmt(number(r.width))} × ${fmt(number(r.height))} cm · ${r.quantity} τεμάχια`),`Σύνολο: ${data.placements.length} τεμάχια`,`Προσωρινές ρυθμίσεις: ωφέλιμο πλάτος ${fmt(options.width)} cm · περιθώριο ${fmt(options.gap)} cm δεξιά και κάτω ανά σχέδιο, μαζί με τα άκρα · περιστροφή 90° ${options.rotation?'επιτρέπεται':'δεν επιτρέπεται'}`,`Ενδεικτικό μήκος: ${fmt(data.length)} cm / ${meters(data.length)} τρέχοντα μέτρα (στρογγυλοποίηση προς τα πάνω στο cm, όχι βήμα χρέωσης).`,'Ενδεικτική διάταξη και εκτίμηση μήκους. Η τελική μακέτα επιβεβαιώνεται μετά τον έλεγχο των αρχείων. Δεν αποτελεί τελική τιμή ή εγγύηση ελάχιστου μήκους.','[/Υπολογιστής DTF]'].join('\n');
    const message=form.elements.message;message.value+=(message.value?'\n\n':'')+block;
    insertedQuantity=`${data.placements.length} τεμάχια · ${rows.length} σχέδια · ενδεικτικά ${meters(data.length)} m`;
    form.elements.quantity.value=insertedQuantity;form.elements.service_context.value='Στάμπες DTF με το μέτρο';form.elements.service_select.value='Στάμπες DTF με το μέτρο';
    form.querySelector('.quote-status').textContent='Μεταφέρθηκαν όλα τα σχέδια και οι ρυθμίσεις. Ελέγξτε τα στοιχεία· δεν έχει σταλεί αίτημα.';
    history.replaceState(null,'','#quote');form.scrollIntoView({behavior:'auto',block:'start'});form.elements.name.focus({preventScroll:true});
  });
  renumber();calculate();root.hidden=false;get('dtf-fallback').hidden=true;
})();
