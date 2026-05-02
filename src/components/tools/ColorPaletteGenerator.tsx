import { useState, useMemo, useCallback } from "preact/hooks";

type PaletteType = "complementary" | "triadic" | "analogous" | "monochromatic" | "split-complementary";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return { h: 0, s: 0, l: 0 };
  let r = parseInt(match[1], 16) / 255;
  let g = parseInt(match[2], 16) / 255;
  let b = parseInt(match[3], 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  s = Math.max(0, Math.min(100, s));
  l = Math.max(0, Math.min(100, l));
  const hNorm = h / 360;
  const sNorm = s / 100;
  const lNorm = l / 100;

  let r: number;
  let g: number;
  let b: number;

  if (sNorm === 0) {
    r = g = b = lNorm;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = lNorm < 0.5 ? lNorm * (1 + sNorm) : lNorm + sNorm - lNorm * sNorm;
    const p = 2 * lNorm - q;
    r = hue2rgb(p, q, hNorm + 1 / 3);
    g = hue2rgb(p, q, hNorm);
    b = hue2rgb(p, q, hNorm - 1 / 3);
  }

  return "#" + [r, g, b].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}

function generatePalette(baseHex: string, type: PaletteType): string[] {
  const { h, s, l } = hexToHsl(baseHex);

  switch (type) {
    case "complementary":
      return [baseHex, hslToHex((h + 180) % 360, s, l)];
    case "triadic":
      return [baseHex, hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l)];
    case "analogous":
      return [
        hslToHex(h - 60, s, l),
        hslToHex(h - 30, s, l),
        baseHex,
        hslToHex((h + 30) % 360, s, l),
        hslToHex((h + 60) % 360, s, l),
      ];
    case "monochromatic":
      return [
        hslToHex(h, s, Math.max(l - 30, 5)),
        hslToHex(h, s, Math.max(l - 15, 10)),
        baseHex,
        hslToHex(h, s, Math.min(l + 15, 90)),
        hslToHex(h, s, Math.min(l + 30, 95)),
      ];
    case "split-complementary":
      return [baseHex, hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l)];
    default:
      return [baseHex];
  }
}

const PALETTE_TYPES: { key: PaletteType; label: string }[] = [
  { key: "complementary", label: "Complementary" },
  { key: "triadic", label: "Triadic" },
  { key: "analogous", label: "Analogous" },
  { key: "monochromatic", label: "Monochromatic" },
  { key: "split-complementary", label: "Split Complementary" },
];

export default function ColorPaletteGenerator() {
  const [baseColor, setBaseColor] = useState("#3b82f6");
  const [activeType, setActiveType] = useState<PaletteType>("complementary");
  const [copiedColor, setCopiedColor] = useState<string | null>(null);
  const [copiedCSS, setCopiedCSS] = useState(false);

  const palette = useMemo(() => generatePalette(baseColor, activeType), [baseColor, activeType]);

  const cssOutput = useMemo(
    () => palette.map((c, i) => `  --color-${i + 1}: ${c};`).join("\n"),
    [palette],
  );

  const handleCopyColor = useCallback(async (color: string) => {
    await navigator.clipboard.writeText(color);
    setCopiedColor(color);
    setTimeout(() => setCopiedColor(null), 1500);
  }, []);

  const handleCopyCSS = useCallback(async () => {
    const css = `:root {\n${cssOutput}\n}`;
    await navigator.clipboard.writeText(css);
    setCopiedCSS(true);
    setTimeout(() => setCopiedCSS(false), 1500);
  }, [cssOutput]);

  return (
    <div class="space-y-6">
      {/* Base color input */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <label class="text-caption-uppercase text-muted block mb-2">Base Color</label>
        <div class="flex items-center gap-4">
          <input
            type="color"
            value={baseColor}
            onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
            style={{ width: "48px", height: "36px", cursor: "pointer", border: "none", background: "none" }}
          />
          <input
            type="text"
            class="input flex-1"
            value={baseColor}
            onInput={(e) => setBaseColor((e.target as HTMLInputElement).value)}
            maxLength={7}
          />
          <div
            class="rounded-lg border-2 border-hairline"
            style={{ width: "48px", height: "36px", backgroundColor: baseColor }}
          />
        </div>
      </div>

      {/* Palette type tabs */}
      <div class="flex flex-wrap gap-2">
        {PALETTE_TYPES.map((pt) => (
          <button
            class={activeType === pt.key ? "btn-primary text-sm" : "btn-secondary text-sm"}
            onClick={() => setActiveType(pt.key)}
          >
            {pt.label}
          </button>
        ))}
      </div>

      {/* Palette swatches */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Generated Palette</div>
        <div class="flex flex-wrap gap-3">
          {palette.map((color) => (
            <button
              class="flex flex-col items-center gap-2 group"
              onClick={() => handleCopyColor(color)}
              title={`Click to copy ${color}`}
            >
              <div
                class="rounded-lg border-2 border-hairline group-hover:border-primary transition-colors"
                style={{ width: "80px", height: "80px", backgroundColor: color, cursor: "pointer" }}
              />
              <code class="text-caption text-muted group-hover:text-primary transition-colors" style="font-family: var(--font-mono)">
                {copiedColor === color ? "Copied!" : color}
              </code>
            </button>
          ))}
        </div>
      </div>

      {/* CSS Variables Output */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-caption-uppercase text-muted">CSS Variables</div>
          <button class="btn-secondary text-sm" onClick={handleCopyCSS}>
            {copiedCSS ? "Copied!" : "Copy CSS"}
          </button>
        </div>
        <pre class="code-block rounded-lg p-4 overflow-x-auto" style="font-family: var(--font-mono)">
          {`:root {\n${cssOutput}\n}`}
        </pre>
      </div>
    </div>
  );
}
