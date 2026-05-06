import { useState, useCallback } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface Language {
  code: string;
  name: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "vi", name: "Vietnamese", flag: "🇻🇳" },
  { code: "zh", name: "Chinese", flag: "🇨🇳" },
  { code: "ja", name: "Japanese", flag: "🇯🇵" },
  { code: "ko", name: "Korean", flag: "🇰🇷" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "de", name: "German", flag: "🇩🇪" },
  { code: "es", name: "Spanish", flag: "🇪🇸" },
  { code: "ru", name: "Russian", flag: "🇷🇺" },
];

// Build model name from source-target pair
function getModelId(source: string, target: string): string {
  return `Xenova/opus-mt-${source}-${target}`;
}

// Cache loaded translators per language pair
const translatorCache: Record<string, any> = {};

export default function TextTranslator() {
  const [input, setInput] = useState("");
  const [sourceLang, setSourceLang] = useState("en");
  const [targetLang, setTargetLang] = useState("vi");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;

    if (sourceLang === targetLang) {
      setError("Source and target languages must be different.");
      return;
    }

    setStatus("loading-model");
    setProgress(0);
    setError(null);
    setResult("");
    setCopied(false);

    try {
      const { pipeline } = await import("@huggingface/transformers");
      const cacheKey = `${sourceLang}-${targetLang}`;
      const modelId = getModelId(sourceLang, targetLang);

      // Check cache first
      let translator = translatorCache[cacheKey];

      if (!translator) {
        const srcName = LANGUAGES.find((l) => l.code === sourceLang)?.name;
        const tgtName = LANGUAGES.find((l) => l.code === targetLang)?.name;
        setStatusText(`Loading ${srcName} → ${tgtName} model (~300MB)...`);

        try {
          translator = await pipeline("translation", modelId, {
            progress_callback: (progressData: any) => {
              if (progressData.status === "progress" && progressData.progress) {
                setProgress(0.1 + (progressData.progress / 100) * 0.7);
              } else if (progressData.status === "done") {
                setProgress(0.8);
              }
            },
          } as any);
          translatorCache[cacheKey] = translator;
        } catch (loadErr) {
          const msg =
            loadErr instanceof Error ? loadErr.message : String(loadErr);
          if (msg.includes("not found") || msg.includes("404")) {
            throw new Error(
              `Model for ${srcName} → ${tgtName} is not available. Try a different language pair.`,
            );
          }
          throw loadErr;
        }
      }

      setStatus("processing");
      setProgress(0.85);
      setStatusText("Translating...");

      // Split input into sentences for better translation
      const sentences = input.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [input];
      const translatedParts: string[] = [];

      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        const output = await translator(trimmed);
        const text = Array.isArray(output)
          ? (output[0] as any).translation_text
          : (output as any).translation_text;
        translatedParts.push(text || trimmed);
      }

      setResult(translatedParts.join(" "));
      setStatus("done");
      setProgress(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      setStatus("error");
    }
  }, [input, sourceLang, targetLang]);

  const handleSwapLanguages = useCallback(() => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    if (result) {
      setInput(result);
      setResult("");
      setStatus("idle");
    }
  }, [sourceLang, targetLang, result]);

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

  const isProcessing = status === "loading-model" || status === "processing";
  const srcLang = LANGUAGES.find((l) => l.code === sourceLang);
  const tgtLang = LANGUAGES.find((l) => l.code === targetLang);

  return (
    <div>
      {/* Language selectors — side by side */}
      <div class="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 mb-6">
        {/* Source language */}
        <div class="flex-1">
          <label class="text-caption-uppercase text-muted block mb-1">
            From
          </label>
          <select
            class="input"
            value={sourceLang}
            onChange={(e) => {
              setSourceLang((e.target as HTMLSelectElement).value);
              if (status === "done") {
                setStatus("idle");
                setResult("");
              }
            }}
            disabled={isProcessing}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>

        {/* Swap button */}
        <button
          class="btn-secondary flex-shrink-0 self-center sm:self-end sm:mb-0.5"
          onClick={handleSwapLanguages}
          disabled={isProcessing}
          title="Swap languages"
        >
          ⇄
        </button>

        {/* Target language */}
        <div class="flex-1">
          <label class="text-caption-uppercase text-muted block mb-1">To</label>
          <select
            class="input"
            value={targetLang}
            onChange={(e) => {
              setTargetLang((e.target as HTMLSelectElement).value);
              if (status === "done") {
                setStatus("idle");
                setResult("");
              }
            }}
            disabled={isProcessing}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.flag} {l.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Input + Output side by side on desktop */}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Input */}
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">
            {srcLang?.flag} {srcLang?.name}
          </label>
          <textarea
            class="textarea"
            style="min-height: 200px"
            placeholder={`Enter ${srcLang?.name} text...`}
            value={input}
            onInput={(e) => {
              setInput((e.target as HTMLTextAreaElement).value);
              if (status === "done") {
                setStatus("idle");
                setResult("");
              }
            }}
            disabled={isProcessing}
          />
          <div class="text-caption text-muted mt-1">
            {input.trim().split(/\s+/).filter(Boolean).length} words
          </div>
        </div>

        {/* Output */}
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">
              {tgtLang?.flag} {tgtLang?.name}
            </label>
            {result && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 200px"
            value={result}
            readOnly
            placeholder="Translation will appear here..."
          />
          {result && (
            <div class="text-caption text-muted mt-1">
              {result.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          )}
        </div>
      </div>

      {/* Action */}
      {status !== "done" && (
        <div class="mb-4">
          <button
            class="btn-primary"
            onClick={handleTranslate}
            disabled={
              !input.trim() || isProcessing || sourceLang === targetLang
            }
          >
            {isProcessing ? "Translating..." : "Translate"}
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
            First time: downloading model (~300MB). Cached after that.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
          <p class="text-body-sm text-accent-rose">{error}</p>
          <button
            class="text-body-sm text-primary mt-2 hover:text-primary-active transition-colors"
            onClick={() => {
              setError(null);
              setStatus("idle");
            }}
          >
            Try again
          </button>
        </div>
      )}

      {/* Result actions */}
      {status === "done" && result && (
        <div class="flex flex-wrap gap-3">
          <button class="btn-primary" onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Translation"}
          </button>
          <button
            class="btn-secondary"
            onClick={() => {
              setStatus("idle");
              setResult("");
              setCopied(false);
            }}
          >
            Translate Again
          </button>
        </div>
      )}
    </div>
  );
}
