import { useState, useCallback, useRef, useEffect } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";
import { formatFileSize } from "../../utils/download";

type OCRStatus = "idle" | "loading-engine" | "processing" | "done" | "error";

const LANGUAGES = [
  { code: "eng", name: "English" },
  { code: "vie", name: "Vietnamese" },
  { code: "jpn", name: "Japanese" },
  { code: "kor", name: "Korean" },
  { code: "chi_sim", name: "Chinese (Simplified)" },
  { code: "chi_tra", name: "Chinese (Traditional)" },
  { code: "fra", name: "French" },
  { code: "deu", name: "German" },
  { code: "spa", name: "Spanish" },
  { code: "ita", name: "Italian" },
  { code: "por", name: "Portuguese" },
  { code: "rus", name: "Russian" },
  { code: "ara", name: "Arabic" },
  { code: "tha", name: "Thai" },
  { code: "hin", name: "Hindi" },
];

export default function OcrTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [lang, setLang] = useState("eng");
  const [status, setStatus] = useState<OCRStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const abortRef = useRef(false);

  // Cleanup preview URL
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
    setResult("");
    setConfidence(0);
    setError(null);
    setStatus("idle");
    setProgress(0);
    setCopied(false);
  }, [preview]);

  const handleProcess = useCallback(async () => {
    if (!file) return;
    abortRef.current = false;
    setStatus("loading-engine");
    setProgress(0);
    setError(null);
    setResult("");
    setCopied(false);

    try {
      const { performOCR } = await import("../../utils/ai");

      setStatus("processing");
      const { text, confidence: conf } = await performOCR(
        file,
        lang,
        (p, s) => {
          if (!abortRef.current) {
            setProgress(p);
            setStatusText(s);
          }
        },
      );

      if (abortRef.current) return;

      setResult(text);
      setConfidence(conf);
      setStatus("done");
    } catch (err) {
      if (!abortRef.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to process image. Please try again.",
        );
        setStatus("error");
      }
    }
  }, [file, lang]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = result;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "ocr-result.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [result]);

  const handleReset = useCallback(() => {
    abortRef.current = true;
    if (preview) URL.revokeObjectURL(preview);
    setFile(null);
    setPreview(null);
    setResult("");
    setConfidence(0);
    setError(null);
    setStatus("idle");
    setProgress(0);
    setCopied(false);
  }, [preview]);

  const isProcessing = status === "loading-engine" || status === "processing";

  return (
    <div>
      {/* Drop zone */}
      {!file && (
        <FileDropZone
          accept="image/*"
          onFiles={handleFiles}
          label="Drop an image here to extract text"
          sublabel="PNG, JPG, WebP, BMP, GIF — up to 50MB"
        />
      )}

      {/* File preview & controls */}
      {file && (
        <div>
          {/* Image preview */}
          <div class="flex flex-col sm:flex-row gap-6 mb-6">
            <div class="flex-shrink-0">
              {preview && (
                <div class="bg-surface-elevated rounded-lg overflow-hidden" style="max-width: 400px">
                  <img
                    src={preview}
                    alt="Uploaded"
                    class="w-full object-contain"
                    style="max-height: 300px"
                  />
                </div>
              )}
            </div>
            <div class="flex-1">
              <div class="bg-surface-elevated rounded-lg p-3 mb-3">
                <div class="text-caption-uppercase text-muted mb-2">File Info</div>
                <div class="text-body-sm text-body space-y-1">
                  <div><strong>Name:</strong> {file.name}</div>
                  <div><strong>Size:</strong> {formatFileSize(file.size)}</div>
                  <div><strong>Type:</strong> {file.type}</div>
                </div>
              </div>

              {/* Language selector */}
              <div class="mb-3">
                <label class="text-caption-uppercase text-muted block mb-1">
                  Recognition Language
                </label>
                <select
                  class="input"
                  value={lang}
                  onChange={(e) => setLang((e.target as HTMLSelectElement).value)}
                  disabled={isProcessing}
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          {!isProcessing && status !== "done" && (
            <div class="flex flex-wrap gap-3 mb-4">
              <button class="btn-primary" onClick={handleProcess}>
                Extract Text
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
                <span class="text-body-sm text-body">
                  {status === "loading-engine"
                    ? "Loading OCR engine..."
                    : "Extracting text..."}
                </span>
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
              {statusText && (
                <p class="text-caption text-muted mt-2">{statusText}</p>
              )}
              <p class="text-caption text-muted mt-1">
                First time may take 1-2 minutes to download language data (~4MB)
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

          {/* Result */}
          {status === "done" && result && (
            <div>
              {/* Confidence badge */}
              <div class="flex items-center gap-3 mb-3">
                <span class="text-caption-uppercase text-muted">Confidence</span>
                <span
                  class={`badge ${
                    confidence >= 80
                      ? "badge-green"
                      : confidence >= 50
                        ? "badge-yellow"
                        : "badge-red"
                  }`}
                >
                  {confidence.toFixed(1)}%
                </span>
                <span class="text-caption text-muted">
                  {result.split(/\s+/).filter(Boolean).length} words detected
                </span>
              </div>

              {/* Text output */}
              <div class="mb-4">
                <div class="flex items-center justify-between mb-2">
                  <label class="text-caption-uppercase text-muted">
                    Extracted Text
                  </label>
                  <button
                    class="text-body-sm text-primary hover:text-primary-active transition-colors"
                    onClick={handleCopy}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>
                <textarea
                  class="textarea"
                  style="min-height: 240px"
                  value={result}
                  readOnly
                  placeholder="Extracted text will appear here..."
                />
              </div>

              {/* Actions */}
              <div class="flex flex-wrap gap-3">
                <button class="btn-primary" onClick={handleCopy}>
                  {copied ? "Copied!" : "Copy to Clipboard"}
                </button>
                <button class="btn-secondary" onClick={handleDownload}>
                  Download as .txt
                </button>
                <button class="btn-secondary" onClick={handleReset}>
                  Process Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
