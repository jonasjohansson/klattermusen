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
    {hex:'#d44d8a', name:'Deep Pink',      u:'deep-pink',      s:1},
    {hex:'#c0357f', name:'Fuchsia Pink',   u:'fuchsia-pink',   s:1},
    {hex:'#ecc0d2', name:'Light Pink',     u:'light-pink',     s:1},
  ];
  // Suppliers (stock checked 2026-06-09). The design palette is shared; the toggle
  // reframes pricing/links/stock for the BOM. Hitex/Tufting Shop links go to their
  // catalogue (no per-colour slugs); their colour match is approximate.
  // All prices in SEK. EUR suppliers converted at ~11.3 SEK/€ (Tufting Europe €17.50/cone ≈ 198 kr).
  // mat = rough material costs (cloth, glue, backing) for a 2×2m rug.
  const SUPPLIERS = {
    te:          { label:'Tufting Europe', cur:'kr', unit:'cone', coneG:500, price:198, link:c=>'https://tuftingeurope.com/product/'+c.u+'-tufting-yarn-500g-wool/', stock:c=>!!c.s, mat:{cloth:509, glue:226, backing:203}, ship:0 },
    tuftingshop: { label:'Tufting Shop',   cur:'kr', unit:'cone', coneG:500, price:202, link:()=> 'https://tuftingshop.com/sv/collections/yarn',                       stock:()=> true, mat:{cloth:509, glue:226, backing:203}, ship:0 },
    hitex:       { label:'Hitex',          cur:'kr', unit:'kg',              price:594, link:()=> 'https://hitex.se/products/tufting-yarn/',                            stock:()=> true, mat:{cloth:450, glue:220, backing:190}, ship:1000 },
  };
  // Hitex tufting-yarn swatches (item 932007-<code>), avg colour sampled from the
  // catalogue cut-edge thumbnails; NCS where published. Matched to the palette on the
  // fly so uploaded-image colours get a code too. Hitex bills per kg with a volume
  // discount: 5–9 kg −10%, 10–14 kg −12%, 15 kg+ −15% (1 kg min/colour).
  const HITEX_YARN = [
    ['A1','#161716','7030-G10Y'], ['A2','#24220f','5050-G60Y'], ['A3','#31281d','7020-G90Y'], ['A4','#3b3628','6010-Y'], ['A5','#4e432c','5020-Y'], ['A6','#736955','3010-Y'],
    ['A7','#8b701e','3040-Y'], ['A8','#a9976f','1010-Y10R'], ['A9','#ac9367','1010-G90Y'], ['B1','#0b161c','6030-B30G'], ['B2','#1a232c','6020-B30G'], ['B3','#2d3d2a','5530-G30Y'],
    ['B4','#314a26','4055-G40Y'], ['B5','#5e662e','3040-G60Y'], ['B6','#35635f','3030-B90G'], ['B7','#768685','2005-B90G'], ['B8','#8eaca5','0015-B90G'], ['B9','#b6b8bc','1005-B50G'],
    ['C1','#0d0d16','7025-R80B'], ['C2','#0c101a','7020-B10G'], ['C3','#1e2637','7015-R90B'], ['C4','#04284c','3070-B10G'], ['C5','#046370','1080-B40G'], ['C6','#496c7f','2010-B50G'],
    ['C7','#77848d','2005-B20G'], ['C8','#858585','2502-G'], ['C9','#b6ab9c','0702-Y'], ['D1','#0c0d14','6530-R80B'], ['D2','#0d1230','5030-R90B'], ['D3','#051a48','4550-R90B'],
    ['D4','#054574','3050-B'], ['D5','#053e85','1070-B'], ['D6','#1f455f','4525-B10G'], ['D7','#4d6c85','3020-B10G'], ['D8','#959ea6','2010-B'], ['D9','#c1af9f','0702-R'],
    ['E1','#100e0f','8020-R30B'], ['E2','#0f0d10','8020-R50B'], ['E3','#1d1421','6020-R30B'], ['E4','#1e0b2d','1060-R60B'], ['E5','#2e2133','5020-R50B'], ['E6','#413f45','4502-B'],
    ['E7','#7c7a7c','2502-B'], ['E8','#868588','1005-R80B'], ['E9','#bdaea4','0402-R'], ['F1','#170d0e','8010-R10B'], ['F2','#390d0f','4050-R'], ['F3','#280c11','5040-R10B'],
    ['F4','#341922','4035-R30B'], ['F5','#5b2a3d','4030-R30B'], ['F6','#634e47','3015-R10B'], ['F7','#806247','4015-Y30R'], ['F8','#a18777','1510-Y90R'], ['F9','#e7d5b6','0005-Y70R'],
    ['G1','#1a0c0c','5040-R'], ['G2','#480c10','3070-Y90R'], ['G3','#650412','1090-R'], ['G4','#510613','2090-R15B'], ['G5','#9a4047','1530-R'], ['G6','#845137','2020-Y60R'],
    ['G7','#c19567','2025-Y30R'], ['G8','#c7ac84','0010-Y30R'], ['G9','#e3c69c','0010-Y20R'], ['H1','#130f0d','9015-Y80R'], ['H2','#3f140d','6040-Y50R'], ['H3','#662211','3040-Y70R'],
    ['H4','#7b2f0e','2060-Y60R'], ['H5','#bf4f07','0095-Y30R'], ['H6','#7c5733','2020-Y30R'], ['H7','#a48a6f','2010-Y40R'], ['H8','#bca584','1005-G80Y'], ['H9','#e4d09f','0005-Y20R'],
    ['I1','#2b160f','7030-Y40R'], ['I2','#412212','5050-Y20R'], ['I3','#602e14','4060-Y20R'], ['I4','#895713','2070-Y'], ['I5','#edc211','0070-Y'], ['I6','#b18134','1020-Y30R'],
    ['I7','#e5b033'], ['I8','#e0d0a9'], ['I9','#e6dcbf']
  ];
  function rgb2lab([r,g,b]){
    const f=v=>{ v/=255; v=v<=0.04045? v/12.92 : ((v+0.055)/1.055)**2.4; return v; };
    r=f(r); g=f(g); b=f(b);
    let x=(r*0.4124+g*0.3576+b*0.1805)/0.95047, y=r*0.2126+g*0.7152+b*0.0722, z=(r*0.0193+g*0.1192+b*0.9505)/1.08883;
    const t=v=> v>0.008856? Math.cbrt(v) : 7.787*v+16/116;
    return [116*t(y)-16, 500*(t(x)-t(y)), 200*(t(y)-t(z))];
  }
  const HITEX_LAB = HITEX_YARN.map(y=>({ code:y[0], ncs:y[2]||null, lab:rgb2lab(hexToRgb(y[1])) }));
  // nearest Hitex yarn to an arbitrary hex, in Lab — returns {code, ncs, dE}.
  // dE is the ΔE distance; > HITEX_APPROX means Hitex has no close colour and the
  // exact yarn is better sourced from Tufting Europe/Shop, where the palette comes from.
  const HITEX_APPROX = 12;
  function hitexMatch(hex){
    const lab=rgb2lab(hexToRgb(hex)); let best=HITEX_LAB[0], bd=Infinity;
    for(const y of HITEX_LAB){ const d=(lab[0]-y.lab[0])**2+(lab[1]-y.lab[1])**2+(lab[2]-y.lab[2])**2; if(d<bd){bd=d; best=y;} }
    return { code:best.code, ncs:best.ncs, dE:Math.sqrt(bd) };
  }
  // Hitex volume discount as a fraction of the yarn subtotal, by total billed kg
  function hitexDiscount(kg){ return kg>=15? 0.15 : kg>=10? 0.12 : kg>=5? 0.10 : 0; }
  let supplier = 'hitex';
  let pileMM = 14;   // cut-pile height in mm; drives the yarn face weight
  const inStock = c => SUPPLIERS[supplier].stock(c);
  let recolorTarget = null, recolorSymbol = false;
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
  function snapshot(){ return JSON.stringify(serialize()); }
  function pushHistory(){ undoStack.push(snapshot()); if (undoStack.length>80) undoStack.shift(); redoStack.length=0; }
  function restore(s){ const d=JSON.parse(s); applyState(d, true); updateLabels(); afterEdit(); }
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
    rg.addColorStop(0,'rgba(255,255,255,0)'); rg.addColorStop(1,'rgba(0,0,0,.03)');
    ctx.fillStyle=rg; ctx.fillRect(0,0,w,w);
    ctx.strokeStyle='rgba(0,0,0,.07)'; ctx.lineWidth=Math.max(1,s*0.08);
    ctx.strokeRect(ctx.lineWidth/2, ctx.lineWidth/2, w-ctx.lineWidth, w-ctx.lineWidth);
  }

  // ---------- scenes + perspective warp ----------
  const BG = {
    room:   { src:'room.jpg',   blend:'normal',
              // upright square on the white wall, behind the table (X50 / Y43); square in the 1586×992 frame
              corners:[ {x:0.340,y:0.174}, {x:0.660,y:0.174}, {x:0.660,y:0.686}, {x:0.340,y:0.686} ] },
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
  function positionHandles(){}

  // ---------- fit the two media boxes into their views ----------
  function fitMedia(){
    const rv=$('#paneRoom'), wrap=$('#studioWrap'), ar=1586/992;   // matches the studio backdrop
    let vw=rv.clientWidth, vh=rv.clientHeight;                 // room = COVER: fill the pane, crop overflow
    if (vw>0 && vh>0){ let w=Math.max(vw, vh*ar); wrap.style.width=w+'px'; wrap.style.height=(w/ar)+'px'; }
    const cv=$('#paneCompare'), cmp=$('#compare');             // compare = CONTAIN square, edge to edge
    let cw=Math.min(cv.clientWidth, cv.clientHeight);
    if (cw>0){ cmp.style.width=cw+'px'; cmp.style.height=cw+'px'; }
    placeStudio();
  }

  // ---------- estimate ----------
  const PILE_KG_PER_MM = 0.20;   // wool cut-pile face weight ≈ 0.20 kg/m² per mm of pile (hand-tuft density)
  function renderEstimate(){
    const sup=SUPPLIERS[supplier], price=sup.price, m=sup.mat;
    const DENSITY = pileMM * PILE_KG_PER_MM;   // kg/m² face weight, derived from pile height
    const counts=new Array(palette.length).fill(0); let filled=0;
    for (let y=0;y<N;y++) for (let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0){counts[v]++; filled++;} }
    const cellArea=(RUG_M/N)*(RUG_M/N);
    // merge same-yarn slots (identical hex) into one order line; prefer an in-stock representative
    const groups=new Map();   // hex -> { rep:paletteEntry, cells:int }
    palette.forEach((c,i)=>{ if(!counts[i]) return;
      const g=groups.get(c.hex);
      if(!g) groups.set(c.hex, {rep:c, cells:counts[i]});
      else { g.cells+=counts[i]; if(!sup.stock(g.rep) && sup.stock(c)) g.rep=c; }
    });
    let rows='', totalKg=0, totalCost=0, totalCones=0, billedKg=0, anyOOS=false;
    groups.forEach(({rep,cells})=>{
      const kg=cells*cellArea*DENSITY; totalKg+=kg;
      let detail, cost;
      if (sup.unit==='cone'){ const cones=Math.ceil(kg*1000/sup.coneG); totalCones+=cones; cost=cones*price; detail=`${cones} cone${cones>1?'s':''}`; }
      else { const billKg=Math.max(1,kg); billedKg+=billKg; cost=billKg*price; detail=`${billKg.toFixed(1)} kg`; }   // Hitex: 1kg min/colour
      totalCost+=cost;
      const ok=sup.stock(rep); if(!ok) anyOOS=true;
      // Hitex: tag each colour with its nearest catalogue item number (932007-<code>),
      // but only when it's a genuinely close match. If Hitex has no close colour we show
      // no code at all — a misleading nearest-neighbour reads like an answer when it isn't —
      // and just link to the exact yarn at Tufting Europe, the range the palette is drawn
      // from. The nearest Hitex code stays in the link's tooltip for reference.
      const m = supplier==='hitex' ? hitexMatch(rep.hex) : null;
      const approx = m && m.dE > HITEX_APPROX;
      let code = '';
      if (m && !approx){
        code = ` <span class="ycode"${m.ncs?` title="NCS ${m.ncs}"`:''}>932007-${m.code}</span>`;
      } else if (m){
        const teTitle = `Not at Hitex — exact ${rep.name} yarn at Tufting Europe (nearest Hitex 932007-${m.code})`;
        code = ` <a class="ycode src" href="${SUPPLIERS.te.link(rep)}" target="_blank" rel="noopener" title="${teTitle}">TE&nbsp;↗</a>`;
      }
      rows+=`<tr><td class="c"><span class="dot" style="background:${rep.hex}"></span></td>`+
        `<td><a href="${sup.link(rep)}" target="_blank" rel="noopener">${rep.name}</a>${code}${ok?'':' <span class="oos">sold out</span>'}</td>`+
        `<td class="qty">${detail}</td><td class="n">${sup.cur}${cost.toFixed(0)}</td></tr>`;
    });
    // Hitex volume discount on the yarn subtotal (shown as its own line)
    let discount=0;
    if (supplier==='hitex'){
      const rate=hitexDiscount(billedKg);
      if (rate>0){
        discount=totalCost*rate;
        rows+=`<tr class="mat"><td class="c"></td><td>Volume discount · ${billedKg.toFixed(1)} kg</td>`+
          `<td class="qty">−${(rate*100).toFixed(0)}%</td><td class="n">−${sup.cur}${discount.toFixed(0)}</td></tr>`;
      }
    }
    // Tufting Europe sourced items (one cloth + one backing + the gun), converted EUR→SEK
    const EUR=11.4, teCloth='https://tuftingeurope.com/product/primary-tufting-cloth-300x300cm/', teBack='https://tuftingeurope.com/product/non-slippery-secondary-backing-cloth-200x200cm/', teGun='https://tuftingeurope.com/product/ak-v-tufting-machine/';
    const cloth=Math.round(45*EUR), backing=Math.round(18*EUR), gun=Math.round(181.82*EUR), glue=m.glue, build=500, ship=sup.ship||0;
    const matSum=cloth+backing+glue+build+gun+ship;
    if (filled){
      [['Tufting cloth · TE 3×3 m',cloth,teCloth],['Backing cloth · TE 2×2 m',backing,teBack],['Glue',glue,null],['Construction materials',build,null],['AK-V tufting gun · one-time',gun,teGun],['Shipping',ship,null]].forEach(([nm,cost,link])=>{
        const label = link ? `<a href="${link}" target="_blank" rel="noopener">${nm}</a>` : nm;
        rows+=`<tr class="mat"><td class="c"></td><td>${label}</td><td class="qty"></td><td class="n">${sup.cur}${cost.toFixed(0)}</td></tr>`;
      });
    }
    const grand=totalCost+matSum-discount;
    const total = filled
      ? `<strong>${totalKg.toFixed(1)} kg</strong>${totalCones?' · '+totalCones+' cones':''} · <strong>${sup.cur}${grand.toFixed(0)}</strong>${anyOOS?' · <span class="oos">some sold out</span>':''}`
      : 'Upload artwork to see the yarn estimate.';
    $('#bom').innerHTML = filled
      ? `<table class="est-table"><tbody>${rows}</tbody></table><div class="est-total">${total}</div>`
      : `<span class="lbl">${total}</span>`;
    $('#bomSummary').textContent = filled ? (sup.cur+grand.toFixed(0)) : 'BOM';
  }

  // ---------- recolour (used colours + full palette tray in the dock) ----------
  function cloneSlot(srcIdx){ palette.push({...palette[srcIdx]}); return palette.length-1; }
  function remapColour(from, to, symbolRegion){
    if(from===to) return;
    pushHistory();
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    if(counts[to]>0) to=cloneSlot(to);   // target yarn already in use elsewhere -> fresh slot, keep distinct
    const region = groundMask!=null;   // only touch cells in the clicked chip's region (symbol cells never affect the background)
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){
      if(grid[y][x]!==from) continue;
      if(region){ const inBg=!!groundMask[y*N+x]; if(symbolRegion ? inBg : !inBg) continue; }
      grid[y][x]=to;
    }
    // keep pattern state in sync so re-patterning doesn't stack old colours
    if(region){ bgColors=new Set(); for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(groundMask[y*N+x]) bgColors.add(grid[y][x]); } }
    else if(bgColors.has(from)){ bgColors.delete(from); bgColors.add(to); }
    if(!symbolRegion){ if(groundIdx===from) groundIdx=to; if(patternB===from) patternB=to; }
    const oi=chipOrder.indexOf(from); if(oi>=0){ chipOrder[oi]=to; chipOrder=chipOrder.filter((v,idx)=> idx===oi || v!==to); }  // keep the same slot
    recolorTarget=to; recolorSymbol=!!symbolRegion; afterEdit();
  }

  // randomise every colour in use to a fresh (in-stock) yarn; the symbol gets a contrasting colour so it stands out
  const lumOf=idx=>{ const [r,g,b]=hexToRgb(palette[idx].hex); return 0.299*r+0.587*g+0.114*b; };
  function randomizeColors(){
    const counts=new Array(palette.length).fill(0); for(let y=0;y<N;y++)for(let x=0;x<N;x++){const v=grid[y][x]; if(v>=0)counts[v]++;}
    const used=palette.map((c,i)=>i).filter(i=>counts[i]>0); if(!used.length) return;
    const bg=used.filter(i=>bgColors.has(i)), sym=used.filter(i=>!bgColors.has(i));
    let pool=palette.map((c,i)=>i).filter(i=>inStock(palette[i])); if(pool.length<used.length) pool=palette.map((c,i)=>i);
    const sh=[...pool]; for(let i=sh.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [sh[i],sh[j]]=[sh[j],sh[i]]; }
    pushHistory();
    const map={}, taken=new Set();
    let pi=0; bg.forEach(i=>{ while(taken.has(sh[pi%sh.length])) pi++; map[i]=sh[pi%sh.length]; taken.add(map[i]); pi++; });   // background: random distinct
    const bgVals=bg.map(i=>lumOf(map[i])), meanBg=bgVals.length? bgVals.reduce((a,b)=>a+b,0)/bgVals.length : 128;
    // symbol: pick among the most contrasting in-stock yarns (with a little randomness)
    const cand=pool.filter(i=>!taken.has(i)).sort((a,b)=>Math.abs(lumOf(b)-meanBg)-Math.abs(lumOf(a)-meanBg));
    sym.forEach(i=>{ const top=cand.filter(c=>!taken.has(c)).slice(0,5); const pick=top.length?top[Math.floor(Math.random()*top.length)]:(cand[0]??sh[0]); map[i]=pick; taken.add(pick); });
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0 && map[v]!=null) grid[y][x]=map[v]; }
    const mv=i=> (i!=null && map[i]!=null)?map[i]:i;
    groundIdx=mv(groundIdx); patternB=mv(patternB); recolorTarget=mv(recolorTarget);
    bgColors=new Set([...bgColors].map(mv)); chipOrder=[...new Set(chipOrder.map(mv))];   // de-dupe so a colour never shows twice
    afterEdit();
  }

  // ---------- background pattern (mask-based: only the background cells, never the symbol) ----------
  function defaultPatternB(){
    const sym=new Set(); if(groundMask) for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!groundMask[y*N+x]){ const v=grid[y][x]; if(v>=0) sym.add(v); } }
    const pref=groundIdx===2?8:2;
    if(!sym.has(pref)) return pref;
    let cand=palette.map((c,i)=>i).filter(i=>i!==groundIdx && !sym.has(i) && inStock(palette[i]));
    if(!cand.length) cand=palette.map((c,i)=>i).filter(i=>i!==groundIdx && !sym.has(i));
    return cand.length ? cand[0] : pref;
  }   // a contrasting yarn that avoids symbol colours; recolour it via its chip like any colour
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
    const iw=img.naturalWidth||img.width, ih=img.naturalHeight||img.height;
    // flatten for tufting: cover-fit into a SMALL canvas (kills texture/gradients), then smooth-upscale to N
    const sm=Math.max(48, Math.min(120, Math.round(N/4)));
    const tiny=document.createElement('canvas'); tiny.width=tiny.height=sm; const tg=tiny.getContext('2d'); tg.imageSmoothingEnabled=true;
    const ts=Math.max(sm/iw, sm/ih), tw=iw*ts, th=ih*ts; tg.drawImage(img,(sm-tw)/2,(sm-th)/2,tw,th);
    const off=document.createElement('canvas'); off.width=off.height=N; const o=off.getContext('2d');
    o.imageSmoothingEnabled=true; o.drawImage(tiny,0,0,N,N);
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
    // despeckle: majority-filter passes so the background tufts as clean contiguous areas (no lone tufts)
    for(let pass=0; pass<2; pass++){
      const copy=grid.map(r=>r.slice());
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){
        if(!groundMask[y*N+x]) continue;
        const t={};
        for(const [dx,dy] of [[0,0],[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){ const nx=x+dx,ny=y+dy; if(nx<0||ny<0||nx>=N||ny>=N||!groundMask[ny*N+nx]) continue; const v=copy[ny][nx]; t[v]=(t[v]||0)+1; }
        let best=copy[y][x],bc=0; for(const kk in t){ if(t[kk]>bc){bc=t[kk];best=+kk;} }
        grid[y][x]=best;
      }
    }
    bgColors=new Set(); for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(groundMask[y*N+x]) bgColors.add(grid[y][x]); }
    bgColors.forEach(i=>{ if(!chipOrder.includes(i)) chipOrder.push(i); });
    if($('#patType')) $('#patType').value='image';
    afterEdit();
  }
  $('#bgPatBtn').onclick = ()=> $('#bgPatInput').click();
  $('#bgPatInput').onchange = e=>{ const f=e.target.files[0]; if(!f) return; const img=new Image(); img.onload=()=>applyBgImage(img); img.onerror=()=>alert('Could not load image.'); img.src=URL.createObjectURL(f); e.target.value=''; };
  // built-in pattern library
  const PATTERNS=['patterns/floral-1.jpg','patterns/floral-2.jpg','patterns/botanical-1.jpg'];
  function buildPatLib(){ const wrap=$('#patLib'); if(!wrap) return; wrap.innerHTML=''; PATTERNS.forEach(src=>{
    const b=document.createElement('button'); b.className='pat-thumb'; b.style.backgroundImage='url('+src+')'; b.title=src.split('/').pop().replace(/\.\w+$/,'');
    b.onclick=()=>{ const img=new Image(); img.onload=()=>applyBgImage(img); img.onerror=()=>alert('Could not load pattern.'); img.src=src; };
    wrap.appendChild(b);
  }); }
  function renderRecolour(){
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    const used=palette.map((c,i)=>i).filter(i=>counts[i]>0);
    const rc=$('#rugColors'), tray=$('#paletteTray'); rc.innerHTML=''; tray.innerHTML='';
    if(!used.length){ rc.innerHTML='<span class="lbl">Upload artwork to begin</span>'; return; }
    if(recolorTarget==null || recolorTarget>=palette.length){ recolorTarget=used[0]; recolorSymbol=!bgColors.has(recolorTarget); }
    const ordered=[]; chipOrder.forEach(i=>{ if(counts[i]>0 && !ordered.includes(i)) ordered.push(i); }); used.forEach(i=>{ if(!ordered.includes(i)) ordered.push(i); });   // stable slots, de-duped; new colours appended

    const rnd=document.createElement('button'); rnd.className='rc-tool'; rnd.textContent='🎲'; rnd.title='Randomise the colours'; rnd.onclick=randomizeColors; rc.appendChild(rnd);
    const l=document.createElement('span'); l.className='lbl'; l.textContent='In rug'; rc.appendChild(l);
    ordered.forEach(i=>{
      const chip=document.createElement('div'); chip.className='rc-chip'+(i===recolorTarget?' active':'');
      const sw=document.createElement('span'); sw.className='sw'+(inStock(palette[i])?'':' oos'); sw.style.background=palette[i].hex;
      const nm=document.createElement('span'); nm.className='nm'; nm.textContent=palette[i].name+(inStock(palette[i])?'':' (sold out)');
      const role=document.createElement('span'); role.className='role'; role.textContent= bgColors.has(i) ? '' : 'symbol';
      chip.appendChild(sw); chip.appendChild(nm); chip.appendChild(role);
      chip.onclick=()=>{ recolorTarget=i; recolorSymbol=!bgColors.has(i); renderRecolour(); };
      rc.appendChild(chip);
    });

    palette.forEach((c,j)=>{
      const s=document.createElement('button'); s.className='tray-sw'+(inStock(c)?'':' oos'); s.style.background=c.hex; s.title=c.name+(inStock(c)?'':' — sold out');
      s.onclick=()=> remapColour(recolorTarget, j, recolorSymbol);
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
  $('#pileMM').onchange = e=>{ pileMM=Math.max(6,Math.min(40, parseInt(e.target.value)||25)); e.target.value=pileMM; renderEstimate(); queueSave(); };

  // ---------- import artwork ----------
  const palRgb = () => palette.map(c=>hexToRgb(c.hex));
  function nearestIdx(r,g,b,rgbs){ let best=0,bd=Infinity; for(let i=0;i<rgbs.length;i++){ const [pr,pg,pb]=rgbs[i]; const d=(pr-r)**2+(pg-g)**2+(pb-b)**2; if(d<bd){bd=d;best=i;} } return best; }

  function importImage(img){
    const newN=Math.max(8,Math.min(500,+$('#importRes').value||0)), maxColors=Math.max(1,Math.min(40,+$('#importColors').value||4)), lineArt=$('#importInvert').checked;
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
    fetch('logo.svg').then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
      const img=new Image();
      img.onload=()=>{ importImage(img); URL.revokeObjectURL(img.src); };
      img.onerror=()=>{ URL.revokeObjectURL(img.src); alert('Could not load the logo.'); };
      img.src=URL.createObjectURL(b);
    }).catch(()=>alert('logo.svg not found — serve the app via the localhost URL.'));
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
  function downloadCanvas(c,name){ c.toBlob(b=>{ if(!b){ alert('Could not export the image.'); return; } const a=document.createElement('a'); a.href=URL.createObjectURL(b); a.download=name; a.click(); URL.revokeObjectURL(a.href); }); }

  // ---------- room snapshot: room photo + perspective-warped rug + colour legend ----------
  const SNAP_FONT='ui-monospace, SFMono-Regular, Menlo, monospace';
  function captionText(){ const d=new Date(); const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    return `Klättermusens Verkstad · ${RUG_M.toFixed(1)}×${RUG_M.toFixed(1)} m · ${pileMM} mm cut pile · ${iso}`; }
  function legendLayout(cols, availW, scale){
    const pad=24*scale, sw=26*scale, lh=Math.max(sw+10*scale, 34*scale), titleH=44*scale;
    const colW=Math.min(260*scale, availW-2*pad);
    const perRow=Math.max(1, Math.floor((availW-2*pad)/colW));
    const rowsN=cols.length?Math.ceil(cols.length/perRow):0;
    const height=cols.length ? (pad + titleH + rowsN*lh + pad) : 0;
    return {pad,sw,lh,titleH,colW,perRow,height};
  }
  // draws the colour legend band with its top-left at (ox,oy); returns the band height used
  function drawLegend(ctx, cols, ox, oy, availW, scale){
    if(!cols.length) return 0;
    const L=legendLayout(cols, availW, scale);
    let ly=oy+L.pad;
    ctx.fillStyle='#111'; ctx.textBaseline='alphabetic'; ctx.textAlign='left';
    const cap=captionText(), maxCapW=availW-2*L.pad;
    ctx.font=`${22*scale}px ${SNAP_FONT}`;
    const capW=ctx.measureText(cap).width;
    if(capW>maxCapW) ctx.font=`${Math.max(9, 22*scale*maxCapW/capW)}px ${SNAP_FONT}`;   // shrink caption to fit the canvas width
    ctx.fillText(cap, ox+L.pad, ly+24*scale);
    ly+=L.titleH;
    ctx.font=`${15*scale}px ${SNAP_FONT}`;
    cols.forEach((idx,k)=>{
      const col=k%L.perRow, row=Math.floor(k/L.perRow);
      const x=ox+L.pad+col*L.colW, y=ly+row*L.lh;
      ctx.fillStyle=palette[idx].hex; ctx.fillRect(x,y,L.sw,L.sw);
      ctx.strokeStyle='rgba(0,0,0,.18)'; ctx.strokeRect(x+0.5,y+0.5,L.sw-1,L.sw-1);
      ctx.fillStyle='#111'; ctx.textBaseline='middle';
      ctx.fillText(palette[idx].name+(bgColors.has(idx)?'':'  (symbol)'), x+L.sw+10*scale, y+L.sw/2);
      ctx.textBaseline='alphabetic';
    });
    return L.height;
  }
  function usedColorList(){
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    const order=[]; chipOrder.forEach(i=>{ if(counts[i]>0 && !order.includes(i)) order.push(i); });
    palette.forEach((c,i)=>{ if(counts[i]>0 && !order.includes(i)) order.push(i); });
    return order;
  }
  function colorSummary(){
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    return usedColorList().map(i=>({ name:palette[i].name, hex:palette[i].hex, role: bgColors.has(i)?'background':'symbol', cells:counts[i] }));
  }
  function coverRect(iw,ih,bw,bh){ const s=Math.max(bw/iw,bh/ih); const w=iw*s,h=ih*s; return {x:(bw-w)/2,y:(bh-h)/2,w,h}; }
  // draw one source triangle into a destination triangle (affine), clip slightly dilated to hide seams
  function drawTri(ctx,img, s0,s1,s2, d0,d1,d2, grow){
    const cx=(d0.x+d1.x+d2.x)/3, cy=(d0.y+d1.y+d2.y)/3;
    const ex=p=>{ const dx=p.x-cx,dy=p.y-cy,L=Math.hypot(dx,dy)||1; return {x:p.x+dx/L*grow, y:p.y+dy/L*grow}; };
    const c0=ex(d0),c1=ex(d1),c2=ex(d2);
    ctx.save();
    ctx.beginPath(); ctx.moveTo(c0.x,c0.y); ctx.lineTo(c1.x,c1.y); ctx.lineTo(c2.x,c2.y); ctx.closePath(); ctx.clip();
    const x0=s0.x,y0=s0.y,x1=s1.x,y1=s1.y,x2=s2.x,y2=s2.y;
    const den=x0*(y2-y1)-x1*y2+x2*y1+(x1-x2)*y0; if(!den){ ctx.restore(); return; }
    const a=-(y0*(d2.x-d1.x)-y1*d2.x+y2*d1.x+(y1-y2)*d0.x)/den;
    const b=(y1*d2.y+y0*(d1.y-d2.y)-y2*d1.y+(y2-y1)*d0.y)/den;
    const c=(x0*(d2.x-d1.x)-x1*d2.x+x2*d1.x+(x1-x2)*d0.x)/den;
    const d=-(x1*d2.y+x0*(d1.y-d2.y)-x2*d1.y+(x2-x1)*d0.y)/den;
    const e=(x0*(y2*d1.x-y1*d2.x)+y0*(x1*d2.x-x2*d1.x)+(x2*y1-x1*y2)*d0.x)/den;
    const f=(x0*(y2*d1.y-y1*d2.y)+y0*(x1*d2.y-x2*d1.y)+(x2*y1-x1*y2)*d0.y)/den;
    ctx.transform(a,b,c,d,e,f);
    ctx.drawImage(img,0,0);
    ctx.restore();
  }
  function drawWarpedRug(ctx,img,quad,G,grow){
    const s=[0,0, 1,0, 0,1, 1,1];
    const d=[quad.tl.x,quad.tl.y, quad.tr.x,quad.tr.y, quad.bl.x,quad.bl.y, quad.br.x,quad.br.y];
    const t=general2DProjection(s,d); for(let i=0;i<9;i++) t[i]/=t[8];
    const proj=(u,v)=>{ const X=t[0]*u+t[1]*v+t[2],Y=t[3]*u+t[4]*v+t[5],Wp=t[6]*u+t[7]*v+t[8]; return {x:X/Wp,y:Y/Wp}; };
    const iw=img.width, ih=img.height;
    for(let i=0;i<G;i++)for(let j=0;j<G;j++){
      const u0=i/G,u1=(i+1)/G,v0=j/G,v1=(j+1)/G;
      const P00=proj(u0,v0),P10=proj(u1,v0),P01=proj(u0,v1),P11=proj(u1,v1);
      const S00={x:u0*iw,y:v0*ih},S10={x:u1*iw,y:v0*ih},S01={x:u0*iw,y:v1*ih},S11={x:u1*iw,y:v1*ih};
      drawTri(ctx,img, S00,S10,S01, P00,P10,P01, grow);
      drawTri(ctx,img, S10,S11,S01, P10,P11,P01, grow);
    }
  }
  function roomSnapshot(){
    const wrap=$('#studioWrap'); const W=wrap.clientWidth, H=wrap.clientHeight;
    if(!W||!H){ alert('Open the room view first, then take a snapshot.'); return; }
    const scale=2, ow=Math.round(W*scale), oh=Math.round(H*scale);
    const cols=usedColorList();
    const legendH = legendLayout(cols, ow, scale).height;
    const cv=document.createElement('canvas'); cv.width=ow; cv.height=oh+legendH;
    const ctx=cv.getContext('2d');
    ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,cv.width,cv.height);
    // room background (object-fit: cover), clipped to the room area
    const bg=$('#studioBg'); const iw=bg.naturalWidth||bg.width, ih=bg.naturalHeight||bg.height;
    ctx.save(); ctx.beginPath(); ctx.rect(0,0,ow,oh); ctx.clip();
    if(iw&&ih){ const r=coverRect(iw,ih,ow,oh); ctx.drawImage(bg, r.x,r.y,r.w,r.h); }
    // rug quad in output pixels (corners are fractions of the wrap box)
    const quad={ tl:{x:corners[0].x*ow,y:corners[0].y*oh}, tr:{x:corners[1].x*ow,y:corners[1].y*oh},
                 br:{x:corners[2].x*ow,y:corners[2].y*oh}, bl:{x:corners[3].x*ow,y:corners[3].y*oh} };
    ctx.save(); ctx.shadowColor='rgba(0,0,0,.07)'; ctx.shadowBlur=6*scale; ctx.shadowOffsetY=2*scale;
    ctx.fillStyle='#000'; ctx.beginPath(); ctx.moveTo(quad.tl.x,quad.tl.y); ctx.lineTo(quad.tr.x,quad.tr.y); ctx.lineTo(quad.br.x,quad.br.y); ctx.lineTo(quad.bl.x,quad.bl.y); ctx.closePath(); ctx.fill(); ctx.restore();
    drawWarpedRug(ctx, tuftCache, quad, 16, 1.0*scale);
    const fg=$('#studioFg');                                    // table cut-out in front of the rug
    if(fg && fg.naturalWidth){ const rf=coverRect(fg.naturalWidth,fg.naturalHeight,ow,oh); ctx.drawImage(fg, rf.x,rf.y,rf.w,rf.h); }
    ctx.restore();
    // colour legend baked into the file
    drawLegend(ctx, cols, 0, oh, ow, scale);
    downloadCanvas(cv, 'klattermusens-verkstad-room.png');
  }
  $('#snapBtn').onclick = roomSnapshot;
  $('#exportTufted').onclick = ()=>{
    const W=1200, s=2, cols=usedColorList(), lh=legendLayout(cols, W, s).height;
    const c=document.createElement('canvas'); c.width=W; c.height=W+lh;
    const ctx=c.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,c.width,c.height);
    drawTufted(ctx, W); drawLegend(ctx, cols, 0, W, W, s);
    downloadCanvas(c,'rug-tufted.png');
  };
  $('#exportDesign').onclick = ()=>{
    const W=1600, s=2, cols=usedColorList(), lh=legendLayout(cols, W, s).height;
    const c=document.createElement('canvas'); c.width=W; c.height=W+lh;
    const ctx=c.getContext('2d'); ctx.fillStyle='#ffffff'; ctx.fillRect(0,0,c.width,c.height);
    fillGridCells(ctx, W, '#ffffff'); drawLegend(ctx, cols, 0, W, W, s);
    downloadCanvas(c,'rug-design.png');
  };
  // smooth-contour render for projecting/tracing on the wall: every colour region's
  // mask is upscaled with bilinear smoothing and re-thresholded, turning tuft squares
  // into curves. Slightly dilated (midpoint < 128) so neighbouring regions overlap
  // instead of leaving base-colour seams; layers go largest-first, symbol on top.
  function drawSmooth(ctx, S){
    const counts=new Array(palette.length).fill(0);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
    const bg=[...bgColors].filter(i=>counts[i]>0).sort((a,b)=>counts[b]-counts[a]);
    const sym=palette.map((c,i)=>i).filter(i=>counts[i]>0 && !bgColors.has(i)).sort((a,b)=>counts[b]-counts[a]);
    const base=bg[0]??sym[0]; if(base==null) return;
    ctx.fillStyle=palette[base].hex; ctx.fillRect(0,0,S,S);
    const m=document.createElement('canvas'); m.width=m.height=N; const mc=m.getContext('2d');
    const big=document.createElement('canvas'); big.width=big.height=S; const bc=big.getContext('2d');
    bc.imageSmoothingEnabled=true; bc.imageSmoothingQuality='high';
    const layer=(idx,blurCells)=>{
      const id=mc.createImageData(N,N);
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(grid[y][x]===idx) id.data[(y*N+x)*4+3]=255; }
      mc.putImageData(id,0,0);
      bc.clearRect(0,0,S,S);
      bc.filter=`blur(${(S/N)*blurCells}px)`; bc.drawImage(m,0,0,S,S); bc.filter='none';
      const d=bc.getImageData(0,0,S,S), [r,g,b]=hexToRgb(palette[idx].hex);
      for(let k=0;k<d.data.length;k+=4){
        const a=d.data[k+3];
        d.data[k]=r; d.data[k+1]=g; d.data[k+2]=b;
        d.data[k+3]= a>=124?255 : a<=100?0 : Math.round((a-100)*255/24);
      }
      bc.putImageData(d,0,0);
      ctx.drawImage(big,0,0);
    };
    bg.slice(1).forEach(i=>layer(i,1.2)); sym.forEach(i=>layer(i,0.6));   // blobs rounded hard, lettering gently
  }
  $('#exportSmooth').onclick = ()=>{
    const S=2400, c=document.createElement('canvas'); c.width=c.height=S;
    drawSmooth(c.getContext('2d'), S);
    downloadCanvas(c,'rug-projection.png');
  };
  $('#saveJson').onclick = ()=>{
    const data = { ...serialize(), exportedAt:new Date().toISOString(), colors:colorSummary() };
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:'application/json'}));
    a.download='rug-project.json'; a.click(); URL.revokeObjectURL(a.href);
  };
  $('#loadJson').onclick = ()=> $('#fileInput').click();
  $('#fileInput').onchange = e => {
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=()=>{ try{
      const d=JSON.parse(rd.result);
      if(!d || !d.grid || !d.palette){ alert('Not a rug project file.'); return; }
      if(d.version>3){ alert('This project was made with a newer version of the app.'); return; }
      const rowN = d.N || d.grid.length;
      if(!Array.isArray(d.grid) || d.grid.length!==rowN || d.grid.some(r=>!Array.isArray(r) || r.length!==rowN)){ alert('Could not read project file.'); return; }
      applyState(d); updateLabels(); afterEdit(); fitMedia();
    }catch(err){ alert('Could not read project file.'); } };
    rd.readAsText(f); e.target.value='';
  };

  // dropdown menus (Import/Export/BOM): close on outside click, Escape, or after an action button
  document.addEventListener('pointerdown', e=>{
    document.querySelectorAll('details.menu[open]').forEach(d=>{ if(!d.contains(e.target)) d.open=false; });
  });
  window.addEventListener('keydown', e=>{ if(e.key==='Escape') document.querySelectorAll('details.menu[open]').forEach(d=> d.open=false); });
  document.querySelectorAll('details.menu .menu-pop').forEach(pop=>{
    pop.addEventListener('click', e=>{ if(e.target.closest('button')) pop.closest('details').open=false; });   // close after an action button; leave selects/inputs open
  });

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
  function b64FromMask(m){ let s=''; for(let i=0;i<m.length;i++) s+=String.fromCharCode(m[i]); return btoa(s); }
  function maskFromB64(str,len){ const bin=atob(str), m=new Uint8Array(len); for(let i=0;i<len&&i<bin.length;i++) m[i]=bin.charCodeAt(i); return m; }
  function serialize(){
    return { version:3, rug_m:RUG_M, N, grid, palette,
      groundIdx, patternB, bgColors:[...bgColors], chipOrder, recolorTarget, recolorSymbol,
      groundMask: groundMask?b64FromMask(groundMask):null,
      corners, supplier, pileMM, patType:$('#patType').value, patSize:$('#patSize').value };
  }
  function applyState(d, keepHistory){
    N=d.N||d.grid.length; grid=d.grid; if(d.palette) palette=d.palette;
    groundIdx=d.groundIdx; patternB=d.patternB; chipOrder=d.chipOrder||[];
    recolorTarget=d.recolorTarget; recolorSymbol=!!d.recolorSymbol;
    bgColors=new Set(d.bgColors || (d.groundIdx!=null?[d.groundIdx]:[]));
    groundMask = d.groundMask!=null ? maskFromB64(d.groundMask, N*N)
      : (function(){ const m=new Uint8Array(N*N); for(let y=0;y<N;y++)for(let x=0;x<N;x++) m[y*N+x]=bgColors.has(grid[y][x])?1:0; return m; })();
    if(d.corners) corners=d.corners;
    if(d.supplier){ supplier=d.supplier; $('#supplier').value=supplier; }
    if(d.pileMM){ pileMM=d.pileMM; const el=$('#pileMM'); if(el) el.value=pileMM; }
    if(d.patType){ $('#patType').value=d.patType; } if(d.patSize) $('#patSize').value=d.patSize;
    if(!keepHistory){ undoStack.length=0; redoStack.length=0; }
  }
  function saveState(){
    try{ localStorage.setItem(LS_KEY, JSON.stringify(serialize())); }catch(_){ }
  }
  function queueSave(){ clearTimeout(saveTimer); saveTimer=setTimeout(saveState, 400); }
  function loadState(){
    try{
      const raw=localStorage.getItem(LS_KEY); if(!raw) return false;
      const d=JSON.parse(raw); if(!d||!d.grid) return false;
      applyState(d);
      updateLabels(); afterEdit(); fitMedia();
      return true;
    }catch(_){ return false; }
  }
  $('#clearAll').onclick = ()=>{ if(confirm('Reset to the Klättermusens logo and clear your saved design?')){ try{ localStorage.removeItem(LS_KEY); }catch(_){ } location.reload(); } };

  // ---------- default colourway (fresh load / Reset) ----------
  // Logo in Light Pink over the botanical-1 background, its clusters mapped
  // darkest→lightest to Salmon / Aubergine Purple / Ochre Yellow / Maple Brown.
  function applyDefaultColourway(){
    const idxOf=n=>palette.findIndex(c=>c.name===n);
    const DEFAULT_SYMBOL = idxOf('Light Pink');
    const DEFAULT_BG = ['Salmon','Aubergine Purple','Ochre Yellow','Maple Brown'].map(idxOf);
    if(DEFAULT_SYMBOL<0 || DEFAULT_BG.some(i=>i<0)) return;
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(grid[y][x]<0) continue; grid[y][x]= groundMask[y*N+x] ? DEFAULT_BG[0] : DEFAULT_SYMBOL; }
    groundIdx=DEFAULT_BG[0]; bgColors=new Set([DEFAULT_BG[0]]); chipOrder=[DEFAULT_SYMBOL, DEFAULT_BG[0]];
    recolorTarget=DEFAULT_SYMBOL; recolorSymbol=true;
    const done=()=>{ undoStack.length=0; redoStack.length=0; afterEdit(); };
    const img=new Image();
    img.onload=()=>{
      applyBgImage(img);
      const ranked=[...bgColors].sort((a,b)=>lumOf(a)-lumOf(b)), map={};
      ranked.forEach((i,r)=> map[i]=DEFAULT_BG[Math.min(r,DEFAULT_BG.length-1)]);
      const cc={};
      for(let y=0;y<N;y++)for(let x=0;x<N;x++){
        if(!groundMask[y*N+x]) continue;
        const to=map[grid[y][x]]; if(to!=null) grid[y][x]=to;
        cc[grid[y][x]]=(cc[grid[y][x]]||0)+1;
      }
      bgColors=new Set(Object.keys(cc).map(Number));
      groundIdx=+Object.keys(cc).sort((a,b)=>cc[b]-cc[a])[0];
      chipOrder=[DEFAULT_SYMBOL, ...[...bgColors].sort((a,b)=>cc[b]-cc[a])];
      done();
    };
    img.onerror=done;                        // pattern missing -> plain pink-on-salmon logo
    img.src='patterns/botanical-1.jpg';
  }

  // ---------- init ----------
  applySplit(); applyCurtain(); buildPatLib();
  grid = blankGrid(N); updateLabels();
  if (!loadState()){                                           // restore saved work, else auto-load the logo
    afterEdit(); fitMedia();
    fetch('logo.svg').then(r=>{ if(!r.ok) throw 0; return r.blob(); }).then(b=>{
      $('#importInvert').checked=true; const img=new Image();
      img.onload=()=>{ importImage(img); URL.revokeObjectURL(img.src); applyDefaultColourway(); };
      img.onerror=()=>URL.revokeObjectURL(img.src);
      img.src=URL.createObjectURL(b);
    }).catch(()=>{ /* file:// — open via localhost to auto-load the logo */ });
  }
})();
