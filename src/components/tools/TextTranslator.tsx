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

// Multilingual models — 1 model handles ALL languages
const MODEL_TO_EN = "Xenova/opus-mt-mul-en"; // any language → English
const MODEL_FROM_EN = "Xenova/opus-mt-en-mul"; // English → any language

// MarianMT language tags (ISO 639-3) — required by en-mul model
const LANG_TAGS: Record<string, string> = {
  en: "eng",
  vi: "vie",
  zh: "zho",
  ja: "jpn",
  ko: "kor",
  fr: "fra",
  de: "deu",
  es: "spa",
  ru: "rus",
};

// Cache: only 2 models ever needed
const modelCache: Record<string, any> = {};

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

  // Load a multilingual model with caching
  const loadModel = useCallback(
    async (modelId: string, onProgress: (p: number) => void) => {
      if (modelCache[modelId]) return modelCache[modelId];

      const { pipeline } = await import("@huggingface/transformers");
      const translator = await pipeline("translation", modelId, {
        progress_callback: (progressData: any) => {
          if (progressData.status === "progress" && progressData.progress) {
            onProgress(progressData.progress);
          }
        },
      } as any);

      modelCache[modelId] = translator;
      return translator;
    },
    [],
  );

  // Translate text with a loaded translator
  const translateText = useCallback(
    async (translator: any, text: string, langTag?: string) => {
      const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
      const parts: string[] = [];
      for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if (!trimmed) continue;
        // Prepend language tag if needed (e.g., ">>vie<< Hello")
        const input = langTag ? `>>${langTag}<< ${trimmed}` : trimmed;
        const output = await translator(input);
        const translated = Array.isArray(output)
          ? (output[0] as any).translation_text
          : (output as any).translation_text;
        parts.push(translated || trimmed);
      }
      return parts.join(" ");
    },
    [],
  );

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

    const srcName = LANGUAGES.find((l) => l.code === sourceLang)?.name;
    const tgtName = LANGUAGES.find((l) => l.code === targetLang)?.name;
    const isDirectToEn = targetLang === "en";
    const isDirectFromEn = sourceLang === "en";
    const needsPivot = !isDirectToEn && !isDirectFromEn;

    try {
      let finalText: string;

      if (isDirectFromEn) {
        // English → Any language (1 model)
        const cached = !!modelCache[MODEL_FROM_EN];
        setStatusText(
          cached
            ? "Translating..."
            : "Loading English → Multi-language model (~300MB)...",
        );
        const translator = await loadModel(MODEL_FROM_EN, (p) =>
          setProgress(cached ? 0.5 : 0.1 + (p / 100) * 0.7),
        );
        setStatus("processing");
        setProgress(0.85);
        setStatusText(`Translating English → ${tgtName}...`);
        finalText = await translateText(
          translator,
          input,
          LANG_TAGS[targetLang],
        );
      } else if (isDirectToEn) {
        // Any language → English (1 model)
        const cached = !!modelCache[MODEL_TO_EN];
        setStatusText(
          cached
            ? "Translating..."
            : "Loading Multi-language → English model (~300MB)...",
        );
        const translator = await loadModel(MODEL_TO_EN, (p) =>
          setProgress(cached ? 0.5 : 0.1 + (p / 100) * 0.7),
        );
        setStatus("processing");
        setProgress(0.85);
        setStatusText(`Translating ${srcName} → English...`);
        finalText = await translateText(translator, input);
      } else {
        // Pivot: Any → English → Any (2 models, both shared)
        const cachedToEn = !!modelCache[MODEL_TO_EN];
        const cachedFromEn = !!modelCache[MODEL_FROM_EN];

        // Step 1: source → English
        setStatusText(
          cachedToEn
            ? `Step 1/2: Translating ${srcName} → English...`
            : `Step 1/2: Loading Multi-language → English model (~300MB)...`,
        );
        const translatorToEn = await loadModel(MODEL_TO_EN, (p) =>
          setProgress(cachedToEn ? 0.2 : 0.05 + (p / 100) * 0.35),
        );
        setStatus("processing");
        setProgress(0.4);
        setStatusText(`Step 1/2: Translating ${srcName} → English...`);
        const englishText = await translateText(translatorToEn, input);

        // Step 2: English → target
        setStatusText(
          cachedFromEn
            ? `Step 2/2: Translating English → ${tgtName}...`
            : `Step 2/2: Loading English → Multi-language model (~300MB)...`,
        );
        const translatorFromEn = await loadModel(MODEL_FROM_EN, (p) =>
          setProgress(cachedFromEn ? 0.7 : 0.45 + (p / 100) * 0.35),
        );
        setProgress(0.85);
        setStatusText(`Step 2/2: Translating English → ${tgtName}...`);
        finalText = await translateText(
          translatorFromEn,
          englishText,
          LANG_TAGS[targetLang],
        );
      }

      setResult(finalText);
      setStatus("done");
      setProgress(1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Translation failed: ${msg}`);
      setStatus("error");
    }
  }, [input, sourceLang, targetLang, loadModel, translateText]);

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
