import { useState, useMemo, useCallback } from "preact/hooks";

type Mode = "format" | "minify";

function formatCss(css: string, indentSize: number): string {
  let result = "";
  let indent = 0;
  const indentStr = " ".repeat(indentSize);

  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Normalize whitespace
  const normalized = cleaned.replace(/\s+/g, " ").trim();

  let i = 0;
  while (i < normalized.length) {
    const ch = normalized[i];

    if (ch === "{") {
      result = result.trimEnd();
      result += " {\n";
      indent++;
      result += indentStr.repeat(indent);
      i++;
      // Skip whitespace after {
      while (i < normalized.length && normalized[i] === " ") i++;
      continue;
    }

    if (ch === "}") {
      result = result.trimEnd();
      result += "\n";
      indent = Math.max(0, indent - 1);
      result += indentStr.repeat(indent) + "}\n";
      result += indentStr.repeat(indent);
      i++;
      // Skip whitespace after }
      while (i < normalized.length && normalized[i] === " ") i++;
      continue;
    }

    if (ch === ";") {
      result = result.trimEnd();
      result += ";\n";
      result += indentStr.repeat(indent);
      i++;
      while (i < normalized.length && normalized[i] === " ") i++;
      continue;
    }

    result += ch;
    i++;
  }

  // Clean up: remove trailing whitespace on lines, collapse multiple blank lines
  return result
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\s*{\s*/g, "{") // Remove space around {
    .replace(/\s*}\s*/g, "}") // Remove space around }
    .replace(/\s*;\s*/g, ";") // Remove space around ;
    .replace(/\s*:\s*/g, ":") // Remove space around :
    .replace(/\s*,\s*/g, ",") // Remove space around ,
    .replace(/;}/g, "}") // Remove last semicolon before }
    .trim();
}

export default function CssFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("format");
  const [indent, setIndent] = useState(2);

  const result = useMemo(() => {
    if (!input.trim()) return "";
    try {
      if (mode === "format") {
        return formatCss(input, indent);
      }
      return minifyCss(input);
    } catch {
      return "Error processing CSS";
    }
  }, [input, mode, indent]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  const handleSample = useCallback(() => {
    setInput(`/* Main styles */
body {
  margin: 0;
  padding: 0;
  font-family: Arial, sans-serif;
  background-color: #f0f0f0;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

h1, h2, h3 {
  color: #333;
  font-weight: bold;
}

.button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  background-color: #0056b3;
}`);
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
            onChange={(e) =>
              setIndent(Number((e.target as HTMLSelectElement).value))
            }
          >
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </select>
        )}

        <button
          class="btn-secondary text-body-sm"
          style="height: 36px"
          onClick={handleSample}
        >
          Load Sample
        </button>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">
            Input CSS
          </label>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            placeholder="Paste your CSS here..."
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Output</label>
            {result && (
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                Copy
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            value={result}
            readOnly
            placeholder={
              mode === "format"
                ? "Formatted CSS will appear here..."
                : "Minified CSS will appear here..."
            }
          />
        </div>
      </div>
    </div>
  );
}
