import { useState, useCallback } from "preact/hooks";

const CASE_MODES = [
  { id: "upper", label: "UPPER CASE", convert: (s: string) => s.toUpperCase() },
  { id: "lower", label: "lower case", convert: (s: string) => s.toLowerCase() },
  { id: "title", label: "Title Case", convert: (s: string) => s.replace(/\b\w/g, (c) => c.toUpperCase()) },
  { id: "sentence", label: "Sentence case", convert: (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() },
  { id: "camel", label: "camelCase", convert: (s: string) => s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_: string, c: string) => c.toUpperCase()) },
  { id: "pascal", label: "PascalCase", convert: (s: string) => { const camel = s.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_: string, c: string) => c.toUpperCase()); return camel.charAt(0).toUpperCase() + camel.slice(1); } },
  { id: "snake", label: "snake_case", convert: (s: string) => s.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "") },
  { id: "kebab", label: "kebab-case", convert: (s: string) => s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") },
  { id: "alternating", label: "aLtErNaTiNg", convert: (s: string) => s.split("").map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase())).join("") },
  { id: "inverse", label: "iNVERSE cASE", convert: (s: string) => s.split("").map((c) => (c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase())).join("") },
];

export default function CaseConverter() {
  const [text, setText] = useState("");
  const [activeMode, setActiveMode] = useState("upper");

  const currentConverter = CASE_MODES.find((m) => m.id === activeMode)!;
  const result = text ? currentConverter.convert(text) : "";

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  return (
    <div>
      <div class="flex flex-wrap gap-2 mb-6">
        {CASE_MODES.map((mode) => (
          <button
            key={mode.id}
            class={`px-3 py-1.5 rounded-md text-body-sm font-medium transition-colors ${
              activeMode === mode.id
                ? "bg-primary text-on-primary"
                : "bg-surface-elevated text-body hover:text-on-dark"
            }`}
            onClick={() => setActiveMode(mode.id)}
          >
            {mode.label}
          </button>
        ))}
      </div>

      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Input</label>
        <textarea
          class="textarea"
          style="min-height: 150px"
          placeholder="Type or paste your text here..."
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
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
          style="min-height: 150px"
          value={result}
          readOnly
          placeholder="Result will appear here..."
        />
      </div>
    </div>
  );
}
