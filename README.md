# TuftView — 2×2m rug designer & client preview

A single-file web app for designing a hand-tufted rug on a grid and showing a client
how it will look — as a flat plan, as a simulated wool pile, and dropped into the
real studio photo.

## Run
Open via the local server:

  http://localhost/org/jonasjohansson/tuftview/

(or just open `index.html` — `studio.jpg` must sit next to it).

## What it does
- **Design** — paint a 2×2m grid. Brush / fill / eyedropper / erase, brush size,
  symmetry (mirror, 4-way, rotate). Resolution 10–500 cells/side; default
  **400×400 (5mm tufts ≈ cut-pile gauge)**. Yellow gridlines mark the 5cm
  guidelines woven into the Tufting Europe primary cloth.
- **Import a print** — load any image (or one-click the bundled Klättermusens
  logo) and map it onto the grid in the nearest yarn colours, with colour
  reduction and a line-art mode for logos. The Klättermusens logo
  (`logo.png`, rasterised from the supplied SVG) **auto-loads on startup** when
  served over localhost.
- **Tufted preview** — renders the design as simulated cut-pile wool.
- **In room / studio** — lays the rug into a scene: the gallery floor (`room.jpg`),
  the tufting studio wall (`studio.jpg`), or your own uploaded photo. Drag the four
  corners to place it in perspective; opacity slider. Good for presenting to a client.
- **Yarn palette** — mirrors the Tufting Europe 100% NZ-wool range (500g cones).
  Add/edit/remove colours freely.
- **Yarn estimate** — per-colour kg + whole cones to order, total cones and €cost.
  Tune pile density (kg/m²) and €/cone.
- **Export** — flat design PNG, tufted PNG, save/load project as JSON.
- **Presets** — checkerboard, stripes, concentric squares.

## Notes
- Palette hex values approximate the Tufting Europe colour names; confirm against
  their physical sample book before ordering.
- Yarn estimate is a rough guide for hand-tufted cut pile; real usage depends on
  pile height and tufting gun.
