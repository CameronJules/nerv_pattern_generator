import {
  cells,
  motifs,
  random,
  isCellDropped,
  gridFlow,
  globalIconOpacity,
} from "./pattern.ts";
import {
  colourStories,
  secondaryStories,
  primaryStories,
  defaultPairs,
  selectShade,
} from "./colours.ts";
function assert(condition: boolean, message: string) {
  if (!condition) throw Error(message);
}
const a = cells(1440, 960, 10, 42, [0, 3, 5]);
assert(
  JSON.stringify(a) === JSON.stringify(cells(1440, 960, 10, 42, [0, 3, 5])),
  "Seed must reproduce the layout",
);
assert(
  JSON.stringify(a) !== JSON.stringify(cells(1440, 960, 10, 43, [0, 3, 5])),
  "Shuffle must change the layout",
);
assert(
  a.length === 70 && a.every((c) => [0, 3, 5].includes(c.motif)),
  "Grid uses only selected motifs and covers the canvas",
);
assert(
  cells(100, 100, 4, 0, []).every((c) => c.motif === 15),
  "Empty selection has a safe fallback",
);
const rng = random(1);
assert(
  Array.from({ length: 1000 }, () => rng()).every((n) => n >= 0 && n < 1),
  "Random values stay in bounds",
);
assert(
  motifs.length === 16 && new Set(motifs.map((m) => m.name)).size === 16,
  "All motifs are present",
);
const dropped = (amount: number, seed = 42) =>
  a.map((_, i) => isCellDropped(seed, i % 10, Math.floor(i / 10), amount));
assert(
  dropped(0).every((v) => !v) && dropped(1).every(Boolean),
  "Drop endpoints keep all or blank all cells",
);
assert(
  JSON.stringify(dropped(0.4)) === JSON.stringify(dropped(0.4)),
  "Dropped cells remain stable across redraws",
);
assert(
  JSON.stringify(dropped(0.4)) !== JSON.stringify(dropped(0.4, 43)),
  "Shuffle changes blank positions",
);
assert(
  dropped(0.4).some(Boolean) && dropped(0.4).some((v) => !v),
  "Partial drop leaves a mixture of blank and filled cells",
);
assert(
  dropped(0.4).every((v, i) => !v || dropped(0.7)[i]),
  "Increasing drop only removes additional cells",
);
for (const columns of [4, 7, 10, 30]) {
  for (const seed of [0, 42, 101]) {
    const mixed = cells(1440, 960, columns, seed, [0, 3, 5], 0.65);
    const unit = 1440 / columns;
    const rows = Math.ceil(960 / unit);
    const coverage = new Uint8Array(columns * rows);
    for (const tile of mixed) {
      const span = Math.round(tile.size / unit);
      assert(
        tile.column + span <= columns && tile.row + span <= rows,
        "Merged tiles stay within the grid",
      );
      for (let y = tile.row; y < tile.row + span; y++)
        for (let x = tile.column; x < tile.column + span; x++)
          coverage[y * columns + x]++;
    }
    assert(
      coverage.every((n) => n === 1),
      "Mixed tiles cover every grid position exactly once, with no overlaps or gaps",
    );
    assert(
      JSON.stringify(mixed) ===
        JSON.stringify(cells(1440, 960, columns, seed, [0, 3, 5], 0.65)),
      "Mixed layouts are reproducible",
    );
  }
}
assert(
  new Set(cells(1440, 960, 10, 42, [0], 0.65).map((c) => c.size)).size === 3,
  "Mixed layout includes small, medium and large tiles",
);
assert(
  new Set(a.map((c) => c.size)).size === 1,
  "Zero variation preserves a uniform grid",
);
for (const x of [-40, 0, 40])
  for (const y of [-40, 0, 40]) {
    const flow = gridFlow(1440, 960, x, y);
    const [a, b, c, d, e, f] = flow.matrix;
    assert(a * d - b * c > 0.29, "Grid axes never collapse at angle limits");
    assert(
      Math.abs(a * 720 + c * 480 + e - 720) < 1e-9 &&
        Math.abs(b * 720 + d * 480 + f - 480) < 1e-9,
      "Grid flow stays anchored at canvas center",
    );
    assert(
      Math.abs((Math.atan2(b, a) * 180) / Math.PI - x) < 1e-9 &&
        Math.abs((Math.atan2(c, d) * 180) / Math.PI - y) < 1e-9,
      "Each control independently sets its axis angle",
    );
    const det = a * d - b * c;
    for (const [px, py] of [
      [0, 0],
      [1440, 0],
      [0, 960],
      [1440, 960],
    ]) {
      const sx = ((px - e) * d - c * (py - f)) / det;
      const sy = (a * (py - f) - b * (px - e)) / det;
      assert(
        sx >= flow.minX - 1e-9 &&
          sx <= flow.maxX + 1e-9 &&
          sy >= flow.minY - 1e-9 &&
          sy <= flow.maxY + 1e-9,
        "Repeat bounds include every visible canvas corner",
      );
    }
  }
