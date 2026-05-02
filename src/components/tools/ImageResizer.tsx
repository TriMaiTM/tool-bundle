import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { resizeImage, loadImage, type ImageFormat } from "../../utils/image";
import { downloadBlob, formatFileSize } from "../../utils/download";

const PRESETS = [
  { label: "Instagram Square", w: 1080, h: 1080 },
  { label: "Instagram Story", w: 1080, h: 1920 },
  { label: "Facebook Cover", w: 820, h: 312 },
  { label: "Twitter Header", w: 1500, h: 500 },
  { label: "YouTube Thumbnail", w: 1280, h: 720 },
  { label: "LinkedIn Post", w: 1200, h: 627 },
  { label: "HD 1080p", w: 1920, h: 1080 },
  { label: "HD 720p", w: 1280, h: 720 },
];

type ResizeMode = "pixels" | "percentage";

export default function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [originalWidth, setOriginalWidth] = useState(0);
  const [originalHeight, setOriginalHeight] = useState(0);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [percentage, setPercentage] = useState(50);
  const [mode, setMode] = useState<ResizeMode>("pixels");
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<ImageFormat>("image/png");
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    const img = await loadImage(f);
    setOriginalWidth(img.naturalWidth);
    setOriginalHeight(img.naturalHeight);
    setWidth(img.naturalWidth);
    setHeight(img.naturalHeight);
    setPercentage(100);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleWidthChange = useCallback(
    (val: number) => {
      setWidth(val);
      if (lockAspect && originalWidth > 0) {
        setHeight(Math.round((val * originalHeight) / originalWidth));
      }
    },
    [lockAspect, originalWidth, originalHeight],
  );

  const handleHeightChange = useCallback(
    (val: number) => {
      setHeight(val);
      if (lockAspect && originalHeight > 0) {
        setWidth(Math.round((val * originalWidth) / originalHeight));
      }
    },
    [lockAspect, originalWidth, originalHeight],
  );

  const handlePercentageChange = useCallback(
    (val: number) => {
      setPercentage(val);
      setWidth(Math.round((originalWidth * val) / 100));
      setHeight(Math.round((originalHeight * val) / 100));
    },
    [originalWidth, originalHeight],
  );

  const applyPreset = useCallback((w: number, h: number) => {
    setWidth(w);
    setHeight(h);
    setMode("pixels");
    setLockAspect(false);
  }, []);

  const handleResize = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const finalW =
        mode === "pixels"
          ? width
          : Math.round((originalWidth * percentage) / 100);
      const finalH =
        mode === "pixels"
          ? height
          : Math.round((originalHeight * percentage) / 100);
      const blob = await resizeImage(
        file,
        finalW,
        finalH,
        format,
        quality / 100,
      );
      const baseName = file.name.replace(/\.[^.]+$/, "");
      const ext = format.split("/")[1];
      downloadBlob(blob, `${baseName}-${finalW}x${finalH}.${ext}`);
    } catch (e) {
      alert("Resize failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [
    file,
    width,
    height,
    percentage,
    mode,
    format,
    quality,
    originalWidth,
    originalHeight,
  ]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setWidth(0);
    setHeight(0);
    setOriginalWidth(0);
    setOriginalHeight(0);
  }, []);

  return (
    <div>
      {!file ? (
        <FileDropZone
          onFiles={handleFiles}
          label="Drop an image here or click to browse"
          sublabel="Supports PNG, JPG, WebP up to 50MB"
        />
      ) : (
        <div>
          {/* Preview */}
          <div class="flex flex-col sm:flex-row gap-6 mb-6">
            <div class="flex-shrink-0">
              {preview && (
                <div
                  class="bg-surface-elevated rounded-lg overflow-hidden"
                  style="max-width: 250px"
                >
                  <img
                    src={preview}
                    alt="Preview"
                    class="w-full h-full object-contain"
                    style="max-height: 180px"
                  />
                </div>
              )}
              <div class="text-caption text-muted mt-2 text-center">
                Original: {originalWidth} × {originalHeight} (
                {formatFileSize(file.size)})
              </div>
            </div>
            <div class="flex-1">
              {/* Mode toggle */}
              <div
                class="flex rounded-md overflow-hidden border border-hairline mb-4"
                style="width: fit-content"
              >
                <button
                  class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "pixels" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
                  onClick={() => setMode("pixels")}
                >
                  By Pixels
                </button>
                <button
                  class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "percentage" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
                  onClick={() => setMode("percentage")}
                >
                  By Percentage
                </button>
              </div>

              {mode === "pixels" ? (
                <div class="space-y-3">
                  <div class="flex items-center gap-3">
                    <div class="flex-1">
                      <label class="text-caption text-muted block mb-1">
                        Width
                      </label>
                      <input
                        type="number"
                        class="input"
                        value={width}
                        onInput={(e) =>
                          handleWidthChange(
                            Number((e.target as HTMLInputElement).value) || 0,
                          )
                        }
                      />
                    </div>
                    <div class="pt-6">
                      <button
                        class={`p-2 rounded-md transition-colors ${lockAspect ? "bg-primary text-on-primary" : "bg-surface-elevated text-muted hover:text-on-dark"}`}
                        onClick={() => setLockAspect(!lockAspect)}
                        title="Lock aspect ratio"
                      >
                        <svg
                          class="w-4 h-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          stroke-width="2"
                        >
                          {lockAspect ? (
                            <>
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </>
                          ) : (
                            <>
                              <rect
                                x="3"
                                y="11"
                                width="18"
                                height="11"
                                rx="2"
                                ry="2"
                              />
                              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                            </>
                          )}
                        </svg>
                      </button>
                    </div>
                    <div class="flex-1">
                      <label class="text-caption text-muted block mb-1">
                        Height
                      </label>
                      <input
                        type="number"
                        class="input"
                        value={height}
                        onInput={(e) =>
                          handleHeightChange(
                            Number((e.target as HTMLInputElement).value) || 0,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label class="flex items-center justify-between text-body-sm mb-2">
                    <span class="text-caption text-muted">Scale</span>
                    <span class="text-primary">{percentage}%</span>
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={percentage}
                    onInput={(e) =>
                      handlePercentageChange(
                        Number((e.target as HTMLInputElement).value),
                      )
                    }
                    class="w-full"
                    style="accent-color: var(--color-primary)"
                  />
                  <div class="text-caption text-muted mt-1">
                    New size: {Math.round((originalWidth * percentage) / 100)} ×{" "}
                    {Math.round((originalHeight * percentage) / 100)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Presets */}
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-2">
              Social Media Presets
            </label>
            <div class="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  class="px-3 py-1.5 bg-surface-elevated text-body-sm text-body rounded-md hover:text-on-dark transition-colors"
                  onClick={() => applyPreset(p.w, p.h)}
                >
                  {p.label} ({p.w}×{p.h})
                </button>
              ))}
            </div>
          </div>

          {/* Output settings */}
          <div class="flex flex-wrap items-center gap-4 mb-6">
            <label class="flex items-center gap-2 text-body-sm">
              <span class="text-caption text-muted">Format:</span>
              <select
                class="input"
                style="width: auto; height: 36px"
                value={format}
                onChange={(e) =>
                  setFormat(
                    (e.target as HTMLSelectElement).value as ImageFormat,
                  )
                }
              >
                <option value="image/png">PNG</option>
                <option value="image/jpeg">JPG</option>
                <option value="image/webp">WebP</option>
              </select>
            </label>
            {format !== "image/png" && (
              <label class="flex items-center gap-2 text-body-sm">
                <span class="text-caption text-muted">Quality:</span>
                <span class="text-primary">{quality}%</span>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={quality}
                  onInput={(e) =>
                    setQuality(Number((e.target as HTMLInputElement).value))
                  }
                  style="width: 120px; accent-color: var(--color-primary)"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button
              class="btn-primary"
              onClick={handleResize}
              disabled={processing}
            >
              {processing ? "Resizing..." : "Resize & Download"}
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
