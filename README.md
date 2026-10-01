# Nervant Pattern Studio

A browser-based duotone pattern generator with Josh Puckett’s DialKit controls.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` creates a static site in `dist/`; `npm test` checks seeded layouts and motif selection.

- Pick from 16 motifs, choose a palette or custom colours, then tune density, size, opacity, fading and grain.
- Colour stories have two rows: Primary uses the latest reference (Brand, Blue, Purple, Periwinkle, Sky, Green and Ink); Secondary preserves the previous palette (Brand, Blue, Purple, Green, Orange, Red and Ink). Every shade is sampled from the supplied references. Both rows support independent foreground/background pairs, Midnight for non-Ink stories, and pure black/white Ink. Each story remembers its pair during the session; selecting the opposite role’s shade swaps the colours.
- Size Variation merges grid spaces into small, medium and large square tiles without overlaps. Set it to zero for a uniform grid. Tile Backgrounds in Cell Style restores the optional inverted square fills; backgrounds and per-cell fading are off by default.
- Grid Flow’s X Angle tilts the pattern’s horizontal rows; Y Angle tilts its vertical columns. Both range from −40° to 40°, with zero restoring a straight grid. Motifs follow the grid, the pattern repeats to fill exposed corners, and global fading stays aligned to the canvas.
- Global Fade sets a fully hidden region in both modes. Each icon gets one opacity based on its center in canvas coordinates (after grid tilt), reaching zero inside the region and full opacity outside the Global Feather transition. Global Fade Shape selects the region geometry. Cell Style has independent Cell Fade and Cell Fade Shape controls for individual pattern tiles. Both support all edges, either diagonal corner pair, circular fading and individual sides, and can be combined.
- Drop Cells randomly leaves cells blank in either mode (0 keeps all, 1 drops all); blank positions stay stable until you shuffle or change the grid.
- Shuffle creates a new reproducible seeded layout. Export PNG saves the current canvas at 1440 pixels wide.
- Object mode includes a rotating procedural suspension bridge. Expand Object in DialKit to adjust cell size, abstraction, rotation and speed. Pause freezes the view for export; Bridge restores the built-in model.
- Import or drop PNG/JPG/WebP images, GLB models, or self-contained GLTF files (up to 50 MB). Transparent images give the clearest silhouettes. Separate GLTF texture/buffer files and Draco-compressed models are not supported.
- Assets are processed locally in the browser. 3D code loads only when needed; WebGL is required for 3D models. Image mode uses Canvas 2D.

Built with React, Canvas 2D, DialKit and Three.js. No backend or image-generation service.
