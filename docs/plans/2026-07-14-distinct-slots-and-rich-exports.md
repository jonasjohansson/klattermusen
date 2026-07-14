# Distinct color slots + richer exports — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let two palette slots share the same yarn/hex without collapsing (design + legend + project file show all slots; BOM merges same-yarn slots into one order line), make every export self-documenting (color legend + date), and reorganize the toolbar Import/Export by direction — on top of a unified save/load/undo foundation that fixes the current crash/corruption bugs.

**Architecture:** One `serialize()`/`restore()` pair backs both localStorage and the JSON file. `groundMask` is persisted spatially instead of reconstructed from color values, so a palette index can live in both the symbol and background regions. Recolor and the image-background quantizer clone a yarn into a fresh slot rather than merging onto an in-use index. A shared `drawLegend()` helper draws the color key on all three PNG exporters.

**Tech Stack:** Vanilla ES (single `app.js` IIFE), no build step, no test framework. `index.html` + `styles.css`. Verification is by driving the app at `http://localhost/org/jonasjohansson/klattermusen/` in a browser and observing behavior (there is no unit-test harness — do NOT invent one; use the `/run` and `/verify` skills and manual repro steps).

**Design doc:** `docs/plans/2026-07-14-distinct-slots-and-rich-exports-design.md`

**Conventions:** Match the existing terse one-line-function style in `app.js`. Commit after each task. All line numbers below are from the pre-change file and will drift as you edit — re-grep before each edit.

---

## Phase 1 — Unify persistence & undo (fixes crashes/corruption)

### Task 1: Extract `serialize()` / `restore()` and route localStorage through them

**Files:** Modify `app.js` — `snapshot`/`restore` (~121-123), `saveState` (~660-662), `loadState` (~664-680).

**Step 1:** Add a single serializer near `saveState`. It captures the full editable state, including `groundMask` (base64) and `recolorSymbol`:

```js
function b64FromMask(m){ let s=''; for(let i=0;i<m.length;i++) s+=String.fromCharCode(m[i]); return btoa(s); }
function maskFromB64(str,len){ const bin=atob(str), m=new Uint8Array(len); for(let i=0;i<len&&i<bin.length;i++) m[i]=bin.charCodeAt(i); return m; }
function serialize(){
  return { version:3, rug_m:RUG_M, N, grid, palette,
    groundIdx, patternB, bgColors:[...bgColors], chipOrder, recolorTarget, recolorSymbol,
    groundMask: groundMask?b64FromMask(groundMask):null,
    corners, supplier, pileMM, patType:$('#patType').value, patSize:$('#patSize').value };
}
function applyState(d){                                   // shared by loadState + file load
  N=d.N; grid=d.grid; if(d.palette) palette=d.palette;
  groundIdx=d.groundIdx; patternB=d.patternB; chipOrder=d.chipOrder||[];
  recolorTarget=d.recolorTarget; recolorSymbol=!!d.recolorSymbol;
  bgColors=new Set(d.bgColors || (d.groundIdx!=null?[d.groundIdx]:[]));
  groundMask = d.groundMask!=null ? maskFromB64(d.groundMask, N*N)
    : (function(){ const m=new Uint8Array(N*N); for(let y=0;y<N;y++)for(let x=0;x<N;x++) m[y*N+x]=bgColors.has(grid[y][x])?1:0; return m; })();
  if(d.corners) corners=d.corners;
  if(d.supplier){ supplier=d.supplier; $('#supplier').value=supplier; }
  if(d.pileMM){ pileMM=d.pileMM; const el=$('#pileMM'); if(el) el.value=pileMM; }
  if(d.patType){ $('#patType').value=d.patType; } if(d.patSize) $('#patSize').value=d.patSize;
  undoStack.length=0; redoStack.length=0;                 // don't undo across a load
}
```

**Step 2:** Rewrite `saveState` to `localStorage.setItem(LS_KEY, JSON.stringify(serialize()))`.

**Step 3:** Rewrite `loadState` to parse the raw, guard `if(!d||!d.grid) return false`, call `applyState(d)`, then `updateLabels(); afterEdit(); fitMedia(); return true;`.

