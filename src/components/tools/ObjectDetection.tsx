import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

type DetectionStatus = "idle" | "loading-model" | "processing" | "done" | "error";

interface Detection {
  label: string;
  score: number;
  box: { xmin: number; ymin: number; xmax: number; ymax: number };
}

const COLORS = [
  "#faff69", "#3b82f6", "#22c55e", "#ef4444", "#a855f7",
  "#f97316", "#06b6d4", "#ec4899", "#14b8a6", "#f59e0b",
];

export default function ObjectDetection() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<DetectionStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFiles = useCallback((files: File[]) => {
    const f = files[0];
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setDetections([]);
    setError(null);
    setStatus("idle");
    setProgress(0);
  }, [preview]);

  // Draw bounding boxes on canvas
  const drawDetections = useCallback(
    (dets: Detection[], img: HTMLImageElement) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d")!;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      dets.forEach((det, i) => {
        const color = COLORS[i % COLORS.length];
        const { xmin, ymin, xmax, ymax } = det.box;
        const w = xmax - xmin;
        const h = ymax - ymin;

        // Draw box
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(xmin, ymin, w, h);

        // Draw label background
        const label = `${det.label} ${(det.score * 100).toFixed(0)}%`;
        ctx.font = "bold 14px Inter, sans-serif";
        const textW = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(xmin, ymin - 24, textW + 12, 24);

        // Draw label text
        ctx.fillStyle = "#0a0a0a";
        ctx.fillText(label, xmin + 6, ymin - 7);
      });
    },
    [],
  );

  // Redraw when detections change
  useEffect(() => {
    if (detections.length > 0 && imgRef.current && imgRef.current.complete) {
      drawDetections(detections, imgRef.current);
    }
  }, [detections, drawDetections]);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    setStatus("loading-model");
    setProgress(0);
    setError(null);
    setDetections([]);

    try {
      const { pipeline } = await import("@huggingface/transformers");

      setStatus("loading-model");
      setProgress(0.1);
      setStatusText("Loading object detection model (~50MB)...");

      const detector = await pipeline(
        "object-detection",
        "Xenova/detr-resnet-50",
        {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.1 + (progressData.progress / 100) * 0.7);
            } else if (progressData.status === "done") {
              setProgress(0.8);
            }
          },
        } as any,
      );

      setStatus("processing");
      setProgress(0.85);
      setStatusText("Detecting objects...");

      const imageUrl = URL.createObjectURL(file);
      const output = await detector(imageUrl, {
        threshold: 0.5,
        percentage: true,
      });
      URL.revokeObjectURL(imageUrl);

      // Convert percentage boxes to pixel coordinates
      const img = imgRef.current;
      if (!img || !img.complete) {
        throw new Error("Image not loaded");
      }

      const dets: Detection[] = (output as any[]).map((item) => ({
        label: item.label,
        score: item.score,
        box: {
          xmin: Math.round(item.box.xmin * img.naturalWidth),
          ymin: Math.round(item.box.ymin * img.naturalHeight),
          xmax: Math.round(item.box.xmax * img.naturalWidth),
          ymax: Math.round(item.box.ymax * img.naturalHeight),
        },
      }));

      setDetections(dets);
      setStatus("done");
      setProgress(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to detect objects. Try a different image.",
      );
      setStatus("error");
    }
  }, [file]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "detection-result.png";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, "image/png");
  }, []);

  const handleCopyLabels = useCallback(async () => {
    if (detections.length === 0) return;
    const text = detections
      .map((d) => `${d.label} (${(d.score * 100).toFixed(1)}%)`)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* ignore */
    }
  }, [detections]);

  const handleReset = useCallback(() => {
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setDetections([]);
    setError(null);
    setStatus("idle");
    setProgress(0);
  }, [preview]);

  const isProcessing = status === "loading-model" || status === "processing";

  return (
    <div>
      {!file && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          label="Drop an image to detect objects"
          sublabel="PNG, JPG, WebP — photos work best"
        />
      )}

      {file && (
        <div>
          {/* Image with canvas overlay */}
          <div class="relative mb-6" style="max-width: 640px">
            <div class="text-caption-uppercase text-muted mb-2">
              {detections.length > 0
                ? `${detections.length} object(s) detected`
                : "Image Preview"}
            </div>
            <div class="bg-surface-elevated rounded-lg overflow-hidden relative">
              {/* Hidden image for sizing */}
              <img
                ref={imgRef}
                src={preview!}
                alt="Uploaded"
                class="w-full object-contain block"
                style="max-height: 500px"
                crossOrigin="anonymous"
                onLoad={() => {
                  // When image loads and we have detections, draw them
                  if (detections.length > 0 && imgRef.current) {
                    drawDetections(detections, imgRef.current);
                  }
                }}
              />
              {/* Canvas overlay for bounding boxes */}
              {detections.length > 0 && (
                <canvas
                  ref={canvasRef}
                  class="absolute inset-0 w-full h-full pointer-events-none"
                  style="object-fit: contain"
                />
              )}
            </div>
            {file && (
              <div class="text-caption text-muted mt-1">
                {formatFileSize(file.size)}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isProcessing && status !== "done" && (
            <div class="flex flex-wrap gap-3 mb-4">
              <button class="btn-primary" onClick={handleProcess}>
                Detect Objects
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
                First time: downloading model (~50MB). Cached after that.
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

          {/* Detection results */}
          {status === "done" && detections.length > 0 && (
            <div class="mb-6">
              <div class="text-caption-uppercase text-muted mb-3">
                Detected Objects
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {detections.map((det, i) => (
                  <div
                    key={i}
                    class="bg-surface-elevated rounded-lg p-3 flex items-center gap-3"
                  >
                    <div
                      class="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ background: COLORS[i % COLORS.length] }}
                    />
                    <div class="flex-1">
                      <span class="text-body-sm text-on-dark font-medium capitalize">
                        {det.label}
                      </span>
                    </div>
                    <span class="text-caption text-muted font-mono">
                      {(det.score * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {status === "done" && detections.length === 0 && (
            <div class="bg-surface-elevated rounded-lg p-4 mb-6 text-center">
              <p class="text-body-sm text-muted">
                No objects detected with confidence &ge; 50%. Try a photo with clear objects.
              </p>
            </div>
          )}

          {/* Result actions */}
          {status === "done" && (
            <div class="flex flex-wrap gap-3">
              {detections.length > 0 && (
                <>
                  <button class="btn-primary" onClick={handleDownload}>
                    Download Annotated Image
                  </button>
                  <button class="btn-secondary" onClick={handleCopyLabels}>
                    Copy Labels
                  </button>
                </>
              )}
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
