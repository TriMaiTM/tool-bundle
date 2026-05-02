import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { compressImage, loadImage, type ImageFormat } from "../../utils/image";
import { downloadBlob, formatFileSize } from "../../utils/download";

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(70);
  const [maxWidth, setMaxWidth] = useState(0);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<{ size: string; dims: string } | null>(null);
  const [resultInfo, setResultInfo] = useState<{ size: string; saved: string; percent: string } | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResultInfo(null);

    const img = await loadImage(f);
    setOriginalInfo({
      size: formatFileSize(f.size),
      dims: `${img.naturalWidth} × ${img.naturalHeight}`,
    });
    setMaxWidth(img.naturalWidth);
    setPreview(URL.createObjectURL(f));
  }, []);

  const handleCompress = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const result = await compressImage(file, quality / 100, maxWidth > 0 ? maxWidth : undefined);
      const saved = result.originalSize - result.compressedSize;
      const percent = ((saved / result.originalSize) * 100).toFixed(1);

      setResultInfo({
        size: formatFileSize(result.compressedSize),
        saved: formatFileSize(saved),
        percent: saved > 0 ? percent : "0",
      });

      const ext = file.type.split("/")[1] || "jpg";
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(result.blob, `${baseName}-compressed.${ext}`);
    } catch (e) {
      alert("Compression failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, quality, maxWidth]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setOriginalInfo(null);
    setResultInfo(null);
  }, []);

  return (
    <div>
      {!file ? (
        <FileDropZone
          onFiles={handleFiles}
          label="Drop an image here to compress"
          sublabel="Supports PNG, JPG, WebP up to 50MB"
        />
      ) : (
        <div>
          {/* Before / After comparison */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div class="bg-surface-elevated rounded-lg p-4">
              <div class="text-caption-uppercase text-muted mb-3">Original</div>
              {preview && (
                <img src={preview} alt="Original" class="w-full rounded-md mb-3" style="max-height: 200px; object-fit: contain" />
              )}
              {originalInfo && (
                <div class="text-body-sm text-body">
                  <div><strong>Size:</strong> {originalInfo.size}</div>
                  <div><strong>Dimensions:</strong> {originalInfo.dims}</div>
                </div>
              )}
            </div>
            <div class={`rounded-lg p-4 ${resultInfo ? "bg-accent-emerald/10 border border-accent-emerald/30" : "bg-surface-elevated"}`}>
              <div class={`text-caption-uppercase mb-3 ${resultInfo ? "text-accent-emerald" : "text-muted"}`}>Compressed</div>
              {resultInfo ? (
                <div class="text-body-sm text-body">
                  <div class="text-display-sm text-primary mb-2">{resultInfo.percent}%</div>
                  <div><strong>Size:</strong> {resultInfo.size}</div>
                  <div><strong>Saved:</strong> {resultInfo.saved}</div>
                </div>
              ) : (
                <div class="text-body-sm text-muted py-8 text-center">Click Compress to see results</div>
              )}
            </div>
          </div>

          {/* Quality slider */}
          <div class="mb-4">
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
            <div class="flex justify-between text-caption text-muted mt-1">
              <span>More compression</span>
              <span>Better quality</span>
            </div>
          </div>

          {/* Max width */}
          <div class="mb-6">
            <label class="flex items-center gap-3 text-body-sm">
              <span class="text-caption-uppercase text-muted whitespace-nowrap">Max Width (px)</span>
              <input
                type="number"
                class="input"
                style="width: 120px; height: 36px"
                value={maxWidth}
                onInput={(e) => setMaxWidth(Number((e.target as HTMLInputElement).value) || 0)}
                placeholder="Original"
              />
              <span class="text-caption text-muted">Leave 0 for original</span>
            </label>
          </div>

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleCompress} disabled={processing}>
              {processing ? "Compressing..." : "Compress & Download"}
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
