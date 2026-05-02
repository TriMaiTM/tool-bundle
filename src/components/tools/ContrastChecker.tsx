import { useState, useMemo, useCallback } from "preact/hooks";

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const match = hex.replace("#", "").match(/^([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (!match) return null;
  return { r: parseInt(match[1], 16), g: parseInt(match[2], 16), b: parseInt(match[3], 16) };
}

function relativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function contrastRatio(hex1: string, hex2: string): number {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);
  if (!rgb1 || !rgb2) return 0;

  const l1 = relativeLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = relativeLuminance(rgb2.r, rgb2.g, rgb2.b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

interface CheckResult {
  label: string;
  required: number;
  pass: boolean;
}

export default function ContrastChecker() {
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#ffffff");

  const ratio = useMemo(() => contrastRatio(foreground, background), [foreground, background]);

  const checks = useMemo<CheckResult[]>(() => [
    { label: "WCAG AA Normal Text (≥ 4.5:1)", required: 4.5, pass: ratio >= 4.5 },
    { label: "WCAG AA Large Text (≥ 3:1)", required: 3, pass: ratio >= 3 },
    { label: "WCAG AAA Normal Text (≥ 7:1)", required: 7, pass: ratio >= 7 },
    { label: "WCAG AAA Large Text (≥ 4.5:1)", required: 4.5, pass: ratio >= 4.5 },
  ], [ratio]);

  const handleSwap = useCallback(() => {
    const tmp = foreground;
    setForeground(background);
    setBackground(tmp);
  }, [foreground, background]);

  return (
    <div class="space-y-6">
      {/* Color inputs */}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-surface-elevated rounded-lg p-6">
          <label class="text-caption-uppercase text-muted block mb-2">Foreground (Text)</label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              value={foreground}
              onInput={(e) => setForeground((e.target as HTMLInputElement).value)}
              style={{ width: "48px", height: "36px", cursor: "pointer", border: "none", background: "none" }}
            />
            <input
              type="text"
              class="input flex-1"
              value={foreground}
              onInput={(e) => setForeground((e.target as HTMLInputElement).value)}
              maxLength={7}
            />
          </div>
        </div>
        <div class="bg-surface-elevated rounded-lg p-6">
          <label class="text-caption-uppercase text-muted block mb-2">Background</label>
          <div class="flex items-center gap-3">
            <input
              type="color"
              value={background}
              onInput={(e) => setBackground((e.target as HTMLInputElement).value)}
              style={{ width: "48px", height: "36px", cursor: "pointer", border: "none", background: "none" }}
            />
            <input
              type="text"
              class="input flex-1"
              value={background}
              onInput={(e) => setBackground((e.target as HTMLInputElement).value)}
              maxLength={7}
            />
          </div>
        </div>
      </div>

      {/* Swap button */}
      <div class="flex justify-center">
        <button class="btn-secondary text-sm" onClick={handleSwap}>
          ⇄ Swap Foreground & Background
        </button>
      </div>

      {/* Contrast ratio */}
      <div class="bg-surface-elevated rounded-lg p-6 text-center">
        <div class="text-caption-uppercase text-muted mb-2">Contrast Ratio</div>
        <div class="text-display-sm text-primary">{ratio.toFixed(2)}:1</div>
      </div>

      {/* WCAG checks */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">WCAG Compliance</div>
        <div class="space-y-3">
          {checks.map((check) => (
            <div class="flex items-center justify-between p-3 rounded-lg bg-surface-soft">
              <span class="text-body-sm">{check.label}</span>
              <span
                class={`text-body-sm font-semibold ${check.pass ? "text-accent-emerald" : "text-accent-rose"}`}
              >
                {check.pass ? "✓ Pass" : "✗ Fail"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Preview */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Preview</div>
        <div
          class="rounded-lg p-6"
          style={{ backgroundColor: background }}
        >
          <p class="text-body-lg mb-2" style={{ color: foreground, fontSize: "18px", fontWeight: 600 }}>
            Large Text Preview (18px bold)
          </p>
          <p class="text-body" style={{ color: foreground, fontSize: "16px" }}>
            Normal text preview. This is how body text looks with your chosen colors.
            The quick brown fox jumps over the lazy dog.
          </p>
          <p class="text-body mt-2" style={{ color: foreground, fontSize: "12px" }}>
            Small text preview (12px) — harder to read with low contrast.
          </p>
        </div>
      </div>
    </div>
  );
}