**Step 4 (verify):** With the `/run` skill, open the app, make an edit, reload the page → design restores unchanged. Recolor the background, reload → symbol/background roles still correct (previously the mask was value-reconstructed). Confirm no console errors.

**Step 5:** `git commit -m "Refactor persistence behind serialize()/applyState(); persist groundMask spatially"`

### Task 2: Put `N` and role state into the undo snapshot

**Files:** Modify `app.js` — `snapshot`/`restore` (~121-123).

**Step 1:** Change `snapshot()` to reuse the serializer minus the DOM-bound bits (or just call `serialize()`):

```js
function snapshot(){ return JSON.stringify(serialize()); }
function restore(s){ applyState(JSON.parse(s)); afterEdit(); }
```

Note: `applyState` clears the undo stacks, which is wrong inside undo/redo. Add a param: `applyState(d, keepHistory)` and skip the `undoStack.length=0` when `keepHistory` is true; `restore()` passes `true`, the load paths pass falsy.

**Step 2 (verify):** Import artwork at res 200, then import again at res 400, then Cmd-Z. Previously threw `TypeError` (grid 200² while N=400). Now the grid AND N revert together — no crash, correct render. Then: recolor background White→Teal, Cmd-Z → pixels and roles both revert (chip labels correct, next pattern paint uses the right `groundIdx`).

**Step 3:** `git commit -m "Include N + role state in undo snapshot (fixes undo-across-import crash)"`

### Task 3: Route the JSON file load through `applyState`; enrich `saveJson`

**Files:** Modify `app.js` — `saveJson`/`loadJson`/`fileInput` (~639-641).

**Step 1:** `saveJson` writes the full project plus metadata:

```js
$('#saveJson').onclick = ()=>{
  const data = { ...serialize(), exportedAt:new Date().toISOString(), colors:colorSummary() };
  const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,0)],{type:'application/json'}));
  a.download='rug-project.json'; a.click(); URL.revokeObjectURL(a.href);
};
```

`colorSummary()` (add it near `usedColorList`) returns one entry per used slot — see Task 9; for Phase 1 it can be a stub returning `[]` and be filled in Phase 4. **Simpler: defer `colors:` until Phase 4** and ship `saveJson` now with just `...serialize()` + `exportedAt`.

**Step 2:** `fileInput` handler validates rows then delegates:

```js
$('#fileInput').onchange = e => {
  const f=e.target.files[0]; if(!f) return;
  const rd=new FileReader();
  rd.onload=()=>{ try{
    const d=JSON.parse(rd.result);
    if(!d.grid||!d.palette){ alert('Not a rug project file.'); return; }
    if(!Array.isArray(d.grid) || d.grid.some(r=>!Array.isArray(r)||r.length!==(d.N||d.grid.length))) throw 0;
    applyState(d); updateLabels(); afterEdit(); fitMedia();
  }catch(err){ alert('Could not read project file.'); } };
  rd.readAsText(f); e.target.value='';
};
```

**Step 3 (verify):** Place a rug in the room, set 20mm pile + Hitex supplier, Save .json. Reset (or reload), then Load project → placement, pile, supplier, roles, pattern all restore. Load a v2 file (5-field) → still opens (missing fields default; mask reconstructs from values). Load a garbage file → clean alert, no broken state.

**Step 4:** `git commit -m "JSON project file round-trips full state via applyState; validate on load"`

---

## Phase 2 — Role model prerequisites for distinct slots

### Task 4: Aggregate the BOM by yarn identity (hex)

**Files:** Modify `app.js` — `renderEstimate` (~239-299).

**Step 1:** Between the per-index `counts` loop (~243) and the `palette.forEach` row loop (~246), fold same-hex slots together so cones/kg/minimums are computed once per yarn:

