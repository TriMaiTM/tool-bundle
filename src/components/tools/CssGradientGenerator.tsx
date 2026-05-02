import { useState, useMemo, useCallback } from "preact/hooks";

type GradientType = "linear" | "radial";
type RadialShape = "circle" | "ellipse";

interface ColorStop {
  color: string;
  position: number;
}

const PRESETS: { name: string; stops: ColorStop[] }[] = [
  { name: "Sunset", stops: [{ color: "#f97316", position: 0 }, { color: "#ec4899", position: 50 }, { color: "#8b5cf6", position: 100 }] },
  { name: "Ocean", stops: [{ color: "#3b82f6", position: 0 }, { color: "#14b8a6", position: 50 }, { color: "#22c55e", position: 100 }] },
  { name: "Midnight", stops: [{ color: "#1e3a5f", position: 0 }, { color: "#581c87", position: 50 }, { color: "#000000", position: 100 }] },
  { name: "Forest", stops: [{ color: "#14532d", position: 0 }, { color: "#86efac", position: 100 }] },
  { name: "Fire", stops: [{ color: "#ef4444", position: 0 }, { color: "#f97316", position: 50 }, { color: "#eab308", position: 100 }] },
  { name: "Pastel", stops: [{ color: "#fda4af", position: 0 }, { color: "#93c5fd", position: 50 }, { color: "#86efac", position: 100 }] },
];

export default function CssGradientGenerator() {
  const [gradientType, setGradientType] = useState<GradientType>("linear");
  const [angle, setAngle] = useState(135);
  const [radialShape, setRadialShape] = useState<RadialShape>("circle");
  const [stops, setStops] = useState<ColorStop[]>([
    { color: "#faff69", position: 0 },
    { color: "#3b82f6", position: 100 },
  ]);
  const [copied, setCopied] = useState(false);

  const addStop = useCallback(() => {
    if (stops.length >= 5) return;
    setStops((prev) => [...prev, { color: "#ffffff", position: 50 }].sort((a, b) => a.position - b.position));
  }, [stops.length]);

  const removeStop = useCallback(
    (index: number) => {
      if (stops.length <= 2) return;
      setStops((prev) => prev.filter((_, i) => i !== index));
    },
    [stops.length],
  );

  const updateStopColor = useCallback((index: number, color: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, color } : s)));
  }, []);

  const updateStopPosition = useCallback((index: number, position: number) => {
    setStops((prev) =>
      prev.map((s, i) => (i === index ? { ...s, position } : s)).sort((a, b) => a.position - b.position),
    );
  }, []);

  const applyPreset = useCallback((preset: (typeof PRESETS)[number]) => {
    setStops(preset.stops.map((s) => ({ ...s })));
  }, []);

  const cssValue = useMemo(() => {
    const stopsStr = stops.map((s) => `${s.color} ${s.position}%`).join(", ");
    if (gradientType === "linear") {
      return `linear-gradient(${angle}deg, ${stopsStr})`;
    }
    return `radial-gradient(${radialShape}, ${stopsStr})`;
  }, [gradientType, angle, radialShape, stops]);

  const cssCode = useMemo(() => `background: ${cssValue};`, [cssValue]);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(cssCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [cssCode]);

  return (
    <div class="space-y-6">
      {/* Gradient type toggle */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="flex flex-wrap items-center gap-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Type</label>
            <div class="flex gap-2">
              <button
                class={gradientType === "linear" ? "btn-primary text-sm" : "btn-secondary text-sm"}
                onClick={() => setGradientType("linear")}
              >
                Linear
              </button>
              <button
                class={gradientType === "radial" ? "btn-primary text-sm" : "btn-secondary text-sm"}
                onClick={() => setGradientType("radial")}
              >
                Radial
              </button>
            </div>
          </div>

          {gradientType === "linear" && (
            <div class="flex-1 min-w-[200px]">
              <label class="text-caption-uppercase text-muted block mb-2">Angle: {angle}°</label>
              <input
                type="range"
                min="0"
                max="360"
                value={angle}
                onInput={(e) => setAngle(parseInt((e.target as HTMLInputElement).value))}
                class="w-full"
              />
              <div class="flex justify-between text-caption text-muted mt-1">
                <span>0°</span>
                <span>360°</span>
              </div>
            </div>
          )}

          {gradientType === "radial" && (
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">Shape</label>
              <div class="flex gap-2">
                <button
                  class={radialShape === "circle" ? "btn-primary text-sm" : "btn-secondary text-sm"}
                  onClick={() => setRadialShape("circle")}
                >
                  Circle
                </button>
                <button
                  class={radialShape === "ellipse" ? "btn-primary text-sm" : "btn-secondary text-sm"}
                  onClick={() => setRadialShape("ellipse")}
                >
                  Ellipse
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Color stops */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-caption-uppercase text-muted">Color Stops ({stops.length}/5)</div>
          <button
            class="btn-secondary text-sm"
            onClick={addStop}
            disabled={stops.length >= 5}
            style={stops.length >= 5 ? "opacity: 0.5; cursor: not-allowed;" : ""}
          >
            + Add Stop
          </button>
        </div>
        <div class="space-y-3">
          {stops.map((stop, index) => (
            <div class="flex items-center gap-3 p-3 rounded-lg bg-surface-soft">
              <input
                type="color"
                value={stop.color}
                onInput={(e) => updateStopColor(index, (e.target as HTMLInputElement).value)}
                style={{ width: "40px", height: "32px", cursor: "pointer", border: "none", background: "none" }}
              />
              <input
                type="text"
                class="input w-24"
                value={stop.color}
                onInput={(e) => updateStopColor(index, (e.target as HTMLInputElement).value)}
                maxLength={7}
              />
              <div class="flex-1">
                <label class="text-caption text-muted">Position: {stop.position}%</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={stop.position}
                  onInput={(e) => updateStopPosition(index, parseInt((e.target as HTMLInputElement).value))}
                  class="w-full"
                />
              </div>
              <button
                class="btn-secondary text-sm"
                onClick={() => removeStop(index)}
                disabled={stops.length <= 2}
                style={stops.length <= 2 ? "opacity: 0.5; cursor: not-allowed;" : ""}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Presets */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Presets</div>
        <div class="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const presetStops = preset.stops.map((s) => `${s.color} ${s.position}%`).join(", ");
            return (
              <button
                class="flex items-center gap-2 px-3 py-2 rounded-lg border border-hairline hover:border-primary transition-colors"
                onClick={() => applyPreset(preset)}
              >
                <div
                  class="w-8 h-8 rounded"
                  style={`background: linear-gradient(90deg, ${presetStops})`}
                />
                <span class="text-body-sm">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Preview</div>
        <div class="rounded-lg overflow-hidden" style={{ height: "200px", background: cssValue }} />
      </div>

      {/* CSS Output */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="flex items-center justify-between mb-3">
          <div class="text-caption-uppercase text-muted">Generated CSS</div>
          <button class="btn-secondary text-sm" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy CSS"}
          </button>
        </div>
        <pre class="code-block rounded-lg p-4 overflow-x-auto" style="font-family: var(--font-mono)">
          {cssCode}
        </pre>
      </div>
    </div>
  );
}
