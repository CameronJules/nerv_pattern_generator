import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { DialRoot, useDialKitController } from "dialkit";
import {
  ArrowUpRight,
  Download,
  Shuffle,
  Grid2X2,
  Box,
  Check,
  RotateCcw,
  Pause,
  Play,
  Upload,
  Maximize2,
  ChevronDown,
} from "lucide-react";
import {
  motifs,
  cells,
  random,
  isCellDropped,
  gridFlow,
  globalIconOpacity,
} from "./pattern";
import {
  colourStories as palettes,
  defaultPairs,
  selectShade,
  type ColourPair,
} from "./colours";
import "dialkit/styles.css";
import "./style.css";
const fadeShapes = [
  "All edges",
  "Top left + bottom right",
  "Top right + bottom left",
  "Circular",
  "Top",
  "Bottom",
  "Left",
  "Right",
];
function createFadeOverlay(
  width: number,
  height: number,
  amount: number,
  shape: string,
  background: string,
) {
  const overlay = document.createElement("canvas");
  overlay.width = width;
  overlay.height = height;
  if (amount === 0) return overlay;
  const ctx = overlay.getContext("2d")!;
  const paint = (gradient: CanvasGradient) => {
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  };
  if (shape === "Circular") {
    const radius = Math.min(width, height) / 2;
    const gradient = ctx.createRadialGradient(
      width / 2,
      height / 2,
      radius * (1 - amount),
      width / 2,
      height / 2,
      radius,
    );
    gradient.addColorStop(0, "transparent");
    gradient.addColorStop(1, background);
    paint(gradient);
  } else if (shape.includes(" + ")) {
    const reverse = shape === "Top right + bottom left";
    const gradient = ctx.createLinearGradient(
      reverse ? width : 0,
      0,
      reverse ? 0 : width,
      height,
    );
    gradient.addColorStop(0, background);
    gradient.addColorStop(amount / 2, "transparent");
    gradient.addColorStop(1 - amount / 2, "transparent");
    gradient.addColorStop(1, background);
    paint(gradient);
  } else {
    const sides: [string, number, number, number, number][] = [
      ["Left", 0, 0, (width * amount) / 2, 0],
      ["Right", width, 0, width * (1 - amount / 2), 0],
      ["Top", 0, 0, 0, (height * amount) / 2],
      ["Bottom", 0, height, 0, height * (1 - amount / 2)],
    ];
    for (const [side, x0, y0, x1, y1] of sides) {
      if (shape !== "All edges" && shape !== side) continue;
      const gradient = ctx.createLinearGradient(x0, y0, x1, y1);
      gradient.addColorStop(0, background);
      gradient.addColorStop(1, "transparent");
      paint(gradient);
    }
  }
  return overlay;
}
function App() {
  const [mode, setMode] = useState<"pattern" | "object">("pattern");
  const [selected, setSelected] = useState([
    0, 1, 2, 3, 4, 6, 7, 8, 10, 11, 12, 13, 14,
  ]);
  const [seed, setSeed] = useState(42);
  const [palette, setPalette] = useState(0);
  const [pairs, setPairs] = useState(defaultPairs);
  const [playing, setPlaying] = useState(
    () => !window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const [asset, setAsset] = useState("Suspension bridge");
  const [status, setStatus] = useState("");
  const [ratio, setRatio] = useState("3:2");
  const canvas = useRef<HTMLCanvasElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const source = useRef<HTMLImageElement | null>(null);
  const scene = useRef<ReturnType<
    typeof import("./object").createObjectScene
  > | null>(null);
  const angle = useRef(-0.35);
  const controls = useDialKitController("Composition", {
    density: [10, 4, 30, 1],
    size: [1, 0.2, 1.4, 0.01],
    sizeVariation: [0.65, 0, 1, 0.01],
    GridFlow: {
      xAngle: [0, -40, 40, 1],
      yAngle: [0, -40, 40, 1],
    },
    opacity: [1, 0, 1, 0.01],
    globalFade: [0.3, 0, 1, 0.01],
    globalFeather: [0.2, 0, 1, 0.01],
    globalFadeShape: {
      type: "select",
      options: fadeShapes,
      default: "All edges",
    },
    CellStyle: {
      _collapsed: true,
      tileBackgrounds: false,
      cellFade: [0, 0, 1, 0.01],
      cellFadeShape: {
        type: "select",
        options: fadeShapes,
        default: "All edges",
      },
    },
    dropCells: [0, 0, 1, 0.01],
    grain: [0.12, 0, 0.4, 0.01],
    Object: {
      _collapsed: true,
      cellSize: [12, 4, 40, 1],
      abstraction: [0.65, 0, 1, 0.01],
      rotation: [-20, -180, 180, 1],
      speed: [0.2, 0, 1, 0.01],
    },
    Colours: {
      _collapsed: true,
      highlight: { type: "color", default: defaultPairs[0].highlight },
      background: { type: "color", default: defaultPairs[0].background },
    },
  });
  const p = controls.values;
  const [sceneReady, setSceneReady] = useState(0);
  useEffect(() => {
    if (mode !== "object" || scene.current || source.current) return;
    let canceled = false;
    import("./object").then(({ createObjectScene }) => {
      if (canceled) return;
      try {
        scene.current = createObjectScene();
        setSceneReady((v) => v + 1);
      } catch {
        setStatus(
          "3D is unavailable in this browser. You can still import an image.",
        );
      }
    });
    return () => {
      canceled = true;
    };
  }, [mode]);
  useEffect(() => () => scene.current?.dispose(), []);
  useEffect(() => {
    const c = canvas.current!;
    const ctx = c.getContext("2d")!;
    let frame = 0;
    let last = 0;
    const width = 1440,
      height = ratio === "1:1" ? 1440 : ratio === "16:9" ? 810 : 960;
    c.width = width;
    c.height = height;
    const paths = motifs.map((m) => new Path2D(m.path));
    const sample = document.createElement("canvas");
    sample.width = 600;
    sample.height = 400;
    const sc = sample.getContext("2d", { willReadFrequently: true })!;
    const noise = document.createElement("canvas");
    noise.width = 256;
    noise.height = 256;
    const nc = noise.getContext("2d")!;
    const data = nc.createImageData(256, 256);
    const rng = random(seed);
    for (let i = 0; i < data.data.length; i += 4) {
      const v = rng() > 0.5 ? 255 : 0;
      data.data[i] = data.data[i + 1] = data.data[i + 2] = v;
      data.data[i + 3] = rng() * 90;
    }
    nc.putImageData(data, 0, 0);
    const cellOverlay = createFadeOverlay(
      256,
      256,
      p.CellStyle.cellFade,
      p.CellStyle.cellFadeShape,
      p.Colours.background,
    );
    const iconOpacity = (x: number, y: number) =>
      globalIconOpacity(
        x,
        y,
        width,
        height,
        p.globalFade,
        p.globalFeather,
        p.globalFadeShape,
      );
    const tiles = cells(
      width,
      height,
      Math.round(p.density),
      seed,
      selected,
      p.sizeVariation,
    );
    const flow = gridFlow(width, height, p.GridFlow.xAngle, p.GridFlow.yAngle);
    const unit = width / Math.round(p.density);
    const repeatHeight = Math.ceil(height / unit) * unit;
    const draw = (now: number) => {
      const elapsed = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.Colours.background;
      ctx.fillRect(0, 0, width, height);
      if (mode === "pattern") {
        ctx.save();
        ctx.transform(...flow.matrix);
        // Repeat the complete layout to cover corners exposed by the angled grid.
        for (
          let row = Math.floor(flow.minY / repeatHeight);
          row < Math.ceil(flow.maxY / repeatHeight);
          row++
        )
          for (
            let column = Math.floor(flow.minX / width);
            column < Math.ceil(flow.maxX / width);
            column++
          ) {
            ctx.save();
            ctx.translate(column * width, row * repeatHeight);
            for (const tile of tiles) {
              if (isCellDropped(seed, tile.column, tile.row, p.dropCells))
                continue;
              const cx = column * width + tile.x + tile.size / 2;
              const cy = row * repeatHeight + tile.y + tile.size / 2;
              const [a, b, c, d, e, f] = flow.matrix;
              const visibility = iconOpacity(
                a * cx + c * cy + e,
                b * cx + d * cy + f,
              );
              if (visibility === 0) continue;
              ctx.save();
              ctx.translate(tile.x, tile.y);
              ctx.beginPath();
              ctx.rect(0, 0, tile.size, tile.size);
              ctx.clip();
              ctx.globalAlpha = p.opacity;
              const inverted = p.CellStyle.tileBackgrounds && tile.invert;
              if (inverted) {
                ctx.fillStyle = p.Colours.highlight;
                ctx.fillRect(0, 0, tile.size, tile.size);
              }
              ctx.fillStyle = inverted
                ? p.Colours.background
                : p.Colours.highlight;
              ctx.save();
              ctx.translate(tile.size / 2, tile.size / 2);
              if (tile.motif >= 11 && tile.motif <= 13)
                ctx.rotate((tile.rotation * Math.PI) / 2);
              ctx.scale((tile.size / 100) * p.size, (tile.size / 100) * p.size);
              ctx.translate(-50, -50);
              ctx.fill(paths[tile.motif], "evenodd");
              ctx.restore();
              if (p.CellStyle.cellFade > 0) {
                ctx.globalAlpha = 1;
                ctx.drawImage(cellOverlay, 0, 0, tile.size, tile.size);
              }
              if (visibility < 1) {
                ctx.globalAlpha = 1 - visibility;
                ctx.fillStyle = p.Colours.background;
                ctx.fillRect(0, 0, tile.size, tile.size);
              }
              ctx.restore();
            }
            ctx.restore();
          }
        ctx.restore();
      } else {
        sc.clearRect(0, 0, 600, 400);
        if (source.current) {
          const im = source.current;
          const scale = Math.min(540 / im.width, 350 / im.height);
          sc.drawImage(
            im,
            (600 - im.width * scale) / 2,
            (400 - im.height * scale) / 2,
            im.width * scale,
            im.height * scale,
          );
        } else if (scene.current) {
          if (playing) angle.current += elapsed * p.Object.speed;
          sc.drawImage(
            scene.current.render(
              angle.current + (p.Object.rotation * Math.PI) / 180,
            ),
            0,
            0,
          );
        }
        const pixels = sc.getImageData(0, 0, 600, 400).data;
        const step =
          (2 + (p.Object.cellSize - 2) * p.Object.abstraction) *
          (1.5 - p.density / 30);
        const scale = Math.min(width / 600, height / 400);
        const ox = (width - 600 * scale) / 2,
          oy = (height - 400 * scale) / 2;
        for (let y = 0; y < 400; y += step)
          for (let x = 0; x < 600; x += step) {
            if (
              isCellDropped(
                seed,
                Math.round(x / step),
                Math.round(y / step),
                p.dropCells,
              )
            )
              continue;
            const ix =
              (Math.min(399, Math.floor(y + step / 2)) * 600 +
                Math.min(599, Math.floor(x + step / 2))) *
              4;
            const alpha = pixels[ix + 3] / 255;
            const luminance =
              (pixels[ix] * 0.2126 +
                pixels[ix + 1] * 0.7152 +
                pixels[ix + 2] * 0.0722) /
              255;
            const strength = alpha * (0.25 + 0.75 * luminance);
            if (strength < 0.06) continue;
            const r = random(seed + Math.floor(x) * 73 + Math.floor(y) * 101)();
            const shape = selected[Math.floor(r * selected.length)] ?? 15;
            const s =
              step *
              scale *
              p.size *
              (1 -
                p.Object.abstraction +
                p.Object.abstraction * Math.max(0.25, strength));
            const visibility = iconOpacity(
              ox + (x + step / 2) * scale,
              oy + (y + step / 2) * scale,
            );
            if (visibility === 0) continue;
            ctx.save();
            ctx.globalAlpha = p.opacity * alpha * visibility;
            ctx.fillStyle = p.Colours.highlight;
            ctx.translate(
              ox + (x + step / 2) * scale - s / 2,
              oy + (y + step / 2) * scale - s / 2,
            );
            ctx.scale(s / 100, s / 100);
            if (p.Object.abstraction < 0.12) ctx.fillRect(0, 0, 100, 100);
            else ctx.fill(paths[shape], "evenodd");
            ctx.restore();
          }
      }
      if (p.grain) {
        ctx.globalAlpha = p.grain;
        ctx.fillStyle = ctx.createPattern(noise, "repeat")!;
        ctx.fillRect(0, 0, width, height);
      }
      ctx.globalAlpha = 1;
      if (mode === "object" && playing && !source.current)
        frame = requestAnimationFrame(draw);
    };
    draw(performance.now());
    return () => cancelAnimationFrame(frame);
  }, [p, mode, selected, seed, playing, ratio, sceneReady]);
  async function importFile(file?: File) {
    if (!file) return;
    setStatus("Loading asset…");
    try {
      if (file.size > 50 * 1024 * 1024)
        throw Error("Please use an asset smaller than 50 MB.");
      if (/\.(glb|gltf)$/i.test(file.name)) {
        if (!scene.current) {
          const { createObjectScene } = await import("./object");
          scene.current = createObjectScene();
        }
        await scene.current.load(file);
        source.current = null;
      } else if (
        ["image/png", "image/jpeg", "image/webp"].includes(file.type)
      ) {
        const url = URL.createObjectURL(file);
        try {
          const im = new Image();
          im.src = url;
          await im.decode();
          source.current = im;
        } finally {
          URL.revokeObjectURL(url);
        }
      } else
        throw Error(
          "Choose a PNG, JPG, WebP, GLB, or self-contained GLTF file.",
        );
      setAsset(file.name);
      setMode("object");
      setSceneReady((v) => v + 1);
      setStatus("Asset ready");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Could not load asset.");
    }
  }
  function choosePalette(i: number) {
    if (i === palette) return;
    setPairs((current) =>
      current.map((pair, index) =>
        index === palette
          ? { highlight: p.Colours.highlight, background: p.Colours.background }
          : pair,
      ),
    );
    setPalette(i);
    controls.setValues({ Colours: pairs[i] });
  }
  function chooseShade(role: keyof ColourPair, colour: string) {
    const pair = selectShade(p.Colours, role, colour);
    setPairs((current) =>
      current.map((value, index) => (index === palette ? pair : value)),
    );
    controls.setValues({ Colours: pair });
  }
  function exportImage() {
    canvas.current?.toBlob((blob) => {
      if (!blob) {
        setStatus("Export failed. Please try again.");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nervant-${mode}-${seed}.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("PNG exported");
    });
  }
  return (
    <div className="app">
      <main>
        <section className="workspace">
          <div className="stage-toolbar">
            <div className="segmented">
              <button
                className={mode === "pattern" ? "active" : ""}
                onClick={() => setMode("pattern")}
              >
                <Grid2X2 size={14} /> Pattern
              </button>
              <button
                className={mode === "object" ? "active" : ""}
                onClick={() => setMode("object")}
              >
                <Box size={14} /> Object
              </button>
            </div>
            <div className="canvas-meta">
              <span>
                {mode === "pattern" ? "PROCEDURAL CANVAS" : asset.toUpperCase()}
              </span>
              <span className="meta-line" />
              <label>
                <select
                  aria-label="Canvas aspect ratio"
                  value={ratio}
                  onChange={(e) => setRatio(e.target.value)}
                >
                  <option>3:2</option>
                  <option>1:1</option>
                  <option>16:9</option>
                </select>
                <ChevronDown size={12} />
              </label>
              <button
                title="Fullscreen canvas"
                onClick={() => canvas.current?.requestFullscreen()}
              >
                <Maximize2 size={14} />
              </button>
            </div>
            <button
              className="export"
              onClick={exportImage}
              aria-label="Export PNG"
            >
              <Download size={15} /> Export PNG <ArrowUpRight size={15} />
            </button>
          </div>
          <div
            className="stage"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              importFile(e.dataTransfer.files[0]);
            }}
          >
            <div
              className="canvas-wrap"
              style={{ aspectRatio: ratio.replace(":", "/") }}
            >
              <canvas
                ref={canvas}
                aria-label="Generated duotone pattern preview"
              />
            </div>
            <div className="stage-caption">
              <span>
                <span className="live-dot" /> LIVE PREVIEW
              </span>
              <span>
                {mode === "pattern"
                  ? `${Math.round(p.density)} COLUMNS · SEED ${seed}`
                  : "DROP AN IMAGE OR 3D MODEL"}
              </span>
            </div>
          </div>
          <div className="under-stage">
            <span>One system. Infinite expressions.</span>
            <div>
              {mode === "object" && (
                <>
                  <button
                    onClick={async () => {
                      try {
                        const { createObjectScene } = await import("./object");
                        const next = createObjectScene();
                        scene.current?.dispose();
                        scene.current = next;
                        source.current = null;
                        setAsset("Suspension bridge");
                        angle.current = -0.35;
                        setSceneReady((v) => v + 1);
                        setStatus("Bridge restored");
                      } catch {
                        setStatus("3D is unavailable in this browser.");
                      }
                    }}
                  >
                    Bridge
                  </button>
                  <button onClick={() => fileInput.current?.click()}>
                    <Upload size={14} /> Import asset
                  </button>
                  <button onClick={() => setPlaying(!playing)}>
                    {playing ? <Pause size={14} /> : <Play size={14} />}{" "}
                    {playing ? "Pause" : "Rotate"}
                  </button>
                </>
              )}
              <button onClick={() => setSeed((s) => s + 1)}>
                <Shuffle size={14} /> Shuffle pattern <kbd>↻</kbd>
              </button>
            </div>
          </div>
          <section className="palette-section">
            <div className="section-label">
              01 <span>COLOUR STORIES</span>
            </div>
            {[
              { title: "Primary", start: 0 },
              { title: "Secondary", start: 7 },
            ].map((group) => (
              <section
                className="palette-group"
                key={group.title}
                aria-label={`${group.title} colour stories`}
              >
                <h3>{group.title}</h3>
                <div className="palettes">
                  {palettes
                    .slice(group.start, group.start + 7)
                    .map((pal, index) => {
                      const i = group.start + index;
                      return (
                        <button
                          key={pal.name}
                          className={
                            "palette " + (palette === i ? "chosen" : "")
                          }
                          onClick={() => choosePalette(i)}
                          aria-pressed={palette === i}
                          aria-label={`${group.title} ${pal.name}`}
                        >
                          <div
                            className="palette-swatch"
                            style={{
                              background: (i === palette ? p.Colours : pairs[i])
                                .background,
                              color: (i === palette ? p.Colours : pairs[i])
                                .highlight,
                            }}
                          >
                            <svg viewBox="0 0 100 100">
                              <path
                                d={
                                  motifs[[10, 12, 6, 13, 3, 4, 13][index]].path
                                }
                                fill="currentColor"
                                fillRule="evenodd"
                              />
                            </svg>
                            <span
                              style={{
                                background: (i === palette
                                  ? p.Colours
                                  : pairs[i]
                                ).highlight,
                                color: (i === palette ? p.Colours : pairs[i])
                                  .background,
                              }}
                            >
                              {palette === i ? <Check size={13} /> : null}
                            </span>
                          </div>
                          <div>
                            {pal.name}
                            <span>0{index + 1}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </section>
            ))}
            <div className="shade-picker">
              {(["highlight", "background"] as const).map((role) => (
                <fieldset key={role}>
                  <legend>
                    {role === "highlight" ? "Foreground" : "Background"}{" "}
                    <code>{p.Colours[role].toUpperCase()}</code>
                  </legend>
                  <div
                    className="shade-row"
                    style={{
                      gridTemplateColumns: `repeat(${palettes[palette].shades.length}, minmax(0, 1fr))`,
                    }}
                  >
                    {palettes[palette].shades.map((colour, index) => (
                      <button
                        key={colour}
                        className="shade"
                        aria-label={`${role === "highlight" ? "Foreground" : "Background"} ${palettes[palette].labels[index]} ${colour}`}
                        aria-pressed={p.Colours[role].toUpperCase() === colour}
                        title={`${palettes[palette].labels[index]} · ${colour}`}
                        onClick={() => chooseShade(role, colour)}
                      >
                        <span style={{ background: colour }}>
                          {p.Colours[role].toUpperCase() === colour && (
                            <span className="shade-check">
                              <Check size={12} />
                            </span>
                          )}
                        </span>
                        <small>{palettes[palette].labels[index]}</small>
                      </button>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </section>
          <section className="motif-options">
            <div className="aside-title">
              <span>Make it yours</span>
              <button
                title="Reset controls"
                onClick={() => {
                  controls.resetValues();
                  setSeed(42);
                  setPalette(0);
                  setPairs(defaultPairs);
                }}
              >
                <RotateCcw size={15} />
              </button>
            </div>
            <section className="motif-section">
              <div className="section-label">
                02 <span>THE BUILDING BLOCKS</span>
                <b>{selected.length}/16</b>
              </div>
              <p>Pick the pieces in your pattern.</p>
              <div className="motif-grid">
                {motifs.map((m, i) => (
                  <button
                    key={m.name}
                    title={m.name}
                    aria-label={m.name}
                    aria-pressed={selected.includes(i)}
                    className={selected.includes(i) ? "selected" : ""}
                    onClick={() =>
                      setSelected((s) =>
                        s.includes(i)
                          ? s.length > 1
                            ? s.filter((v) => v !== i)
                            : s
                          : [...s, i],
                      )
                    }
                  >
                    <svg viewBox="0 0 100 100">
                      <path d={m.path} fill="currentColor" fillRule="evenodd" />
                    </svg>
                    {selected.includes(i) && <span />}
                  </button>
                ))}
              </div>
              <div className="selection-actions">
                <button onClick={() => setSelected(motifs.map((_, i) => i))}>
                  Select all
                </button>
                <button onClick={() => setSelected([10, 11, 12, 13, 14, 15])}>
                  Geometric only
                </button>
              </div>
            </section>
          </section>
          <input
            ref={fileInput}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.glb,.gltf"
            hidden
            onChange={(e) => {
              importFile(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="status" role="status">
            {status}
          </div>
        </section>
      </main>
      <DialRoot theme="dark" defaultOpen productionEnabled />
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
