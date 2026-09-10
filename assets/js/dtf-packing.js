/* DTF-only deterministic shelf packing. All geometry is in integer tenths of cm.
 * Each design reserves gap on its right and bottom, including the roll edges.
 * A feasible heuristic, not an optimal nesting or billing calculation. */
(function (root) {
  'use strict';
  function decimal(value, min, max, label) {
    const text=String(value).trim();
    const number=Number(text.replace(',','.'));
    if (!/^\d+(?:[.,]\d)?$/.test(text) || !Number.isFinite(number) || number<min || number>max)
      throw new Error(`${label}: τιμή από ${min} έως ${max}, με έως ένα δεκαδικό (κόμμα ή τελεία).`);
    return number;
  }
  function pack(rows, options) {
    if (!Array.isArray(rows) || rows.length<1 || rows.length>20) throw new Error('Προσθέστε από 1 έως 20 σχέδια.');
    if (!options || typeof options.rotation!=='boolean') throw new Error('Επιλέξτε αν επιτρέπεται περιστροφή.');
    options={width:decimal(options.width,0.1,60,'Ωφέλιμο πλάτος (cm)'),gap:decimal(options.gap,0,10,'Περιθώριο (cm)'),rotation:options.rotation};
    let total=0;
    rows=rows.map((r,i)=>{
      const quantity=Number(r.quantity);
      if (!/^[1-9]\d*$/.test(String(r.quantity).trim()) || !Number.isSafeInteger(quantity) || quantity>500) throw new Error(`Σχέδιο ${i+1}: τα τεμάχια πρέπει να είναι ακέραιος από 1 έως 500.`);
      total+=quantity;
      return {width:decimal(r.width,0.1,1000,`Σχέδιο ${i+1} · πλάτος (cm)`),height:decimal(r.height,0.1,1000,`Σχέδιο ${i+1} · ύψος (cm)`),quantity};
    });
    if (total>500) throw new Error('Έως 500 τεμάχια συνολικά για γρήγορη προεπισκόπηση. Για μεγαλύτερη ποσότητα ζητήστε προσφορά.');
    const width = Math.round(options.width * 10), gap = Math.round(options.gap * 10);
    const items = rows.flatMap((r, row) => Array.from({length:r.quantity}, () => ({row, w:Math.round(r.width*10), h:Math.round(r.height*10)})));
    function candidate(order, preferRotation) {
      const shelves = [], placements = [];
      let length = 0;
      for (const item of order) {
        const orientations = [{w:item.w,h:item.h,rotated:false}];
        if (options.rotation && item.w !== item.h) orientations.push({w:item.h,h:item.w,rotated:true});
        const fits = orientations.filter(o=>o.w+gap<=width);
        if (!fits.length) throw new Error(`Το σχέδιο ${item.row+1} δεν χωρά στο ωφέλιμο πλάτος με αυτό το περιθώριο. Ελέγξτε τις διαστάσεις ή την περιστροφή.`);
        let chosen;
        for (const shelf of shelves) for (const o of fits) {
          if (shelf.used+o.w+gap<=width && o.h+gap<=shelf.height) {
            const waste = (width-shelf.used-o.w-gap)*shelf.height;
            if (!chosen || waste<chosen.waste) chosen={shelf,o,waste};
          }
        }
        if (!chosen) {
          const o = fits.slice().sort((a,b)=> preferRotation ? a.h-b.h || a.w-b.w : Number(a.rotated)-Number(b.rotated))[0];
          const shelf = {y:length,height:o.h+gap,used:0};
          shelves.push(shelf); length+=shelf.height; chosen={shelf,o};
        }
        const {shelf,o}=chosen;
        placements.push({row:item.row,x:shelf.used/10,y:shelf.y/10,width:o.w/10,height:o.h/10,rotated:o.rotated});
        shelf.used+=o.w+gap;
      }
      return {length:length/10,meters:length/1000,placements};
    }
    const orders = [items, items.slice().sort((a,b)=>Math.max(b.w,b.h)-Math.max(a.w,a.h)||b.w*b.h-a.w*a.h)];
    let best;
    for (const order of orders) for (const rotate of [false,true]) {
      const result=candidate(order,rotate);
      if (!best || result.length<best.length) best=result;
    }
    // Retain the non-rotated baseline when rotation is optional, so enabling it
    // cannot worsen an already feasible estimate.
    if (options.rotation && items.every(item=>item.w+gap<=width)) {
      const baseline=pack(rows,{...options,rotation:false});
      if (baseline.length<best.length) best=baseline;
    }
    return best;
  }
  const api={pack};
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.DtfPacking=api;
})(typeof globalThis!=='undefined'?globalThis:this);
