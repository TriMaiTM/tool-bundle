import { useState, useCallback, useMemo } from "preact/hooks";

type Mode = "encode" | "decode";
type EncodeType = "component" | "full";

export default function UrlEncoder() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("encode");
  const [encodeType, setEncodeType] = useState<EncodeType>("component");
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!input.trim()) {
      setError(null);
      return "";
    }
    try {
      if (mode === "encode") {
        setError(null);
        return encodeType === "component"
          ? encodeURIComponent(input)
          : encodeURI(input);
      }
      setError(null);
      return decodeURIComponent(input);
    } catch {
      setError("Invalid encoded string");
      return "";
    }
  }, [input, mode, encodeType]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  return (
    <div>
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex rounded-md overflow-hidden border border-hairline">
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "encode" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => setMode("encode")}
          >
            Encode
          </button>
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "decode" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => setMode("decode")}
          >
            Decode
          </button>
        </div>

        {mode === "encode" && (
          <select
            class="input"
            style="width: auto; height: 36px"
            value={encodeType}
            onChange={(e) => setEncodeType((e.target as HTMLSelectElement).value as EncodeType)}
          >
            <option value="component">encodeURIComponent</option>
            <option value="full">encodeURI</option>
          </select>
        )}
      </div>

      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
          {error}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">
            {mode === "encode" ? "Plain Text" : "Encoded URL"}
          </label>
          <textarea
            class="textarea"
            style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
            placeholder={mode === "encode" ? "Enter text or URL to encode..." : "Enter encoded URL to decode..."}
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">
              {mode === "encode" ? "Encoded" : "Decoded"}
            </label>
            {result && (
              <button class="text-body-sm text-primary hover:text-primary-active transition-colors" onClick={handleCopy}>
                Copy
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
            value={result}
            readOnly
            placeholder="Result will appear here..."
          />
        </div>
      </div>
    </div>
  );
}
