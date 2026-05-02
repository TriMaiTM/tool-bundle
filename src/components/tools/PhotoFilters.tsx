import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { loadImage, canvasToBlob, getExtension, type ImageFormat } from "../../utils/image";
import { downloadBlob } from "../../utils/download";

interface FilterPreset {
  name: string;
  filter: string;
}

const FILTER_PRESETS: FilterPreset[] = [
  { name: "Original", filter: "none" },
  { name: "Grayscale", filter: "grayscale(100%)" },
  { name: "Sepia", filter: "sepia(100%)" },
  { name: "Vintage", filter: "sepia(40%) contrast(120%) brightness(90%)" },
  { name: "Warm", filter: "saturate(150%) hue-rotate(-10deg)" },
  { name: "Cool", filter: "saturate(120%) hue-rotate(20deg)" },
  { name: "Dramatic", filter: "contrast(150%) brightness(80%) saturate(130%)" },
  { name: "Fade", filter: "contrast(80%) brightness(110%) saturate(80%)" },
  { name: "Noir", filter: "grayscale(100%) contrast(130%) brightness(90%)" },
];

interface ManualAdjustments {
  brightness: number;
  contrast: number;
  saturation: number;
  hueRotate: number;
  blur: number;
  grayscale: number;
  sepia: number;
}

const DEFAULT_ADJUSTMENTS: ManualAdjustments = {
  brightness: 100,
  contrast: 100,
  saturation: 100,
  hueRotate: 0,
  blur: 0,
  grayscale: 0,
  sepia: 0,
};

function buildFilterString(adj: ManualAdjustments): string {
  return [
    `brightness(${adj.brightness}%)`,
    `contrast(${adj.contrast}%)`,
    `saturate(${adj.saturation}%)`,
    `hue-rotate(${adj.hueRotate}deg)`,
    adj.blur > 0 ? `blur(${adj.blur}px)` : "",
    adj.grayscale > 0 ? `grayscale(${adj.grayscale}%)` : "",
    adj.sepia > 0 ? `sepia(${adj.sepia}%)` : "",
  ]
    .filter(Boolean)
    .join(" ");
}

