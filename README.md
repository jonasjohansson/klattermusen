# TuftView — tufted rug preview & recolour

A single-file web app for showing a client how a 2×2m hand-tufted rug will look.
You upload artwork (the Klättermusens logo auto-loads), recolour it in yarn, and
see it live as a flat plan, simulated wool pile, and dropped into a room.

## Run
Open via the local server (needed for the logo auto-load):

  http://localhost/org/jonasjohansson/tuftview/

(or open `index.html` directly — `logo.png`, `room.jpg`, `studio.jpg` must sit
next to it; the one-click/auto logo load only works over localhost).

## Two tabs

### Workspace
Everything live at once — edits ripple across all three views:
- **In the room** (hero) — the rug warped into a scene: gallery floor (`room.jpg`),
  tufting studio wall (`studio.jpg`), or your own uploaded photo. Drag the rug to
  move it, drag the four corners for perspective, X/Y/scale/rotate/opacity to fine-tune.
- **Tufted preview** — simulated cut-pile wool.
- **Flat design** — the source grid; yellow lines mark the 5cm guidelines woven into
  the Tufting Europe cloth. Toggle the grid on/off.
- **Recolour** (the main action) — every yarn used in the rug as big swatches; pick a
  replacement from the full Tufting Europe range to swap it everywhere, or fine-tune
  the hex. Undo/redo.
- **Fill a shape** — turn it on and click inside a closed region of the flat design to
  drop the selected yarn into just that area (e.g. inside a letter or the mouse).
- **Artwork** — upload an image or load the logo. Import settings (detail up to
  500×500 / 4mm, max colours, line-art mode) live in a small drawer.
- **Export** — tufted PNG, flat PNG, save/load project `.json`.

### Yarn estimate
Per-colour kg and whole 500g cones to order, total cones and €cost. Tune pile
density (kg/m²) and €/cone.

## Notes
- Default resolution 400×400 (5mm tufts ≈ cut-pile gauge).
- Palette hex values approximate the Tufting Europe colour names — confirm against
  their physical sample book before ordering.
- No drawing tools: design your artwork elsewhere and upload it.
