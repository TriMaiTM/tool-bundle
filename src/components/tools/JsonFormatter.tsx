import { useState, useCallback, useMemo } from "preact/hooks";

type Mode = "format" | "minify";

export default function JsonFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState(2);
  const [error, setError] = useState<string | null>(null);

  const result = useMemo(() => {
    if (!input.trim()) {
      setError(null);
      return "";
    }
    try {
      const parsed = JSON.parse(input);
      setError(null);
      if (mode === "format") {
        return JSON.stringify(parsed, null, indent);
      }
      return JSON.stringify(parsed);
    } catch (e) {
      setError((e as Error).message);
      return "";
    }
  }, [input, mode, indent]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  const handleSample = useCallback(() => {
    setInput(JSON.stringify({
      name: "John Doe",
      age: 30,
      email: "john@example.com",
      hobbies: ["reading", "coding", "gaming"],
      address: { street: "123 Main St", city: "New York", country: "US" }
    }, null, 2));
  }, []);

  return (
    <div>
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex rounded-md overflow-hidden border border-hairline">
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "format" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => setMode("format")}
          >
            Format
          </button>
          <button
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "minify" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => setMode("minify")}
          >
            Minify
          </button>
        </div>

        {mode === "format" && (
          <select
            class="input"
            style="width: auto; height: 36px"
            value={indent}
            onChange={(e) => setIndent(Number((e.target as HTMLSelectElement).value))}
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
            <option value={1}>1 tab</option>
          </select>
        )}

        <button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
          Load Sample
        </button>
      </div>

      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
          <strong>Invalid JSON:</strong> {error}
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Input</label>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            placeholder='Paste your JSON here...\n{"key": "value"}'
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Output</label>
            {result && (
              <button class="text-body-sm text-primary hover:text-primary-active transition-colors" onClick={handleCopy}>
                Copy
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            value={result}
            readOnly
            placeholder="Formatted JSON will appear here..."
          />
        </div>
      </div>
    </div>
  );
}
