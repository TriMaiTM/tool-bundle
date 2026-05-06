import { useState, useCallback, useRef } from "preact/hooks";

type Status = "idle" | "loading-model" | "processing" | "done" | "error";

interface LangPair {
  id: string;
  label: string;
  model: string;
  source: string;
  target: string;
}

const LANG_PAIRS: LangPair[] = [
  { id: "en-vi", label: "English → Vietnamese", model: "Xenova/opus-mt-en-vi", source: "en", target: "vi" },
  { id: "vi-en", label: "Vietnamese → English", model: "Xenova/opus-mt-vi-en", source: "vi", target: "en" },
  { id: "en-zh", label: "English → Chinese", model: "Xenova/opus-mt-en-zh", source: "en", target: "zh" },
  { id: "zh-en", label: "Chinese → English", model: "Xenova/opus-mt-zh-en", source: "zh", target: "en" },
  { id: "en-ja", label: "English → Japanese", model: "Xenova/opus-mt-en-ja", source: "en", target: "ja" },
  { id: "ja-en", label: "Japanese → English", model: "Xenova/opus-mt-ja-en", source: "ja", target: "en" },
  { id: "en-ko", label: "English → Korean", model: "Xenova/opus-mt-en-ko", source: "en", target: "ko" },
  { id: "ko-en", label: "Korean → English", model: "Xenova/opus-mt-ko-en", source: "ko", target: "en" },
  { id: "en-fr", label: "English → French", model: "Xenova/opus-mt-en-fr", source: "en", target: "fr" },
  { id: "fr-en", label: "French → English", model: "Xenova/opus-mt-fr-en", source: "fr", target: "en" },
  { id: "en-de", label: "English → German", model: "Xenova/opus-mt-en-de", source: "en", target: "de" },
  { id: "de-en", label: "German → English", model: "Xenova/opus-mt-de-en", source: "de", target: "en" },
  { id: "en-es", label: "English → Spanish", model: "Xenova/opus-mt-en-es", source: "en", target: "es" },
  { id: "es-en", label: "Spanish → English", model: "Xenova/opus-mt-es-en", source: "es", target: "en" },
  { id: "en-ru", label: "English → Russian", model: "Xenova/opus-mt-en-ru", source: "en", target: "ru" },
  { id: "ru-en", label: "Russian → English", model: "Xenova/opus-mt-ru-en", source: "ru", target: "en" },
];

// Cache loaded translators per language pair
const translatorCache: Record<string, any> = {};

export default function TextTranslator() {
  const [input, setInput] = useState("");
  const [pairId, setPairId] = useState("en-vi");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTranslate = useCallback(async () => {
    if (!input.trim()) return;
    setStatus("loading-model");
    setProgress(0);
    setError(null);
    setResult("");
    setCopied(false);

    try {
      const { pipeline } = await import("@huggingface/transformers");
      const pair = LANG_PAIRS.find((p) => p.id === pairId)!;

      // Check cache first
      let translator = translatorCache[pairId];

      if (!translator) {
        setStatus("loading-model");
        setProgress(0.1);
        setStatusText(`Loading translation model for ${pair.label} (~300MB)...`);

        translator = await pipeline("translation", pair.model, {
          progress_callback: (progressData: any) => {
            if (progressData.status === "progress" && progressData.progress) {
              setProgress(0.1 + (progressData.progress / 100) * 0.7);
            } else if (progressData.status === "done") {
              setProgress(0.8);
            }
          },
        } as any);

        translatorCache[pairId] = translator;
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
      if (msg.includes("not found") || msg.includes("404")) {
        setError("This language pair model is not available. Try a different pair.");
      } else {
        setError(`Translation failed: ${msg}`);
      }
      setStatus("error");
    }
  }, [input, pairId]);

  const handleSwapLanguages = useCallback(() => {
    const pair = LANG_PAIRS.find((p) => p.id === pairId);
    if (!pair) return;
    const reverseId = `${pair.target}-${pair.source}`;
    const reversePair = LANG_PAIRS.find((p) => p.id === reverseId);
    if (reversePair) {
      setPairId(reverseId);
      if (result) {
        setInput(result);
        setResult("");
        setStatus("idle");
      }
    }
  }, [pairId, result]);

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
  const currentPair = LANG_PAIRS.find((p) => p.id === pairId);

  return (
    <div>
      {/* Language selector */}
      <div class="flex flex-wrap items-center gap-3 mb-4">
        <div class="flex-1">
          <label class="text-caption-uppercase text-muted block mb-1">
            Language Pair
          </label>
          <select
            class="input"
            value={pairId}
            onChange={(e) => {
              setPairId((e.target as HTMLSelectElement).value);
              if (status === "done") {
                setStatus("idle");
                setResult("");
              }
            }}
            disabled={isProcessing}
          >
            {LANG_PAIRS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <button
          class="btn-secondary"
          onClick={handleSwapLanguages}
          disabled={isProcessing}
          title="Swap languages"
          style="margin-top: 22px"
        >
          ⇄ Swap
        </button>
      </div>

      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">
          {currentPair?.source.toUpperCase() || "Source"} Text
        </label>
        <textarea
          class="textarea"
          style="min-height: 160px"
          placeholder={`Enter text in ${currentPair?.source.toUpperCase()}...`}
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

      {/* Action */}
      {status !== "done" && (
        <div class="mb-4">
          <button
            class="btn-primary"
            onClick={handleTranslate}
            disabled={!input.trim() || isProcessing}
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

      {/* Result */}
      {status === "done" && result && (
        <div>
          <div class="flex items-center gap-3 mb-3">
            <span class="text-caption-uppercase text-muted">
              {currentPair?.target.toUpperCase() || "Target"} Translation
            </span>
            <span class="badge badge-yellow">Translated</span>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-caption-uppercase text-muted">Output</label>
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <textarea
              class="textarea"
              style="min-height: 160px"
              value={result}
              readOnly
            />
          </div>

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
        </div>
      )}
    </div>
  );
}