```js
// merge same-yarn slots (same hex) into one order line; prefer an in-stock representative
const groups=new Map();                    // hex -> { rep:paletteEntry, cells:int }
palette.forEach((c,i)=>{ if(!counts[i]) return;
  const g=groups.get(c.hex);
  if(!g) groups.set(c.hex,{rep:c,cells:counts[i]});
  else { g.cells+=counts[i]; if(!sup.stock(g.rep) && sup.stock(c)) g.rep=c; } });
```

Then replace `palette.forEach((c,i)=>{ if(!counts[i]) return; const kg=counts[i]*... })` with `groups.forEach(({rep:c,cells})=>{ const kg=cells*cellArea*DENSITY; ... })`, using `c` for name/hex/link/`hitexMatch` and `cells` in place of `counts[i]`. Everything downstream (`billKg`, cones, discount) then rounds once per yarn.

**Step 2 (verify):** Import art, manually recolor two regions to the *same* tray yarn (after Task 7 this makes 2 slots; for now, ensure two existing slots share a hex). BOM shows ONE row for that yarn with summed area; the Hitex `kg` reflects combined weight and the 1kg minimum applies once. The toolbar price drops accordingly.

**Step 3:** `git commit -m "BOM: merge same-yarn palette slots into one order line by hex"`

### Task 5: `defaultPatternB` must avoid symbol colors

**Files:** Modify `app.js` — `defaultPatternB` (~342), mirroring `applyBgImage`'s exclusion (~374-377).

**Step 1:** Compute the symbol set (cells outside `groundMask`) and pick a contrasting in-stock index not in it:

```js
function defaultPatternB(){
  const sym=new Set(); if(groundMask) for(let y=0;y<N;y++)for(let x=0;x<N;x++){ if(!groundMask[y*N+x]){ const v=grid[y][x]; if(v>=0) sym.add(v); } }
  const pref=groundIdx===2?8:2;
  if(!sym.has(pref)) return pref;
  let cand=palette.map((c,i)=>i).filter(i=>i!==groundIdx && !sym.has(i) && inStock(palette[i]));
  if(!cand.length) cand=palette.map((c,i)=>i).filter(i=>i!==groundIdx && !sym.has(i));
  return cand.length?cand[0]:pref;
}
```

**Step 2 (verify):** With a symbol using Honey Beige (index 2) and a different ground, apply a checker pattern → the alt squares no longer collide with the symbol color; the symbol chip keeps its "symbol" label; reload preserves roles.

**Step 3:** `git commit -m "defaultPatternB avoids symbol colors (mirror image-background exclusion)"`

---

## Phase 3 — Distinct slots

### Task 6: Add a slot-clone helper

**Files:** Modify `app.js` — near the palette declaration / recolor section.

**Step 1:** Add a helper that appends a duplicate of an existing yarn and returns its new index:

```js
function cloneSlot(srcIdx){ const c=palette[srcIdx]; palette.push({...c}); return palette.length-1; }
```

(Spread copies `name`, `hex`, and any supplier fields `u`/`s`/etc. so the clone is the same yarn.)

**Step 2:** `git commit -m "Add cloneSlot() to duplicate a yarn into a new palette slot"`

### Task 7: `remapColour` clones instead of merging onto an in-use yarn

**Files:** Modify `app.js` — `remapColour` (~302-317).

**Step 1:** At the top of `remapColour(from,to,symbolRegion)`, after `if(from===to) return;`, detect the collapse case — the target yarn is already used by cells *outside* the region being recolored — and clone:

```js
const counts=new Array(palette.length).fill(0);
for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
// if 'to' is already in use elsewhere and would merge two regions, use a fresh slot instead
if(counts[to]>0){ const dup=cloneSlot(to); to=dup; }
```

Keep the rest of the function as-is (it already repoints cells and updates `bgColors`/`chipOrder` by index). The existing de-dup at ~315 is by index and is safe for distinct slots.

**Step 2 (verify):** Import art with 5 colors. Recolor one region to a yarn another region already uses. Confirm: the legend/chips still show 5 distinct entries (two identical swatches), `usedColorList` returns 5, and the BOM (Task 4) shows one merged line for the shared yarn. Undo → back to the prior state cleanly (Task 2 snapshots palette, so the clone is removed).

