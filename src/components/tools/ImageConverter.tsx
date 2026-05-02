import { useState, useCallback } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { convertImage, type ImageFormat, getExtension, loadImage } from "../../utils/image";
import { downloadBlob, formatFileSize } from "../../utils/download";

interface Props {
  fromFormat: string;
  toFormat: string;
  targetMime: ImageFormat;
  accept?: string;
}

export default function ImageConverter({ fromFormat, toFormat, targetMime, accept }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [quality, setQuality] = useState(92);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalInfo, setOriginalInfo] = useState<{ name: string; size: string; dims: string } | null>(null);
  const [resultInfo, setResultInfo] = useState<{ size: string; dims: string } | null>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResultInfo(null);

    const img = await loadImage(f);
    setOriginalInfo({
      name: f.name,
      size: formatFileSize(f.size),
      dims: `${img.naturalWidth} × ${img.naturalHeight}`,
    });

    // Show preview
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleConvert = useCallback(async () => {
    if (!file) return;
    setProcessing(true);
    try {
      const blob = await convertImage(file, targetMime, quality / 100);

      const img = await loadImage(new File([blob], "tmp"));
      setResultInfo({
        size: formatFileSize(blob.size),
        dims: `${img.naturalWidth} × ${img.naturalHeight}`,
      });

      const ext = getExtension(targetMime);
      const baseName = file.name.replace(/\.[^.]+$/, "");
      downloadBlob(blob, `${baseName}.${ext}`);
    } catch (e) {
      alert("Conversion failed: " + (e as Error).message);
    } finally {
      setProcessing(false);
    }
  }, [file, targetMime, quality]);

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
          accept={accept ?? "image/*"}
          onFiles={handleFiles}
          label={`Drop ${fromFormat} files here or click to browse`}
          sublabel={`Supports ${fromFormat} files up to 50MB`}
        />
      ) : (
        <div>
          {/* Preview & Info */}
          <div class="flex flex-col sm:flex-row gap-6 mb-6">
            <div class="flex-shrink-0">
              {preview && (
                <div class="bg-surface-elevated rounded-lg overflow-hidden" style="max-width: 300px; max-height: 200px">
                  <img src={preview} alt="Preview" class="w-full h-full object-contain" style="max-height: 200px" />
                </div>
              )}
            </div>
            <div class="flex-1 space-y-3">
              {originalInfo && (
                <div class="bg-surface-elevated rounded-lg p-4">
                  <div class="text-caption-uppercase text-muted mb-2">Original</div>
                  <div class="text-body-sm text-body">
                    <div><strong>Name:</strong> {originalInfo.name}</div>
                    <div><strong>Size:</strong> {originalInfo.size}</div>
                    <div><strong>Dimensions:</strong> {originalInfo.dims}</div>
                  </div>
                </div>
              )}
              {resultInfo && (
                <div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4">
                  <div class="text-caption-uppercase text-accent-emerald mb-2">Converted</div>
                  <div class="text-body-sm text-body">
                    <div><strong>Size:</strong> {resultInfo.size}</div>
                    <div><strong>Dimensions:</strong> {resultInfo.dims}</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quality slider (for lossy formats) */}
          {targetMime !== "image/png" && (
            <div class="mb-6">
              <label class="flex items-center justify-between text-body-sm text-body mb-2">
                <span class="text-caption-uppercase text-muted">Quality</span>
                <span class="text-primary">{quality}%</span>
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
                <span>Smaller file</span>
                <span>Better quality</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleConvert} disabled={processing}>
              {processing ? "Converting..." : `Convert to ${toFormat}`}
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