const straight = gridFlow(1440, 960, 0, 0);
assert(
  straight.matrix.every((v, i) => v === [1, 0, 0, 1, 0, 0][i]) &&
    straight.minX === 0 &&
    straight.maxY === 960,
  "Zero angles preserve the original grid",
);
const opacityAt = (
  x: number,
  y: number,
  shape = "Left",
  amount = 0.3,
  feather = 0.2,
) => globalIconOpacity(x, y, 100, 100, amount, feather, shape);
assert(
  opacityAt(10, 50) === 0 && opacityAt(15, 50) === 0,
  "Icons within the fade region are completely hidden",
);
assert(
  Math.abs(opacityAt(20, 50) - 0.5) < 1e-9 && opacityAt(25, 50) === 1,
  "Icons recover smoothly to full opacity outside the region",
);
assert(
  opacityAt(0, 0, "Circular", 0) === 1,
  "Zero global fade preserves every icon",
);
assert(
  opacityAt(20, 50, "Left", 0.3, 0) === 1,
  "Zero feather gives a hard region boundary",
);
assert(
  opacityAt(5, 5, "Top left + bottom right") === 0 &&
    opacityAt(95, 95, "Top left + bottom right") === 0 &&
    opacityAt(95, 5, "Top left + bottom right") === 1,
  "Diagonal fade hides the selected corner pair only",
);
assert(
  opacityAt(0, 50, "Circular") === 0 && opacityAt(50, 50, "Circular") === 1,
  "Circular fade hides outside icons and preserves the center",
);
for (const shape of [
  "All edges",
  "Circular",
  "Left",
  "Right",
  "Top",
  "Bottom",
  "Top left + bottom right",
  "Top right + bottom left",
])
  for (const x of [-50, 0, 20, 50, 80, 100, 150])
    for (const amount of [0, 0.3, 1]) {
      const value = opacityAt(x, 50, shape, amount);
      assert(
        Number.isFinite(value) && value >= 0 && value <= 1,
        "Opacity remains valid at control and off-canvas limits",
      );
    }
const pair = defaultPairs[8];
const changed = selectShade(pair, "highlight", secondaryStories[1].shades[4]);
assert(
  changed.highlight === "#0237D4" && changed.background === pair.background,
  "Shade selection changes only its assigned role",
);
const swapped = selectShade(pair, "highlight", pair.background);
assert(
  swapped.highlight === pair.background &&
    swapped.background === pair.highlight,
  "Choosing the other colour swaps the pair instead of hiding the pattern",
);
assert(
  pair.highlight === "#E6EBFB",
  "Selecting shades does not mutate saved pairs",
);
assert(
  colourStories.every(
    (story, i) =>
      story.shades.length ===
        (story.name === "Ink" ? 2 : story.name === "Brand" ? 4 : 9) &&
      story.shades.every((hex) => /^#[0-9A-F]{6}$/.test(hex)) &&
      story.shades.includes(defaultPairs[i].highlight) &&
      story.shades.includes(defaultPairs[i].background),
  ),
  "Every story contains its reference shades and valid default pair",
);
assert(
  defaultPairs[6].highlight === "#FFFFFF" &&
    defaultPairs[6].background === "#000000",
  "Ink uses pure white and pure black",
);
assert(
  colourStories.every((story) =>
    story.name === "Ink"
      ? !story.shades.includes("#150229")
      : story.shades.includes("#150229") &&
        story.labels[story.shades.indexOf("#150229")] === "Midnight",
  ),
  "Midnight is selectable in every non-Ink story only",
);
assert(
  secondaryStories
    .slice(1, 6)
    .every((story) => story.shades.at(-1) === "#150229"),
  "Midnight is the final darkest shade in each colour variation",
);
assert(
  secondaryStories
    .slice(1, 6)
    .every(
      (story, i) =>
        story.shades[7] ===
          ["#08194B", "#31005B", "#294000", "#521A00", "#4B040A"][i] &&
        story.labels[7].endsWith("600") &&
        story.shades.length === story.labels.length,
    ),
  "New 600 shades match the supplied image and have aligned labels",
);
assert(
  primaryStories
    .slice(1, 6)
    .every(
      (story, i) =>
        story.shades[4] ===
        ["#4771EF", "#A853ED", "#8389FF", "#84D5FA", "#98DD9B"][i],
    ),
  "Primary base shades match the new image",
);
assert(
  colourStories.length === 14 &&
    colourStories[8] === secondaryStories[1] &&
    defaultPairs[1].highlight === "#EDF1FD",
  "New primary and original secondary stories remain independently addressable",
);
console.log("Pattern checks passed.");