**Step 3:** `git commit -m "remapColour: clone yarn into a new slot instead of merging regions"`

### Task 8: Image-background quantizer preserves slots

**Files:** Modify `app.js` — `applyBgImage` (~362-397) and its `nearAllow`/quantize path (~378).

**Step 1:** After the quantizer assigns background cells, detect any background yarn whose index is ALSO used by symbol cells and split it into a fresh slot for the background occurrence, so the two regions never share an index. (Concretely: build `symbolSet` as the code already does at ~374, and for each background index in `symbolSet`, `cloneSlot` it, repoint the background cells, and add the clone to `bgColors`/`chipOrder`.) Reuse the same pattern as Task 7.

**Step 2 (verify):** Load a photo background whose quantized colors overlap the logo's colors → background and symbol keep separate slots; `bgColors` never marks a symbol cell; BOM still merges by hex.

**Step 3:** `git commit -m "Image background: split shared indices into distinct slots"`

---

## Phase 4 — Richer exports

### Task 9: `colorSummary()` and add `colors` + `exportedAt` to JSON

**Files:** Modify `app.js` — near `usedColorList` (~549), and `saveJson` (from Task 3).

**Step 1:** Add a per-slot summary (5 entries when 5 slots are used, even with duplicate hexes):

```js
function colorSummary(){
  const counts=new Array(palette.length).fill(0);
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){ const v=grid[y][x]; if(v>=0) counts[v]++; }
  return usedColorList().map(i=>({ name:palette[i].name, hex:palette[i].hex,
    role: bgColors.has(i)?'background':'symbol', cells:counts[i] }));
}
```

**Step 2:** Ensure `saveJson` includes `colors:colorSummary()` (finish the deferral from Task 3).

**Step 3 (verify):** Save .json, open the file in a text editor → readable `colors` array with one entry per slot (duplicate hexes both present), plus `exportedAt` ISO timestamp.

**Step 4:** `git commit -m "JSON export: add human-readable colors summary + exportedAt"`

### Task 10: Extract `drawLegend()` and add the export date

**Files:** Modify `app.js` — `roomSnapshot` legend block (~617-633), and the caption line (~621).

**Step 1:** Extract the legend-drawing loop into a reusable helper that takes a context, the ordered color indices, an origin, width, and scale — factor the swatch + name + `(symbol)` logic out of `roomSnapshot` verbatim, plus a caption helper:

```js
function captionText(){ const d=new Date(); const iso=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  return `Klättermusens Verkstad · ${RUG_M.toFixed(1)}×${RUG_M.toFixed(1)} m · ${pileMM} mm cut pile · ${iso}`; }
function drawLegend(ctx, cols, ox, oy, availW, scale){ /* moved from roomSnapshot: title via captionText(), then swatch grid */ }
```

**Step 2:** Replace the inline block in `roomSnapshot` with a `drawLegend(...)` call (date now appears in its caption).

**Step 3:** `git commit -m "Extract drawLegend()/captionText(); add export date to snapshot caption"`

### Task 11: Bake the legend into Tufted PNG and Flat PNG

**Files:** Modify `app.js` — `exportTufted` (~637), `exportDesign` (~638).

**Step 1:** In each handler, after drawing the rug into a `W×W` canvas, grow the canvas height by a computed legend band and call `drawLegend`. Compute the band height the same way `roomSnapshot` does (`titleH + rows*lh + pad`). Guard the empty-grid case: if nothing is drawn, either skip the legend or show the same placeholder as `drawTufted` — pick consistent behavior with `roomSnapshot`.

**Step 2 (verify):** Export Tufted PNG and Flat PNG → each file now carries the caption (with date) and the swatch/name/(symbol) key. Export with 5 slots incl. a duplicate hex → 5 rows.

**Step 3:** `git commit -m "Tufted/Flat PNG exports bake in the color legend + date"`

### Task 12: Fix export-adjacent bugs surfaced by the audit

**Files:** Modify `app.js` — `importLogo` (~495-500) & init loader (~688-692); `importImage` res clamp (~459); `downloadCanvas` guard (~545).

