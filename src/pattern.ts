export const motifs = [
  {
    name: "Calendar",
    path: "M22 23H78Q86 23 86 31V83Q86 91 78 91H22Q14 91 14 83V31Q14 23 22 23ZM29 13H36V32H29ZM64 13H71V32H64ZM29 44H37V52H29ZM46 44H54V52H46ZM63 44H71V52H63ZM29 61H37V69H29ZM46 61H54V69H46ZM63 61H71V69H63ZM29 78H37V84H29ZM46 78H54V84H46ZM63 78H71V84H63Z",
  },
  {
    name: "Checkbox",
    path: "M20 12H80Q90 12 90 22V78Q90 88 80 88H20Q10 88 10 78V22Q10 12 20 12ZM27 48L43 64L75 32L69 26L43 52L33 42Z",
  },
  { name: "Poll", path: "M10 58H29V92H10ZM40 36H59V92H40ZM70 12H89V92H70Z" },
  {
    name: "Pie chart",
    path: "M48 5A45 45 0 1 0 95 52H48ZM54 5V46H95A45 45 0 0 0 54 5Z",
  },
  {
    name: "Person",
    path: "M68 24A18 18 0 1 1 32 24A18 18 0 1 1 68 24ZM5 100A45 45 0 0 1 95 100Z",
  },
  {
    name: "Chat bubble",
    path: "M30 14H70A27 27 0 0 1 70 68H36L13 86L18 65A27 27 0 0 1 30 14Z",
  },
  {
    name: "Typing",
    path: "M30 14H70A27 27 0 0 1 70 68H36L13 86L18 65A27 27 0 0 1 30 14ZM34 40A5 5 0 1 0 24 40A5 5 0 1 0 34 40ZM55 40A5 5 0 1 0 45 40A5 5 0 1 0 55 40ZM76 40A5 5 0 1 0 66 40A5 5 0 1 0 76 40Z",
  },
  {
    name: "Sideways poll",
    path: "M18 12H82A10 10 0 0 1 82 32H18A10 10 0 0 1 18 12ZM18 40H82A10 10 0 0 1 82 60H18A10 10 0 0 1 18 40ZM18 68H82A10 10 0 0 1 82 88H18A10 10 0 0 1 18 68Z",
  },
  {
    name: "Connecting dots",
    path: "M20 75L77 18L80 21L23 78ZM35 77A15 15 0 1 1 5 77A15 15 0 1 1 35 77ZM95 20A15 15 0 1 1 65 20A15 15 0 1 1 95 20Z",
  },
  {
    name: "Question mark",
    path: "M17 31C17 -2 82 -2 82 32C82 53 58 57 58 67H39C39 45 62 45 62 31C62 17 37 17 37 31ZM61 85A12 12 0 1 1 37 85A12 12 0 1 1 61 85Z",
  },
  {
    name: "AI star",
    path: "M50 2Q57 43 98 50Q57 57 50 98Q43 57 2 50Q43 43 50 2Z",
  },
  {
    name: "Semicircle",
    path: "M0 100A50 50 0 0 1 100 100ZM0 0A50 50 0 0 0 100 0Z",
  },
  { name: "Quarter arc", path: "M0 0H100V100A100 100 0 0 1 0 0Z" },
  {
    name: "Connecting tiles",
    path: "M0 0H50A50 50 0 0 1 100 50H50A50 50 0 0 1 0 0ZM0 50H50A50 50 0 0 1 100 100H50A50 50 0 0 1 0 50Z",
  },
  {
    name: "Four dots",
    path: "M42 25A17 17 0 1 1 8 25A17 17 0 1 1 42 25ZM92 25A17 17 0 1 1 58 25A17 17 0 1 1 92 25ZM42 75A17 17 0 1 1 8 75A17 17 0 1 1 42 75ZM92 75A17 17 0 1 1 58 75A17 17 0 1 1 92 75Z",
  },
  { name: "Square", path: "M8 8H92V92H8Z" },
];
export function random(seed: number) {
  let a = seed | 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function isCellDropped(
  seed: number,
  column: number,
  row: number,
  amount: number,
) {
  return random((seed ^ 0x517cc1b7) + column * 73 + row * 101)() < amount;
}
export function globalIconOpacity(
  x: number,
  y: number,
  width: number,
  height: number,
  amount: number,
  feather: number,
  shape: string,
) {
  if (amount <= 0) return 1;
  const nx = x / width,
    ny = y / height;
  let distance: number;
  if (shape === "Circular") {
    distance =
      1 -
      Math.hypot(x - width / 2, y - height / 2) / (Math.min(width, height) / 2);
  } else if (shape.includes(" + ")) {
    const px = shape === "Top right + bottom left" ? width - x : x;
    const projection =
      (px * width + y * height) / (width * width + height * height);
    distance = 2 * Math.min(projection, 1 - projection);
  } else {
    const sides: Record<string, number> = {
      Left: nx,
      Right: 1 - nx,
      Top: ny,
      Bottom: 1 - ny,
    };
    distance =
      2 *
      (shape === "All edges"
        ? Math.min(...Object.values(sides))
        : (sides[shape] ?? 0));
  }
  if (distance <= amount) return 0;
  const transition = Math.min(feather, 1 - amount);
  if (transition <= 0) return 1;
  const t = Math.min(1, (distance - amount) / transition);
  return t * t * (3 - 2 * t);
}
export function gridFlow(
  width: number,
  height: number,
  xAngle: number,
  yAngle: number,
) {
  // Keep both axes distinct even at the slider limits.
  const slope = (angle: number) =>
    Math.tan((Math.max(-40, Math.min(40, angle)) * Math.PI) / 180);
  const b = slope(xAngle),
    c = slope(yAngle);
  const e = (-c * height) / 2,
    f = (-b * width) / 2;
  const determinant = 1 - b * c;
  const corners = [
    [0, 0],
    [width, 0],
    [0, height],
    [width, height],
  ].map(([x, y]) => [
    (x - e - c * (y - f)) / determinant,
    (y - f - b * (x - e)) / determinant,
  ]);
  return {
    matrix: [1, b, c, 1, e, f] as [
      number,
      number,
      number,
      number,
      number,
      number,
    ],
    minX: Math.min(...corners.map(([x]) => x)),
    maxX: Math.max(...corners.map(([x]) => x)),
    minY: Math.min(...corners.map(([, y]) => y)),
    maxY: Math.max(...corners.map(([, y]) => y)),
  };
}
export function cells(
  width: number,
  height: number,
  columns: number,
  seed: number,
  selected: number[],
  variation = 0,
) {
  const rng = random(seed);
  const size = width / columns;
  const rows = Math.ceil(height / size);
  const base = Array.from({ length: columns * rows }, (_, i) => ({
    column: i % columns,
    row: Math.floor(i / columns),
    x: (i % columns) * size,
    y: Math.floor(i / columns) * size,
    size,
    motif: selected[Math.floor(rng() * selected.length)] ?? 15,
    invert: rng() > 0.73,
    rotation: Math.floor(rng() * 4),
    value: rng(),
  }));
  const occupied = new Uint8Array(base.length);
  const layout = random(seed ^ 0x2f8c7431);
  const result: typeof base = [];
  for (const tile of base) {
    if (occupied[tile.row * columns + tile.column]) continue;
    const roll = layout();
    let span = roll < variation * 0.35 ? 3 : roll < variation ? 2 : 1;
    const fits = (n: number) => {
      if (tile.column + n > columns || tile.row + n > rows) return false;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++)
          if (occupied[(tile.row + y) * columns + tile.column + x])
            return false;
      return true;
    };
    while (!fits(span)) span--;
    for (let y = 0; y < span; y++)
      for (let x = 0; x < span; x++)
        occupied[(tile.row + y) * columns + tile.column + x] = 1;
    result.push({ ...tile, size: size * span });
  }
  return result;
}