export default function PhotoFilters() {
  const [file, setFile] = useState<File | null>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [selectedPreset, setSelectedPreset] = useState(0);
  const [adjustments, setAdjustments] = useState<ManualAdjustments>({ ...DEFAULT_ADJUSTMENTS });
  const [useManual, setUseManual] = useState(false);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const thumbCanvases = useRef<(HTMLCanvasElement | null)[]>([]);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setSelectedPreset(0);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setUseManual(false);

    const img = await loadImage(f);
    setImage(img);
  }, []);

  const getActiveFilter = useCallback((): string => {
    if (useManual) {
      return buildFilterString(adjustments);
    }
    return FILTER_PRESETS[selectedPreset]?.filter ?? "none";
  }, [useManual, adjustments, selectedPreset]);

  // Render main preview
  useEffect(() => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d")!;
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const filter = getActiveFilter();
    ctx.filter = filter === "none" ? "none" : filter;
    ctx.drawImage(image, 0, 0);
    ctx.filter = "none";
  }, [image, getActiveFilter]);

  // Render thumbnail previews for each preset
  useEffect(() => {
    if (!image) return;

    FILTER_PRESETS.forEach((preset, i) => {
      const canvas = thumbCanvases.current[i];
      if (!canvas) return;

      const ctx = canvas.getContext("2d")!;
      canvas.width = 80;
      canvas.height = 80;

      ctx.clearRect(0, 0, 80, 80);
      ctx.filter = preset.filter === "none" ? "none" : preset.filter;

      // Cover the 80x80 area
      const scale = Math.max(80 / image.naturalWidth, 80 / image.naturalHeight);
      const w = image.naturalWidth * scale;
      const h = image.naturalHeight * scale;
      const x = (80 - w) / 2;
      const y = (80 - h) / 2;

      ctx.drawImage(image, x, y, w, h);
      ctx.filter = "none";
    });
  }, [image]);

  const handleDownload = useCallback(async () => {
    if (!canvasRef.current || !file) return;
    setProcessing(true);
    try {
      const blob = await canvasToBlob(canvasRef.current, format, quality / 100);
      const ext = getExtension(format);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}-filtered.${ext}`);
    } catch (e) {
      alert("Export failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, format, quality]);

  const handleReset = useCallback(() => {
    setFile(null);
    setImage(null);
    setSelectedPreset(0);
    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
    setUseManual(false);
  }, []);

  const updateAdj = useCallback((key: keyof ManualAdjustments, value: number) => {
    setAdjustments((prev) => ({ ...prev, [key]: value }));
    setUseManual(true);
  }, []);

  return (
    <div>
      {!file ? (
        <FileDropZone
          onFiles={handleFiles}
          label="Drop an image here to apply filters"
          sublabel="Supports PNG, JPG, WebP up to 50MB"
        />
      ) : (
        <div>
          {/* Canvas Preview */}
          <div class="bg-surface-elevated rounded-lg p-4 mb-6" style="overflow: hidden">
            <div class="text-caption-uppercase text-muted mb-3">Preview</div>
            <div style="display: flex; justify-content: center; overflow: auto">
              <canvas
                ref={canvasRef}
                style="max-width: 100%; max-height: 400px; object-fit: contain"
              />
            </div>
          </div>

          {/* Filter Presets */}
          <div class="mb-6">
            <div class="text-caption-uppercase text-muted mb-3">Filters</div>
            <div class="flex flex-wrap gap-3">
              {FILTER_PRESETS.map((preset, i) => (
                <button
                  key={preset.name}
                  class={`rounded-lg overflow-hidden border-2 transition-all ${
                    !useManual && selectedPreset === i
                      ? "border-primary"
                      : "border-hairline hover:border-muted"
                  }`}
                  onClick={() => {
                    setSelectedPreset(i);
                    setUseManual(false);
                  }}
                  style="width: 100px; cursor: pointer; background: transparent; padding: 0"
                >
                  <canvas
                    ref={(el) => { thumbCanvases.current[i] = el; }}
                    width={80}
                    height={80}
                    style="width: 100%; height: 80px; display: block; object-fit: cover"
                  />
                  <div
                    class={`text-caption text-center py-1 ${
                      !useManual && selectedPreset === i ? "text-primary font-semibold" : "text-muted"
                    }`}
                  >
                    {preset.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Manual Adjustments */}
          <div class="bg-surface-elevated rounded-lg p-3 mb-4">
            <div class="flex items-center justify-between mb-3">
              <div class="text-caption-uppercase text-muted">Manual Adjustments</div>
              {useManual && (
                <button
                  class="text-body-sm text-primary hover:text-primary-active transition-colors"
                  onClick={() => {
                    setAdjustments({ ...DEFAULT_ADJUSTMENTS });
                    setUseManual(false);
                  }}
                >
                  Reset Sliders
                </button>
              )}
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
              {([
                { key: "brightness" as const, label: "Brightness", min: 0, max: 200, unit: "%" },
                { key: "contrast" as const, label: "Contrast", min: 0, max: 200, unit: "%" },
                { key: "saturation" as const, label: "Saturation", min: 0, max: 200, unit: "%" },
                { key: "hueRotate" as const, label: "Hue Rotate", min: 0, max: 360, unit: "°" },
                { key: "blur" as const, label: "Blur", min: 0, max: 10, unit: "px" },
                { key: "grayscale" as const, label: "Grayscale", min: 0, max: 100, unit: "%" },
                { key: "sepia" as const, label: "Sepia", min: 0, max: 100, unit: "%" },
              ]).map(({ key, label, min, max, unit }) => (
                <div key={key}>
                  <label class="flex items-center justify-between text-body-sm mb-1">
                    <span class="text-caption-uppercase text-muted">{label}</span>
                    <span class="text-primary font-semibold">{adjustments[key]}{unit}</span>
                  </label>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={key === "blur" ? 0.1 : 1}
                    value={adjustments[key]}
                    onInput={(e) => updateAdj(key, Number((e.target as HTMLInputElement).value))}
                    class="w-full"
                    style="accent-color: var(--color-primary)"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Output Format */}
          <div class="bg-surface-elevated rounded-lg p-3 mb-4">
            <div class="text-caption-uppercase text-muted mb-3">Output</div>
            <div class="flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <label class="text-caption-uppercase text-muted whitespace-nowrap">Format</label>
                <select
                  class="input"
                  style="width: 140px; height: 36px"
                  value={format}
                  onChange={(e) => setFormat((e.target as HTMLSelectElement).value as ImageFormat)}
                >
                  <option value="image/png">PNG</option>
                  <option value="image/jpeg">JPG</option>
                  <option value="image/webp">WebP</option>
                </select>
              </div>
              {format !== "image/png" && (
                <div>
                  <label class="flex items-center justify-between text-body-sm mb-2">
                    <span class="text-caption-uppercase text-muted">Quality</span>
                    <span class="text-primary font-semibold">{quality}%</span>
                  </label>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="1"
                    value={quality}
                    onInput={(e) => setQuality(Number((e.target as HTMLInputElement).value))}
                    class="w-full"
                    style="accent-color: var(--color-primary)"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleDownload} disabled={processing}>
              {processing ? "Exporting..." : "Download Filtered Image"}
            </button>
            <button class="btn-secondary" onClick={handleReset}>
              Choose Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