**Step 1:** Revoke object URLs in `importLogo` and the init loader (mirror the file-picker `onload` revoke at ~503); add `onerror` handlers. Clamp `newN`: `const newN=Math.max(8,Math.min(500,+$('#importRes').value||0));`. Wrap `downloadCanvas`'s `toBlob` callback to alert on a null blob.

**Step 2 (verify):** Repeated Logo imports don't grow memory (DevTools); a pathological resolution value no longer hangs the tab.

**Step 3:** `git commit -m "Fix object-URL leaks, clamp import resolution, guard downloadCanvas"`

---

## Phase 5 — UI cleanup & toolbar reorg

### Task 13: Toolbar reorg by direction

**Files:** Modify `index.html` (~12-39). No JS changes (all bindings are id-based — verified by audit).

**Step 1:** Move `#importBtn` (Upload) and `#importLogo` (Logo) into the Import `<details>`; move `#loadJson` (Load project) from Export into Import; move `#snapBtn` (Snapshot) into Export. Keep `#clearAll` (Reset) as the one loose button. Preserve every `id`.

**Step 2 (verify):** Every button still works (ids unchanged). Import menu = Upload, Logo, artwork settings, Load project; Export = Snapshot, Tufted, Flat, Save.

**Step 3:** `git commit -m "Toolbar: reorganize Import (in) / Export (out) by direction"`

### Task 14: Close dropdown menus on click-away, Escape, and after an action

**Files:** Modify `app.js` — add near the transform-popup close logic (~527-530) and the global keydown (~655).

**Step 1:** Add a document `pointerdown` listener that closes any open `<details class="menu">` whose summary/`menu-pop` wasn't the click target; close open menus on `Escape`; and in each menu action handler (`exportTufted`, `exportDesign`, `saveJson`, `snapBtn`, etc.) close the parent `<details>` after firing.

**Step 2 (verify):** Open Export, click Tufted PNG → downloads AND the menu closes. Open Import, click elsewhere → closes. Escape closes an open menu. Two menus can't both stay open.

**Step 3:** `git commit -m "Close dropdown menus on click-away, Escape, and after an action"`

### Task 15: Delete scratch files and prune dead code/CSS

**Files:** Delete `_r1.html`, `_bomtest.html`. Modify `app.js` (~223 dead `.handle` loop), `index.html` (dead ids `patternRow` ~93, `curtain` ~83), `styles.css` (unused `.tabs`, `.dock-row .sep`, `.rc-sw`, `button.primary`, `.handle` block; wire `--shadow-menu` into `.menu .menu-pop` or drop the token).

**Step 1:** Remove the dead `.handle` querySelectorAll loop (it's a no-op — no `.handle` elements are created). Remove unused CSS selectors and dead ids after grep-confirming zero references. Replace the hardcoded menu shadow with `var(--shadow-menu)`.

**Step 2 (verify):** App loads and every feature still works (the removed CSS/ids were unreferenced). `git grep` confirms no dangling references.

**Step 3:** `git commit -m "Remove dead scratch files, unused CSS, and dead .handle/ids"`

---

## Deferred (not in this plan — confirm before doing)

- Displayed kg vs billed kg reconciliation and per-line rounding that sums to total (BOM #2/#3) — pricing-presentation polish, no correctness risk to the feature.
- Wiring per-supplier `mat.cloth`/`mat.backing` (currently dead) — needs real supplier prices from the owner.
- Full-res snapshot render instead of the 640px `tuftCache` (quality nicety).
- Accessibility labels (`<label for>`, `aria-label` on summaries).

---

## Global verification (run after Phase 4, and again at the end)

Drive the app and confirm end-to-end:
1. Import → recolor two regions to the same yarn → legend shows **5**, BOM shows **4** lines.
2. Save .json → Reset → Load project → placement, pile, supplier, roles, pattern all survive.
3. Undo across an image import → no crash.
4. Export each PNG → baked legend + date present, 5 rows when 5 slots used.
5. Reload the page mid-design → localStorage restores identical state (incl. spatial mask).
