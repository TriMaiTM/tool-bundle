import { useState, useCallback } from "preact/hooks";

type SummarizeStatus = "idle" | "loading-model" | "processing" | "done" | "error";

export default function TextSummarizer() {
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<SummarizeStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [maxLength, setMaxLength] = useState(150);
  const [minLength, setMinLength] = useState(30);

  const handleSummarize = useCallback(async () => {
    if (!input.trim()) return;
    setStatus("loading-model");
    setProgress(0);
    setError(null);
    setResult("");
    setCopied(false);

    try {
      const { pipeline } = await import("@huggingface/transformers");

      setStatus("loading-model");
      setProgress(0.1);
      setStatusText("Loading summarization model (~90MB)...");

      const summarizer = await pipeline(
        "summarization",
        "Xenova/distilbart-cnn-6-6",
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
      setStatusText("Generating summary...");

      const output = await summarizer(input, {
        max_new_tokens: maxLength,
        min_new_tokens: minLength,
      });

      const summary = Array.isArray(output)
        ? (output[0] as any).summary_text
        : (output as any).summary_text;

      setResult(summary || "No summary generated.");
      setStatus("done");
      setProgress(1);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to summarize text. Try shorter text.",
      );
      setStatus("error");
    }
  }, [input, maxLength, minLength]);

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

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;
  const summaryWordCount = result.trim() ? result.trim().split(/\s+/).length : 0;
  const reductionPercent = wordCount > 0 && summaryWordCount > 0
    ? Math.round((1 - summaryWordCount / wordCount) * 100)
    : 0;

  const isProcessing = status === "loading-model" || status === "processing";

  return (
    <div>
      {/* Controls */}
      <div class="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">
            Min Words
          </label>
          <input
            type="number"
            class="input"
            style="width: 100px"
            value={minLength}
            min={10}
            max={500}
            onInput={(e) =>
              setMinLength(Math.max(10, Number((e.target as HTMLInputElement).value) || 30))
            }
            disabled={isProcessing}
          />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">
            Max Words
          </label>
          <input
            type="number"
            class="input"
            style="width: 100px"
            value={maxLength}
            min={50}
            max={500}
            onInput={(e) =>
              setMaxLength(Math.max(50, Number((e.target as HTMLInputElement).value) || 150))
            }
            disabled={isProcessing}
          />
        </div>
        <div>
          <span class="text-caption text-muted">Input: {wordCount} words</span>
        </div>
      </div>

      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">
          Input Text
        </label>
        <textarea
          class="textarea"
          style="min-height: 200px"
          placeholder="Paste your article, essay, or long text here..."
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
      </div>

      {/* Action */}
      {status !== "done" && (
        <div class="mb-4">
          <button
            class="btn-primary"
            onClick={handleSummarize}
            disabled={!input.trim() || isProcessing}
          >
            {isProcessing ? "Summarizing..." : "Summarize"}
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
            First time: downloading model (~90MB). Cached after that.
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
            <span class="text-caption-uppercase text-muted">Summary</span>
            {reductionPercent > 0 && (
              <span class="badge badge-yellow">
                {reductionPercent}% shorter
              </span>
            )}
            <span class="text-caption text-muted">
              {summaryWordCount} words
            </span>
          </div>

          <div class="mb-4">
            <div class="flex items-center justify-between mb-2">
              <label class="text-caption-uppercase text-muted">
                Summary Output
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
              style="min-height: 160px"
              value={result}
              readOnly
            />
          </div>

          <div class="flex flex-wrap gap-3">
            <button class="btn-primary" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
            <button
              class="btn-secondary"
              onClick={() => {
                setStatus("idle");
                setResult("");
                setCopied(false);
              }}
            >
              Summarize Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
