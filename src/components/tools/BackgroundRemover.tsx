import { useState, useCallback, useEffect } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

type BGStatus = "idle" | "loading-model" | "processing" | "done" | "error";

export default function BackgroundRemover() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<BGStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultBlob, setResultBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
    };
  }, [preview, resultUrl]);

  const handleFiles = useCallback(
    (files: File[]) => {
      const f = files[0];
      if (preview) URL.revokeObjectURL(preview);
      if (resultUrl) URL.revokeObjectURL(resultUrl);
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setResultUrl(null);
      setResultBlob(null);
      setError(null);
      setStatus("idle");
      setProgress(0);
    },
    [preview, resultUrl],
  );

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setStatus("loading-model");
    setProgress(0);
    setError(null);

    try {
      const { pipeline, env } = await import("@huggingface/transformers");

      // Use WASM backend for broader compatibility
      env.backends.onnx.wasm.proxy = true;

      // Load segmentation model — RMBG-1.4 is public (no auth required)
      setStatus("loading-model");
      setProgress(0.1);
      setStatusText("Loading background removal model (~170MB)...");

      let segmenter: any;
      try {
        segmenter = await pipeline("image-segmentation", "briaai/RMBG-1.4", {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.1 + (progressData.progress / 100) * 0.7);
            } else if (progressData.status === "done") {
              setProgress(0.8);
            }
          },
        } as any);
      } catch (loadErr) {
        // Fallback to Xenova's MODNet if RMBG-1.4 fails
        console.warn("RMBG-1.4 failed, trying fallback model:", loadErr);
        setStatusText("Trying fallback model...");
        setProgress(0.3);
        segmenter = await pipeline("image-segmentation", "Xenova/modnet", {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.3 + (progressData.progress / 100) * 0.5);
            } else if (progressData.status === "done") {
              setProgress(0.8);
            }
          },
        } as any);
      }

      setStatus("processing");
      setProgress(0.85);
      setStatusText("Removing background...");

      // Convert file to object URL for the model
      const imageUrl = URL.createObjectURL(file);
      const result = await segmenter(imageUrl);
      URL.revokeObjectURL(imageUrl);

      // Debug: log the raw output structure
      console.log("[BG Remover] pipeline output:", result);

      // The result is [{ score, label, mask: RawImage }]
      if (!result || !Array.isArray(result) || result.length === 0) {
        throw new Error("Model returned no result. Try a different image.");
      }

      // Extract the mask — transformers.js returns { score, label, mask: RawImage }
      const maskRaw = result[0]?.mask ?? result[0];

      if (!maskRaw) {
        throw new Error("No segmentation mask returned.");
      }

      console.log(
        "[BG Remover] mask object:",
        maskRaw,
        "keys:",
        Object.keys(maskRaw),
      );

      // Load original image
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });

      const W = img.naturalWidth;
      const H = img.naturalHeight;

      // Draw original image onto output canvas
      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(img.src);

      // --- Extract mask pixel data ---
      // RawImage has a .toCanvas() method, or we can access .data directly
      let maskPixels: Uint8ClampedArray | Uint8Array;
      let maskW: number;
      let maskH: number;

      if (maskRaw.toCanvas && typeof maskRaw.toCanvas === "function") {
        // RawImage from transformers.js — use toCanvas()
        const maskCanvasEl = maskRaw.toCanvas();
        maskW = maskCanvasEl.width;
        maskH = maskCanvasEl.height;
        const maskCtx = maskCanvasEl.getContext("2d")!;
        const maskImgData = maskCtx.getImageData(0, 0, maskW, maskH);
        maskPixels = maskImgData.data;
        console.log(
          "[BG Remover] mask via toCanvas:",
          maskW,
          "x",
          maskH,
          "pixels:",
          maskPixels.length,
        );
      } else if (maskRaw.data) {
        // Direct pixel data (RGBA)
        maskPixels = maskRaw.data;
        maskW = maskRaw.width || W;
        maskH = maskRaw.height || H;
        console.log(
          "[BG Remover] mask via .data:",
          maskW,
          "x",
          maskH,
          "pixels:",
          maskPixels.length,
        );
      } else {
        throw new Error("Cannot read mask data. Unknown format.");
      }

      // Apply mask to alpha channel of the original image
      const imageData = ctx.getImageData(0, 0, W, H);
      const pixels = imageData.data;

      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const pxIdx = (y * W + x) * 4;

          // Map to mask coordinates (mask may be different resolution)
          const mx = Math.floor((x / W) * maskW);
          const my = Math.floor((y / H) * maskH);
          const mIdx = (my * maskW + mx) * 4;

          // Mask is grayscale: white (255) = foreground, black (0) = background
          // The value is in the RED channel of the RGBA mask data
          const maskValue = maskPixels[mIdx]; // Red channel

          // Set alpha: foreground pixels keep original alpha, background pixels become transparent
          pixels[pxIdx + 3] = maskValue;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error("Failed to create result image"));
          },
          "image/png",
          1,
        );
      });

      setResultBlob(blob);
      setResultUrl(URL.createObjectURL(blob));
      setStatus("done");
      setProgress(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("Unauthorized") || msg.includes("401")) {
        setError(
          "Model access denied. Please try again or use a smaller image.",
        );
      } else if (msg.includes("OOM") || msg.includes("memory")) {
        setError("Out of memory. Try a smaller image (under 2MB).");
      } else {
        setError(`Failed to remove background: ${msg}`);
      }
      setStatus("error");
    }
  }, [file]);

  const handleDownload = useCallback(() => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "no-background.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [resultBlob]);

  const handleReset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    setFile(null);
    setPreview(null);
    setResultUrl(null);
    setResultBlob(null);
    setError(null);
    setStatus("idle");
    setProgress(0);
  }, [preview, resultUrl]);

  const isProcessing = status === "loading-model" || status === "processing";

  return (
    <div>
      {!file && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          label="Drop an image to remove its background"
          sublabel="PNG, JPG, WebP — up to 10MB recommended"
        />
      )}

      {file && (
        <div>
          {/* Preview */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
            <div>
              <div class="text-caption-uppercase text-muted mb-2">Original</div>
              {preview && (
                <div class="bg-surface-elevated rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Original"
                    class="w-full object-contain"
                    style="max-height: 300px"
                  />
                </div>
              )}
              <div class="text-caption text-muted mt-1">
                {formatFileSize(file.size)}
              </div>
            </div>
            <div>
              <div class="text-caption-uppercase text-muted mb-2">Result</div>
              {resultUrl ? (
                <div
                  class="rounded-lg overflow-hidden"
                  style="background: repeating-conic-gradient(#1a1a1a 0% 25%, #2a2a2a 0% 50%) 0 0 / 20px 20px"
                >
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    class="w-full object-contain"
                    style="max-height: 300px"
                  />
                </div>
              ) : (
                <div
                  class="bg-surface-elevated rounded-lg flex items-center justify-center"
                  style="height: 300px"
                >
                  <span class="text-muted text-body-sm">
                    {isProcessing ? "Processing..." : "Result will appear here"}
                  </span>
                </div>
              )}
              {resultBlob && (
                <div class="text-caption text-muted mt-1">
                  {formatFileSize(resultBlob.size)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isProcessing && status !== "done" && (
            <div class="flex flex-wrap gap-3 mb-4">
              <button class="btn-primary" onClick={handleProcess}>
                Remove Background
              </button>
              <button class="btn-secondary" onClick={handleReset}>
                Choose Another Image
              </button>
            </div>
          )}

          {/* Progress */}
          {isProcessing && (
            <div class="mb-6">
              <div class="flex items-center justify-between mb-2">
                <span class="text-body-sm text-body">{statusText}</span>
                <span class="text-body-sm text-primary font-mono">
                  {Math.round(progress * 100)}%
                </span>
              </div>
              <div class="w-full bg-surface-card rounded-full h-2 overflow-hidden">
                <div
                  class="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <p class="text-caption text-muted mt-1">
                First time: model download ~170MB. Subsequent uses are instant.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
              <p class="text-body-sm text-accent-rose">{error}</p>
              <button
                class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
                onClick={handleReset}
              >
                Try again
              </button>
            </div>
          )}

          {/* Result actions */}
          {status === "done" && resultBlob && (
            <div class="flex flex-wrap gap-3">
              <button class="btn-primary" onClick={handleDownload}>
                Download PNG (Transparent)
              </button>
              <button class="btn-secondary" onClick={handleReset}>
                Process Another Image
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
