# Distinct color slots + richer exports — design

Date: 2026-07-14
Status: approved design, pending implementation plan

## Goal

Two user-facing requests:

1. **Respect distinct color slots even when two share the same hex.** Today "5 colors"
   can silently collapse to "4" when two regions end up on the same yarn. The design,
   legend, and project file should keep all 5 slots; only the shopping list (BOM) merges
   same-yarn slots into one order line.
2. **Make exports self-documenting** — every export (saved `.json`, room snapshot,
   Tufted PNG, Flat PNG) should carry color info (swatch + yarn name + `(symbol)` tag)
   and the export date.

Plus a UX ask: reorganize the toolbar so Import = "bring in" and Export = "send out".

## Decisions (locked with the owner)

- Scope: all four exports carry color info + date.
- Image legend detail: swatch + name + `(symbol)` tag (no hex/code/% for now).
- Menu layout: **by direction.** Import = Upload, Logo, artwork settings, Load project…
  Export = Room snapshot, Tufted PNG, Flat PNG, Save project. Reset stays top-level.
- "Same color" means **distinct slots, same hex** — legend/count show all 5 rows.
- BOM merges same-yarn slots into **one order line** (summed by hex).
- Slot preservation applies to **both** manual recolor and image-background quantization.

## Why this is bigger than the exports (audit findings)

A four-agent read-only audit (2026-07-14) found the app has one data model with three
serializers that disagree:

- **localStorage** persists 13 fields.
- **JSON export** writes 5, restores 3.
- **Undo** (`snapshot()`) captures only `{grid, palette}`.

Consequences that are prerequisites for this feature:

- Undo across an image import can crash (`N` not restored). `app.js:121,460`
- Undo desyncs `bgColors`/`groundIdx`/`groundMask`/`patternB`. `app.js:121,312-356`
- JSON save→load drops corners, supplier, pileMM, roles, pattern settings. `app.js:639/641`
- **Reload rebuilds `groundMask` from color values** (`bgColors.has(grid[cell])`), which
  assumes an index lives in only one region — the exact assumption distinct slots break.
  This is the central blocker. `app.js:660-676`
- BOM keys rows by palette index, not hex → two same-yarn slots = two order lines with
  doubled cone rounding and doubled Hitex 1kg minimum. `app.js:242-270`
- `defaultPatternB()` doesn't exclude symbol colors (the image path does) → shared-index
  collision even today. `app.js:342` vs `374-377`

Supporting/quality findings (not blockers): displayed kg ≠ billed kg; line items don't sum
to total; dead `mat.cloth/backing`; object-URL leaks (`app.js:498,691`); unclamped
`importRes`→N; dropdown menus never close on click-away/Escape; dead `.handle` drag code;
unused CSS (`.tabs`, `.rc-sw`, `button.primary`, `--shadow-menu`); dead ids `patternRow`,
`curtain`. Scratch files `_r1.html` (dead/broken) and `_bomtest.html` (stale copy) should
be deleted.

## Architecture

### Data model
- Keep `grid` as indices into `palette`. Each palette entry is a **slot**; two slots may
  share `name`/`hex`. Distinctness is by index — already true in `usedColorList` and the
  chip/tray rendering, which key by index (not hex).
- **Role model:** stop reconstructing region membership from color values. Persist
  `groundMask` spatially (RLE or base64) so an index can live in both symbol and background.
- **Slot allocation:** when `remapColour` (and the image-background quantizer) would point a
  region at an already-in-use yarn, clone that yarn into a **new slot** and use the new
  index, so region identity survives.

### Serialization (single source of truth)
- One `serialize()` builder + one `restore()` applier, used by localStorage AND the JSON
  file path. JSON export = `serialize()` + `exportedAt` + a human-readable `colors` summary.
- `version: 3`; loader stays backward-compatible with v2 (fills defaults for missing fields).
- `restore()` resets ALL role/pattern state and clears undo/redo stacks.

### Exports
- Extract `drawLegend(ctx, cols, x, y, w, scale)` + a caption helper; call from
  `roomSnapshot`, `exportTufted`, `exportDesign`. Add export date to the caption line.

### BOM
- Aggregate estimate rows by yarn identity (hex, or the TE slug / Hitex code) before
  rounding cones/kg and applying minimums. Pick an in-stock representative when merging
  slots whose stock status differs. Design/legend stay per-slot.

## Phased plan

1. **Foundation** — unify save/load/undo behind `serialize()`/`restore()`; persist
   `groundMask` spatially; clear undo stacks on load. (Fixes crash/corruption findings.)
2. **Role model + BOM-by-hex + `defaultPatternB` guard** — the distinct-slots prerequisites.
3. **Distinct slots** — duplicate-slot allocation in recolor + image quantizer.
4. **Rich exports** — shared `drawLegend`, export date, `version:3` JSON with `colors`.
5. **Cleanup** — menu close behavior + toolbar reorg; delete scratch files; prune dead CSS.

## Testing / verification

No test harness exists. Verify by driving the app: import → recolor two regions to the same
yarn → confirm 5 slots in legend, 4 lines in BOM; save `.json` → reload → confirm placement,
pile, supplier, roles all survive; undo across an import → no crash; export each PNG →
confirm baked legend + date.
