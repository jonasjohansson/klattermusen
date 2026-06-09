(() => {
  "use strict";
  const $ = s => document.querySelector(s);

  // ---------- model ----------
  const RUG_M = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--rug-m')) || 2.0;
  let N = 400;
  let grid = [];
  // Tufting Europe NZ-wool range. u = product slug, s = in stock (1) / sold out (0)
  // — stock checked 2026-06-09; product URL built in yarnUrl().
  let palette = [
    {hex:'#f3f0e9', name:'White',          u:'white',          s:0},
    {hex:'#e4dccb', name:'Light Beige',    u:'light-beige',    s:1},
    {hex:'#d6bd96', name:'Honey Beige',    u:'beige',          s:1},
    {hex:'#9a8f6b', name:'Khaki',          u:'khaki',          s:1},
    {hex:'#b08a63', name:'Light Brown',    u:'light-brown',    s:1},
    {hex:'#8a5a37', name:'Maple Brown',    u:'maple-brown',    s:1},
    {hex:'#4f3a2a', name:'Dark Brown',     u:'dark-brown',     s:1},
    {hex:'#c9c6c0', name:'Light Grey',     u:'light-grey',     s:1},
    {hex:'#6d6d70', name:'Dark Grey',      u:'dark-grey',      s:1},
    {hex:'#45454a', name:'Graphite Grey',  u:'graphite-grey',  s:1},
    {hex:'#1d1c1a', name:'Black',          u:'black',          s:0},
    {hex:'#edc3a6', name:'Peachy Beige',   u:'peachy-beige',   s:0},
    {hex:'#e89a82', name:'Salmon',         u:'salmon',         s:1},
    {hex:'#c8702f', name:'Ginger Orange',  u:'ginger-orange',  s:1},
    {hex:'#e8631f', name:'Orange Blast',   u:'orange-blast',   s:1},
    {hex:'#f4361f', name:'Fluor Red',      u:'fluor-red',      s:1},
    {hex:'#b81f2d', name:'Cherry Red',     u:'cherry-red',     s:1},
    {hex:'#6e1f2a', name:'Bordeaux',       u:'bordeaux',       s:1},
    {hex:'#c98e2b', name:'Ochre Yellow',   u:'ochre-yellow',   s:0},
    {hex:'#d9a72b', name:'Mustard Yellow', u:'mustard-yellow', s:0},
    {hex:'#f2c623', name:'Yellow',         u:'yellow',         s:0},
    {hex:'#6f6f33', name:'Olive Green',    u:'olive-green',    s:0},
    {hex:'#6b8540', name:'Moss Green',     u:'moss-green',     s:1},
    {hex:'#2f5233', name:'Forest Green',   u:'forest-green',   s:0},
    {hex:'#234b3a', name:'Pine Green',     u:'pine-green',     s:0},
    {hex:'#1f7a78', name:'Teal',           u:'teal',           s:1},
    {hex:'#6fb3ad', name:'Light Teal',     u:'light-teal',     s:1},
    {hex:'#1fb0a8', name:'Turquoise',      u:'turquoise',      s:1},
    {hex:'#a9ddd6', name:'Light Aqua',     u:'light-aqua',     s:1},
    {hex:'#a7cfe8', name:'Light Blue',     u:'light-blue',     s:1},
    {hex:'#6fb0de', name:'Sky Blue',       u:'sky-blue',       s:1},
    {hex:'#5a7d99', name:'Steel Blue',     u:'steel-blue',     s:1},
    {hex:'#2f5aa8', name:'Cobalt Blue',    u:'cobalt-blue',    s:1},
    {hex:'#2c3b78', name:'Mid Indigo Blue',u:'mid-indigo-blue',s:1},
    {hex:'#1e2a52', name:'Navy Blue',      u:'navy-blue',      s:0},
    {hex:'#6a4ca0', name:'Violet',         u:'violet',         s:1},
    {hex:'#4a2f6b', name:'Dark Purple',    u:'dark-purple',    s:1},
    {hex:'#4a2440', name:'Aubergine Purple',u:'auberginepurple',s:1},
    {hex:'#d44d8a', name:'Deep Pink',      u:'deep-pink',      s:0},
    {hex:'#c0357f', name:'Fuchsia Pink',   u:'fuchsia-pink',   s:1},
    {hex:'#ecc0d2', name:'Light Pink',     u:'light-pink',     s:0},
  ];
  // Suppliers (stock checked 2026-06-09). The design palette is shared; the toggle
  // reframes pricing/links/stock for the BOM. Hitex/Tufting Shop links go to their
  // catalogue (no per-colour slugs); their colour match is approximate.
  // All prices in SEK. EUR suppliers converted at ~11.3 SEK/€ (Tufting Europe €17.50/cone ≈ 198 kr).
  // mat = rough material costs (cloth, glue, backing) for a 2×2m rug.
  const SUPPLIERS = {
    te:          { label:'Tufting Europe', cur:'kr', unit:'cone', coneG:500, price:198, link:c=>'https://tuftingeurope.com/product/'+c.u+'-tufting-yarn-500g-wool/', stock:c=>!!c.s, mat:{cloth:509, glue:226, backing:203}, ship:0 },
    tuftingshop: { label:'Tufting Shop',   cur:'kr', unit:'cone', coneG:500, price:202, link:()=> 'https://tuftingshop.com/sv/collections/yarn',                       stock:()=> true, mat:{cloth:509, glue:226, backing:203}, ship:0 },
    hitex:       { label:'Hitex',          cur:'kr', unit:'kg',              price:594, link:()=> 'https://hitex.se/products/tufting-yarn/',                            stock:()=> true, mat:{cloth:450, glue:220, backing:190}, ship:199 },
  };
  let supplier = 'hitex';
  const inStock = c => SUPPLIERS[supplier].stock(c);
  let recolorTarget = null;
  let groundIdx = null, patternB = null, groundMask = null;   // background-pattern state
  let bgColors = new Set();   // palette indices that make up the background (1 = plain, 2 = checker, many = image)
  let chipOrder = [];   // stable slot order for the in-rug chips (so recolouring doesn't reshuffle them)

  const undoStack = [], redoStack = [];
  function blankGrid(n){ return Array.from({length:n}, () => new Array(n).fill(-1)); }

  const designCanvas = $('#designCanvas'), dctx = designCanvas.getContext('2d');
  const previewCanvas = $('#previewCanvas'), pctx = previewCanvas.getContext('2d');
  const studioCanvas = $('#studioCanvas'), sctx = studioCanvas.getContext('2d');
  // the wool texture is expensive; render it once per edit into this cache and reuse for preview + studio
  const tuftCache = document.createElement('canvas'); tuftCache.width = tuftCache.height = 640; const tctx = tuftCache.getContext('2d');

  // ---------- history ----------
  function snapshot(){ return JSON.stringify({grid, palette}); }
  function pushHistory(){ undoStack.push(snapshot()); if (undoStack.length>80) undoStack.shift(); redoStack.length=0; }
  function restore(s){ const d=JSON.parse(s); grid=d.grid; palette=d.palette; afterEdit(); }
  function undo(){ if(!undoStack.length) return; redoStack.push(snapshot()); restore(undoStack.pop()); }
  function redo(){ if(!redoStack.length) return; undoStack.push(snapshot()); restore(redoStack.pop()); }

  // ---------- render: flat design ----------
  function fillGridCells(ctx, w, bg){
    const s=w/N;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){ const v=grid[y][x]; ctx.fillStyle = v<0?bg:palette[v].hex; ctx.fillRect(x*s, y*s, Math.ceil(s), Math.ceil(s)); }
  }
  function drawDesign(){ const w=designCanvas.width; dctx.clearRect(0,0,w,w); fillGridCells(dctx, w, '#fbfaf7'); }

  // ---------- render: tufted wool ----------
  function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
  function hexToRgb(hex){ const n=parseInt(hex.slice(1),16); return [(n>>16)&255,(n>>8)&255,n&255]; }
  function shade(hex, amt){ const [r,g,b]=hexToRgb(hex), c=v=>Math.max(0,Math.min(255,v+amt))|0; return `rgb(${c(r)},${c(g)},${c(b)})`; }

  function drawTufted(ctx, w){
    const s = w/N;
    ctx.clearRect(0,0,w,w);
    ctx.fillStyle='#efece6'; ctx.fillRect(0,0,w,w);
    let any=false; for(let y=0;y<N&&!any;y++) for(let x=0;x<N;x++) if(grid[y][x]>=0){any=true;break;}
    if (!any){
      ctx.strokeStyle='#d8d2c7'; ctx.lineWidth=Math.max(2,w*0.004); ctx.setLineDash([w*0.02,w*0.02]);
      ctx.strokeRect(w*0.08,w*0.08,w*0.84,w*0.84); ctx.setLineDash([]);
      ctx.fillStyle='#b3ada2'; ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.font=`600 ${Math.round(w*0.03)}px ${getComputedStyle(document.body).fontFamily}`;
      ctx.fillText('Upload artwork to begin', w/2, w/2);
      return;
    }
    const rnd = mulberry32(12345 + N*7);
    const tuft = Math.max(2, s/4);
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const v = grid[y][x]; if (v<0) continue;
      const hex = palette[v].hex;
      ctx.fillStyle = hex; ctx.fillRect(x*s, y*s, s+0.6, s+0.6);
      const strokes = s < 5 ? 2 : (s < 9 ? 5 : Math.max(6, (s*s)/(tuft*tuft) * 1.6));
      for (let i=0;i<strokes;i++){
        const px=x*s+rnd()*s, py=y*s+rnd()*s, len=tuft*(0.7+rnd()*0.8), ang=-1.0-rnd()*0.6, lift=(rnd()*54)-22;
        ctx.strokeStyle=shade(hex,lift); ctx.lineWidth=Math.max(1,tuft*0.55); ctx.lineCap='round';
        ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+Math.cos(ang)*len, py+Math.sin(ang)*len); ctx.stroke();
      }
    }
    ctx.lineWidth=Math.max(1,s*0.06);
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){
      const v=grid[y][x]; if(v<0) continue;
      if (x<N-1 && grid[y][x+1]!==v){ ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo((x+1)*s,y*s); ctx.lineTo((x+1)*s,(y+1)*s); ctx.stroke(); }
      if (y<N-1 && grid[y+1][x]!==v){ ctx.strokeStyle='rgba(0,0,0,.12)'; ctx.beginPath(); ctx.moveTo(x*s,(y+1)*s); ctx.lineTo((x+1)*s,(y+1)*s); ctx.stroke(); }
    }
    const rg=ctx.createRadialGradient(w/2,w/2,w*0.2,w/2,w/2,w*0.72);
    rg.addColorStop(0,'rgba(255,255,255,0)'); rg.addColorStop(1,'rgba(0,0,0,.08)');
    ctx.fillStyle=rg; ctx.fillRect(0,0,w,w);
    ctx.strokeStyle='rgba(0,0,0,.25)'; ctx.lineWidth=Math.max(2,s*0.25);
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w-ctx.lineWidth, w-ctx.lineWidth);
  }

  // ---------- scenes + perspective warp ----------
  const BG = {
    room:   { src:'room.jpg',   blend:'normal',
              // upright square centred at X31% / Y41%, scale 149% (Jonas's preferred default)
              corners:[ {x:0.157,y:0.219}, {x:0.464,y:0.219}, {x:0.464,y:0.601}, {x:0.157,y:0.601} ] },
    studio: { src:'studio.jpg', blend:'multiply',
              corners:[ {x:0.300,y:0.300}, {x:0.700,y:0.300}, {x:0.700,y:0.700}, {x:0.300,y:0.700} ] },
    custom: { src:'',           blend:'normal',
              corners:[ {x:0.300,y:0.300}, {x:0.700,y:0.300}, {x:0.700,y:0.700}, {x:0.300,y:0.700} ] },
  };
  let bgKey = 'room';
  let corners = JSON.parse(JSON.stringify(BG[bgKey].corners));

  function adj(m){ return [ m[4]*m[8]-m[5]*m[7], m[2]*m[7]-m[1]*m[8], m[1]*m[5]-m[2]*m[4],
    m[5]*m[6]-m[3]*m[8], m[0]*m[8]-m[2]*m[6], m[2]*m[3]-m[0]*m[5],
    m[3]*m[7]-m[4]*m[6], m[1]*m[6]-m[0]*m[7], m[0]*m[4]-m[1]*m[3] ]; }
  function multmm(a,b){ const c=new Array(9); for(let i=0;i<3;i++)for(let j=0;j<3;j++){let s=0;for(let k=0;k<3;k++)s+=a[3*i+k]*b[3*k+j];c[3*i+j]=s;} return c; }
  function multmv(m,v){ return [ m[0]*v[0]+m[1]*v[1]+m[2]*v[2], m[3]*v[0]+m[4]*v[1]+m[5]*v[2], m[6]*v[0]+m[7]*v[1]+m[8]*v[2] ]; }
  function basisToPoints(x1,y1,x2,y2,x3,y3,x4,y4){ const m=[x1,x2,x3,y1,y2,y3,1,1,1]; const v=multmv(adj(m),[x4,y4,1]); return multmm(m,[v[0],0,0,0,v[1],0,0,0,v[2]]); }
  function general2DProjection(s,d){ const S=basisToPoints(s[0],s[1],s[2],s[3],s[4],s[5],s[6],s[7]); const D=basisToPoints(d[0],d[1],d[2],d[3],d[4],d[5],d[6],d[7]); return multmm(D, adj(S)); }
  function matFromCorners(W,H,c){
    const d=[ c[0].x*W,c[0].y*H, c[1].x*W,c[1].y*H, c[3].x*W,c[3].y*H, c[2].x*W,c[2].y*H ];
    const s=[ 0,0, W,0, 0,H, W,H ];
    const t=general2DProjection(s,d); for(let i=0;i<9;i++) t[i]/=t[8];
    return 'matrix3d('+[ t[0],t[3],0,t[6], t[1],t[4],0,t[7], 0,0,1,0, t[2],t[5],0,t[8] ].join(',')+')';
  }

  // paint the studio rug from the shared wool cache (cheap blit, no re-render)
  function paintStudio(){ studioCanvas.width=500; studioCanvas.height=500; sctx.drawImage(tuftCache, 0,0, 500,500); }
  // cheap: reposition/scale the already-painted canvas — coalesced to one update per frame
  let placePending=false;
  function placeStudio(){
    if(placePending) return; placePending=true;
    requestAnimationFrame(()=>{
      placePending=false;
      const wrap=$('#studioWrap'), W=wrap.clientWidth, H=wrap.clientHeight; if(!W||!H) return;
      studioCanvas.style.width=W+'px'; studioCanvas.style.height=H+'px';
      studioCanvas.style.transform=matFromCorners(W,H,corners);
      $('#studioWarp').style.mixBlendMode=BG[bgKey].blend;
      positionHandles(); syncXY(); queueSave();
    });
  }
  function drawStudio(){ paintStudio(); placeStudio(); }
  function positionHandles(){
    const wrap=$('#studioWrap'); const W=wrap.clientWidth, H=wrap.clientHeight;
    document.querySelectorAll('.handle').forEach(h=>{ const c=corners[+h.dataset.corner]; h.style.left=(c.x*W)+'px'; h.style.top=(c.y*H)+'px'; });
  }

  // ---------- fit the two media boxes into their views ----------
  function fitMedia(){
    const rv=$('#paneRoom'), wrap=$('#studioWrap'), ar=2000/1600;
    let vw=rv.clientWidth, vh=rv.clientHeight;                 // room = COVER: fill the pane, crop overflow
    if (vw>0 && vh>0){ let w=Math.max(vw, vh*ar); wrap.style.width=w+'px'; wrap.style.height=(w/ar)+'px'; }
    const cv=$('#paneCompare'), cmp=$('#compare');             // compare = CONTAIN square, edge to edge
    let cw=Math.min(cv.clientWidth, cv.clientHeight);
    if (cw>0){ cmp.style.width=cw+'px'; cmp.style.height=cw+'px'; }
    placeStudio();
  }

  // ---------- estimate ----------
  const DENSITY = 2.6;   // kg/m² pile — fixed
  function renderEstimate(){
    const sup=SUPPLIERS[supplier], price=sup.price, m=sup.mat;
    const counts=new Array(palette.length).fill(0); let filled=0;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0){counts[v]++; filled++;} }
    const cellArea=(RUG_M/N)*(RUG_M/N);
    let rows='', totalKg=0, totalCost=0, totalCones=0, anyOOS=false;
    palette.forEach((c,i)=>{
      if(!counts[i]) return;
      const kg=counts[i]*cellArea*DENSITY; totalKg+=kg;
      let detail, cost;
      if (sup.unit==='cone'){ const cones=Math.ceil(kg*1000/sup.coneG); totalCones+=cones; cost=cones*price; detail=`${cones} cone${cones>1?'s':''}`; }
      else { const billKg=Math.max(1,kg); cost=billKg*price; detail=`${billKg.toFixed(1)} kg`; }   // Hitex: 1kg min/colour
      totalCost+=cost;
      const ok=sup.stock(c); if(!ok) anyOOS=true;
      rows+=`<tr><td class="c"><span class="dot" style="background:${c.hex}"></span></td>`+
        `<td><a href="${sup.link(c)}" target="_blank" rel="noopener">${c.name}</a>${ok?'':' <span class="oos">sold out</span>'}</td>`+
        `<td class="n">${detail}</td><td class="n">${sup.cur}${cost.toFixed(0)}</td></tr>`;
    });
    const ship=sup.ship||0, matSum=m.cloth+m.glue+m.backing+ship;
    if (filled){
      [['Tufting cloth',m.cloth],['Glue',m.glue],['Backing',m.backing],['Shipping',ship]].forEach(([nm,cost])=>{
        rows+=`<tr class="mat"><td class="c"></td><td>${nm}</td><td class="n"></td><td class="n">${sup.cur}${cost.toFixed(0)}</td></tr>`;
      });
    }
    const grand=totalCost+matSum;
    const total = filled
      ? `<strong>${totalKg.toFixed(1)} kg</strong>${totalCones?' · '+totalCones+' cones':''} · <strong>${sup.cur}${grand.toFixed(0)}</strong>${anyOOS?' · <span class="oos">some sold out</span>':''}`
      : 'Upload artwork to see the yarn estimate.';
    $('#bom').innerHTML = filled
      ? `<table class="est-table"><tbody>${rows}</tbody></table><div class="est-total">${total}</div>`
      : `<span class="lbl">${total}</span>`;
    $('#bomSummary').textContent = filled ? (sup.cur+grand.toFixed(0)) : 'BOM';
  }

  // ---------- recolour (used colours + full palette tray in the dock) ----------
  function remapColour(from, to){
    if(from===to) return;
    pushHistory();
    for(let y=0;y<N;y++)for(let x=0;x<N;x++) if(grid[y][x]===from) grid[y][x]=to;
    // keep pattern state in sync so re-patterning doesn't stack old colours
    if(groundIdx===from) groundIdx=to;
    if(patternB===from) patternB=to;
    if(bgColors.has(from)){ bgColors.delete(from); bgColors.add(to); }
    const oi=chipOrder.indexOf(from); if(oi>=0){ chipOrder[oi]=to; chipOrder=chipOrder.filter((v,idx)=> idx===oi || v!==to); }  // keep the same slot
    recolorTarget=to; afterEdit();
  }

  // ---------- background pattern (mask-based: only the background cells, never the symbol) ----------
  function defaultPatternB(){ return groundIdx===2 ? 8 : 2; }   // a contrasting yarn; recolour it via its chip like any colour
  function applyPattern(){
    if(!groundMask) return;
    const type=$('#patType').value;
    if(type==='image') return;                                   // image backgrounds are applied via the button
    const count=Math.max(2,Math.min(6,parseInt($('#patSize').value)||6)), b=Math.max(1,Math.round(N/count));   // Squares = checker squares per side (2–6)
    if(type==='checker' && patternB==null) patternB=defaultPatternB();
    if(patternB!=null && !chipOrder.includes(patternB)) chipOrder.push(patternB);   // alt background = last slot
    pushHistory();
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      if(!groundMask[y*N+x]) continue;                            // pattern only touches captured background cells
      const g = type==='checker' ? (((Math.floor(x/b)+Math.floor(y/b))&1)===0) : true;
      grid[y][x]= g?groundIdx:patternB;
    }
    bgColors = type==='checker' ? new Set([groundIdx, patternB]) : new Set([groundIdx]);
    afterEdit();
  }
  $('#patType').onchange=()=>{ if($('#patType').value==='image') $('#bgPatInput').click(); else applyPattern(); };
  $('#patSize').onchange=applyPattern;

  // multi-colour background from an image — quantised to the palette, only over the background mask
  function applyBgImage(img){
    if(!groundMask) return;
    const k=Math.max(2,Math.min(8,parseInt($('#bgColorsN').value)||4));
    const off=document.createElement('canvas'); off.width=off.height=N; const o=off.getContext('2d');
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height, sc=Math.max(N/iw,N/ih), dw=iw*sc, dh=ih*sc;
    o.imageSmoothingEnabled=true; o.drawImage(img,(N-dw)/2,(N-dh)/2,dw,dh);
    const data=o.getImageData(0,0,N,N).data, rgbs=palRgb();
    // exclude the symbol's colours (those used outside the mask) so the background never collides with the logo
    const symbolSet=new Set();
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!groundMask[y*N+x]){ const v=grid[y][x]; if(v>=0) symbolSet.add(v); } }
    let allowed=palette.map((c,i)=>i).filter(i=>!symbolSet.has(i)); if(!allowed.length) allowed=palette.map((c,i)=>i);
    const nearAllow=(r,g,b)=>{ let best=allowed[0],bd=Infinity; for(const i of allowed){ const [pr,pg,pb]=rgbs[i]; const d=(pr-r)**2+(pg-g)**2+(pb-b)**2; if(d<bd){bd=d;best=i;} } return best; };
    pushHistory();
    const counts={}, tmpIdx=new Int16Array(N*N);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const m=y*N+x; if(!groundMask[m]){ tmpIdx[m]=-1; continue; } const p=m*4; const idx=nearAllow(data[p],data[p+1],data[p+2]); tmpIdx[m]=idx; counts[idx]=(counts[idx]||0)+1; }
    const kept=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]).slice(0,k), keptRgb=kept.map(i=>rgbs[i]), remap={};
    for(const i of Object.keys(counts).map(Number)){ if(kept.includes(i)){remap[i]=i;continue;} const [r,g,b]=rgbs[i]; let best=kept[0],bd=Infinity; kept.forEach((ki,ji)=>{const[pr,pg,pb]=keptRgb[ji];const d=(pr-r)**2+(pg-g)**2+(pb-b)**2;if(d<bd){bd=d;best=ki;}}); remap[i]=best; }
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const t=tmpIdx[y*N+x]; if(t<0)continue; grid[y][x]=remap[t]; }
    bgColors=new Set(kept.map(i=>remap[i]));
    bgColors.forEach(i=>{ if(!chipOrder.includes(i)) chipOrder.push(i); });
    if($('#patType')) $('#patType').value='image';
    afterEdit();
  }
  $('#bgPatBtn').onclick = ()=> $('#bgPatInput').click();
  $('#bgPatInput').onchange = e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>applyBgImage(img); img.onerror=()=>alert('Could not load image.'); img.src=URL.createObjectURL(f); e.target.value=''; };
  function renderRecolour(){
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    const used=palette.map((c,i)=>i).filter(i=>counts[i]>0);
    const rc=$('#rugColors'), tray=$('#paletteTray'); rc.innerHTML=''; tray.innerHTML='';
    if(!used.length){ rc.innerHTML='<span class="lbl">Upload artwork to begin</span>'; return; }
    if(recolorTarget==null || recolorTarget>=palette.length) recolorTarget=used[0];
    const ordered=chipOrder.filter(i=>counts[i]>0); used.forEach(i=>{ if(!ordered.includes(i)) ordered.push(i); });   // stable slots; new colours appended

    const l=document.createElement('span'); l.className='lbl'; l.textContent='In rug'; rc.appendChild(l);
    ordered.forEach(i=>{
      const chip=document.createElement('div'); chip.className='rc-chip'+(i===recolorTarget?' active':'');
      const sw=document.createElement('span'); sw.className='sw'+(inStock(palette[i])?'':' oos'); sw.style.background=palette[i].hex;
      const nm=document.createElement('span'); nm.className='nm'; nm.textContent=palette[i].name+(inStock(palette[i])?'':' (sold out)');
      const role=document.createElement('span'); role.className='role'; role.textContent= i===patternB?'alt background' : (bgColors.has(i)?'background':'symbol');
      chip.appendChild(sw); chip.appendChild(nm); chip.appendChild(role);
      chip.onclick=()=>{ recolorTarget=i; renderRecolour(); };
      rc.appendChild(chip);
    });

    palette.forEach((c,j)=>{
      const s=document.createElement('button'); s.className='tray-sw'+(inStock(c)?'':' oos'); s.style.background=c.hex; s.title=c.name+(inStock(c)?'':' — sold out');
      s.onclick=()=> remapColour(recolorTarget, j);
      tray.appendChild(s);
    });
  }

  // ---------- orchestration ----------
  function redrawAll(){
    drawDesign();
    drawTufted(tctx, 640);                                         // render the wool ONCE into the cache
    pctx.clearRect(0,0,previewCanvas.width,previewCanvas.height);
    pctx.drawImage(tuftCache, 0,0, previewCanvas.width, previewCanvas.height);
    drawStudio();                                                  // paintStudio blits the same cache
    renderEstimate();
  }
  function afterEdit(){ redrawAll(); renderRecolour(); queueSave(); }
  function updateLabels(){ $('#dimLabel').textContent=`${RUG_M.toFixed(1)} × ${RUG_M.toFixed(1)} m`; $('#cellLabel').textContent=`${Math.round(RUG_M/N*1000)} mm`; }

  // ---------- supplier (BOM pricing / links / stock) ----------
  $('#supplier').onchange = e=>{ supplier=e.target.value; renderEstimate(); renderRecolour(); queueSave(); };

  // ---------- import artwork ----------
  const palRgb = () => palette.map(c=>hexToRgb(c.hex));
  function nearestIdx(r,g,b,rgbs){ let best=0,bd=Infinity; for(let i=0;i<rgbs.length;i++){ const [pr,pg,pb]=rgbs[i]; const d=(pr-r)**2+(pg-g)**2+(pb-b)**2; if(d<bd){bd=d;best=i;} } return best; }

  function importImage(img){
    const newN=+$('#importRes').value, maxColors=Math.max(1,Math.min(40,+$('#importColors').value||4)), lineArt=$('#importInvert').checked;
    pushHistory(); N=newN; updateLabels();
    const off=document.createElement('canvas'); off.width=off.height=N; const o=off.getContext('2d');
    const tc=document.createElement('canvas'); tc.width=tc.height=16; const t=tc.getContext('2d');
    t.drawImage(img,0,0,16,16); const cd=t.getImageData(0,0,16,16).data;
    let br=0,bg=0,bb=0; for(const [cx,cy] of [[0,0],[15,0],[0,15],[15,15]]){ const k=(cy*16+cx)*4; br+=cd[k];bg+=cd[k+1];bb+=cd[k+2]; } br/=4;bg/=4;bb/=4;
    o.fillStyle=`rgb(${br|0},${bg|0},${bb|0})`; o.fillRect(0,0,N,N);
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height, scale=Math.min(N/iw,N/ih), dw=iw*scale, dh=ih*scale;
    o.imageSmoothingEnabled=true; o.drawImage(img,(N-dw)/2,(N-dh)/2,dw,dh);
    const data=o.getImageData(0,0,N,N).data, rgbs=palRgb();
    const tmp=blankGrid(N), counts={};
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      const k=(y*N+x)*4; let r=data[k],g=data[k+1],b=data[k+2], idx;
      if(lineArt){ const lum=0.299*r+0.587*g+0.114*b; idx = lum<128 ? nearestIdx(r,g,b,rgbs) : nearestIdx(br,bg,bb,rgbs); }
      else idx=nearestIdx(r,g,b,rgbs);
      tmp[y][x]=idx; counts[idx]=(counts[idx]||0)+1;
    }
    const kept=Object.keys(counts).map(Number).sort((a,b)=>counts[b]-counts[a]).slice(0,maxColors), keptRgb=kept.map(i=>rgbs[i]), remap={};
    for(const i of Object.keys(counts).map(Number)){
      if(kept.includes(i)){ remap[i]=i; continue; }
      const [r,g,b]=rgbs[i]; let best=kept[0],bd=Infinity;
      kept.forEach((ki,ji)=>{ const [pr,pg,pb]=keptRgb[ji]; const d=(pr-r)**2+(pg-g)**2+(pb-b)**2; if(d<bd){bd=d;best=ki;} });
      remap[i]=best;
    }
    for(let y=0;y<N;y++)for(let x=0;x<N;x++) tmp[y][x]=remap[tmp[y][x]];
    // dominant colour = the rug's background; capture a fixed mask so patterns never touch the symbol
    { const cc=new Array(palette.length).fill(0); for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=tmp[y][x]; if(v>=0)cc[v]++;} groundIdx=cc.indexOf(Math.max(...cc));
      groundMask=new Uint8Array(N*N); for(let y=0;y<N;y++)for(let x=0;x<N;x++) groundMask[y*N+x]= tmp[y][x]===groundIdx?1:0;
      patternB=null; bgColors=new Set([groundIdx]);
      const usedNow=cc.map((n,i)=>i).filter(i=>cc[i]>0);
      chipOrder=[ ...usedNow.filter(i=>i!==groundIdx), groundIdx ];   // symbols first, background last
      if($('#patType')) $('#patType').value='plain'; }
    grid=tmp; afterEdit();
  }

  $('#importBtn').onclick = ()=> $('#imgInput').click();
  $('#importLogo').onclick = ()=>{
    $('#importInvert').checked=true;
    fetch('logo.png').then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
      const img=new Image(); img.onload=()=>importImage(img); img.src=URL.createObjectURL(b);
    }).catch(()=>alert('logo.png not found — serve the app via the localhost URL.'));
  };
  $('#imgInput').onchange = e => {
    const f=e.target.files[0]; if(!f) return;
    const img=new Image(); img.onload=()=>{ importImage(img); URL.revokeObjectURL(img.src); };
    img.onerror=()=>alert('Could not load that image.'); img.src=URL.createObjectURL(f); e.target.value='';
  };

  // ---------- scene + transform ----------
  $('#resetCorners').onclick = ()=>{ corners=JSON.parse(JSON.stringify(BG[bgKey].corners)); resetTransformControls(); placeStudio(); };

  function centroid(){ let x=0,y=0; corners.forEach(c=>{x+=c.x;y+=c.y;}); return {x:x/4,y:y/4}; }
  function syncXY(){ const c=centroid(), X=$('#trX'), Y=$('#trY'); if(document.activeElement!==X) X.value=Math.round(c.x*100); if(document.activeElement!==Y) Y.value=Math.round(c.y*100); }
  let lastScale=1;
  function resetTransformControls(){ lastScale=1; $('#trScale').value=100; $('#trScaleV').textContent='100%'; }
  $('#trScale').oninput = e=>{ const v=(+e.target.value)/100, f=v/lastScale; lastScale=v; $('#trScaleV').textContent=Math.round(v*100)+'%'; const c=centroid(); corners.forEach(p=>{ p.x=c.x+(p.x-c.x)*f; p.y=c.y+(p.y-c.y)*f; }); placeStudio(); };
  function moveCentroidTo(nx,ny){ const c=centroid(),dx=nx-c.x,dy=ny-c.y; corners.forEach(p=>{p.x+=dx;p.y+=dy;}); placeStudio(); }
  $('#trX').oninput = e=>{ moveCentroidTo((+e.target.value)/100, centroid().y); };
  $('#trY').oninput = e=>{ moveCentroidTo(centroid().x, (+e.target.value)/100); };

  const showXform=()=>{ $('#studioWrap').classList.add('dragging'); $('#transformPop').classList.add('show'); };
  const endDrag=()=> $('#studioWrap').classList.remove('dragging');
  (function bindMove(){ let md=null, rect=null;
    studioCanvas.addEventListener('pointerdown', e=>{ e.preventDefault(); md={x:e.clientX,y:e.clientY}; rect=$('#studioWrap').getBoundingClientRect(); showXform(); try{studioCanvas.setPointerCapture(e.pointerId);}catch(_){ } });
    document.addEventListener('pointermove', e=>{ if(!md) return; const dx=(e.clientX-md.x)/rect.width, dy=(e.clientY-md.y)/rect.height; corners.forEach(p=>{p.x+=dx;p.y+=dy;}); md={x:e.clientX,y:e.clientY}; placeStudio(); });
    document.addEventListener('pointerup', ()=>{ if(md){ md=null; endDrag(); } });
  })();
  (function bindHandles(){ let drag=null, rect=null;
    document.querySelectorAll('.handle').forEach(h=>{ h.addEventListener('pointerdown', e=>{ e.preventDefault(); drag=+h.dataset.corner; rect=$('#studioWrap').getBoundingClientRect(); showXform(); try{h.setPointerCapture(e.pointerId);}catch(_){ } }); });
    document.addEventListener('pointermove', e=>{ if(drag===null) return; corners[drag]={ x:Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width)), y:Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height)) }; placeStudio(); });
    document.addEventListener('pointerup', ()=>{ if(drag!==null){ drag=null; endDrag(); } });
  })();
  // dismiss the transform popover when clicking away from the rug / popover
  document.addEventListener('pointerdown', e=>{
    const p=$('#transformPop'); if(!p.classList.contains('show')) return;
    if($('#studioWrap').contains(e.target) || p.contains(e.target)) return;
    p.classList.remove('show');
  }, true);

  // ---------- splitter (resize the two views) ----------
  let split=56;
  function applySplit(){ $('#views').style.setProperty('--split', split+'%'); }
  (function bindSplitter(){
    const sp=$('#splitter'); let drag=false, vRect=null;
    sp.addEventListener('pointerdown', e=>{ e.preventDefault(); drag=true; vRect=$('#views').getBoundingClientRect(); sp.classList.add('drag'); try{sp.setPointerCapture(e.pointerId);}catch(_){ } });
    document.addEventListener('pointermove', e=>{ if(!drag) return; split=Math.max(20,Math.min(85,(e.clientX-vRect.left)/vRect.width*100)); applySplit(); fitMedia(); });
    document.addEventListener('pointerup', ()=>{ if(drag){ drag=false; sp.classList.remove('drag'); fitMedia(); } });
  })();
  window.addEventListener('resize', fitMedia);

  // ---------- export / save ----------
  function downloadCanvas(c,name){ c.toBlob(b=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); URL.revokeObjectURL(a.href); }); }
  $('#exportTufted').onclick = ()=>{ const c=document.createElement('canvas'); c.width=c.height=1200; drawTufted(c.getContext('2d'),1200); downloadCanvas(c,'rug-tufted.png'); };
  $('#exportDesign').onclick = ()=>{ const W=1600,c=document.createElement('canvas'); c.width=c.height=W; fillGridCells(c.getContext('2d'), W, '#ffffff'); downloadCanvas(c,'rug-design.png'); };
  $('#saveJson').onclick = ()=>{ const data={version:2,rug_m:RUG_M,N,palette,grid}; const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'})); a.download='rug-project.json'; a.click(); URL.revokeObjectURL(a.href); };
  $('#loadJson').onclick = ()=> $('#fileInput').click();
  $('#fileInput').onchange = e => { const f=e.target.files[0]; if(!f) return; const rd=new FileReader(); rd.onload=()=>{ try{ const d=JSON.parse(rd.result); if(d.palette&&d.grid){ palette=d.palette; N=d.N||d.grid.length; grid=d.grid; groundMask=null; chipOrder=[]; updateLabels(); afterEdit(); } }catch(err){ alert('Could not read project file.'); } }; rd.readAsText(f); e.target.value=''; };

  // ---------- compare curtain (drag to reveal artwork vs tufted) ----------
  let curtainX = 50, curtainDrag = false;
  function applyCurtain(){ $('#compare').style.setProperty('--cx', curtainX+'%'); }
  (function bindCompare(){
    const cmp=$('#compare');
    function moveCurtain(e){ const r=cmp.getBoundingClientRect(); curtainX=Math.max(2,Math.min(98,(e.clientX-r.left)/r.width*100)); applyCurtain(); }
    cmp.addEventListener('pointerdown', e=>{ e.preventDefault(); curtainDrag=true; try{ cmp.setPointerCapture(e.pointerId); }catch(_){ } moveCurtain(e); });
    cmp.addEventListener('pointermove', e=>{ if(curtainDrag) moveCurtain(e); });
    cmp.addEventListener('pointerup', ()=> curtainDrag=false);
  })();

  // ---------- keyboard ----------
  window.addEventListener('keydown', e=>{ if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT') return; if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){ e.preventDefault(); e.shiftKey?redo():undo(); } });

  // ---------- persistence (localStorage) ----------
  const LS_KEY='klattermusen.v1';
  let saveTimer=null;
  function saveState(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify({ N, grid, palette, groundIdx, patternB, bgColors:[...bgColors], chipOrder, corners, recolorTarget, supplier, patType:$('#patType').value, patSize:$('#patSize').value })); }catch(_){ }
  }
  function queueSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveState, 400); }
  function loadState(){
    try{
      const raw=localStorage.getItem(LS_KEY); if(!raw) return false;
      const d=JSON.parse(raw); if(!d.grid) return false;
      N=d.N; grid=d.grid; if(d.palette) palette=d.palette;
      groundIdx=d.groundIdx; patternB=d.patternB; chipOrder=d.chipOrder||[]; recolorTarget=d.recolorTarget;
      bgColors=new Set(d.bgColors || (d.groundIdx!=null?[d.groundIdx]:[]));
      if(d.corners) corners=d.corners;
      if(d.supplier){ supplier=d.supplier; $('#supplier').value=supplier; }
      if(d.patType){ $('#patType').value=d.patType; } if(d.patSize) $('#patSize').value=d.patSize;
      groundMask=new Uint8Array(N*N);                          // background region = cells holding a background colour
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ groundMask[y*N+x]= bgColors.has(grid[y][x])?1:0; }
      updateLabels(); afterEdit(); fitMedia();
      return true;
    }catch(_){ return false; }
  }
  $('#clearAll').onclick = ()=>{ if(confirm('Reset to the Klättermusens logo and clear your saved design?')){ try{ localStorage.removeItem(LS_KEY); }catch(_){ } location.reload(); } };

  // ---------- init ----------
  applySplit(); applyCurtain();
  grid = blankGrid(N); updateLabels();
  if (!loadState()){                                           // restore saved work, else auto-load the logo
    afterEdit(); fitMedia();
    fetch('logo.png').then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
      $('#importInvert').checked=true; const img=new Image();
      img.onload=()=>{ importImage(img); undoStack.length=0; redoStack.length=0; renderRecolour(); };
      img.src=URL.createObjectURL(b);
    }).catch(()=>{ /* file:// — open via localhost to auto-load the logo */ });
  }
})();
