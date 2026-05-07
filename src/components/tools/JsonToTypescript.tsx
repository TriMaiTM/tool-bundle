import { useState, useCallback } from "preact/hooks";

function jsonToTs(obj: any, indent: number = 0, name: string = "Root"): string {
  const pad = "  ".repeat(indent);
  if (obj === null) return "null";
  if (obj === undefined) return "undefined";
  if (typeof obj === "string") return "string";
  if (typeof obj === "number") return Number.isInteger(obj) ? "number" : "number";
  if (typeof obj === "boolean") return "boolean";

  if (Array.isArray(obj)) {
    if (obj.length === 0) return "any[]";
    const itemType = jsonToTs(obj[0], indent + 1);
    return `${itemType}[]`;
  }

  if (typeof obj === "object") {
    const lines = Object.entries(obj).map(([key, val]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      return `${pad}  ${safeKey}: ${jsonToTs(val, indent + 1)};`;
    });
    return `{\n${lines.join("\n")}\n${pad}}`;
  }

  return "any";
}

function jsonToInterface(obj: any, name: string = "Root", indent: number = 0): string {
  const pad = "  ".repeat(indent);
  if (typeof obj !== "object" || obj === null || Array.isArray(obj)) {
    return `${pad}export type ${name} = ${jsonToTs(obj, indent, name)};`;
  }

  const lines = Object.entries(obj).map(([key, val]) => {
    const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
    if (typeof val === "object" && val !== null && !Array.isArray(val) && Object.keys(val).length > 0) {
      const nestedName = key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9]/g, "");
      return `${pad}  ${safeKey}: ${nestedName};`;
    }
    return `${pad}  ${safeKey}: ${jsonToTs(val, indent + 1)};`;
  });

  return `${pad}export interface ${name} {\n${lines.join("\n")}\n${pad}}`;
}

function generateAllInterfaces(obj: any, name: string = "Root"): string {
  const parts: string[] = [];

  function walk(val: any, currentName: string) {
    if (val === null || val === undefined || typeof val !== "object" || Array.isArray(val)) return;

    const lines = Object.entries(val).map(([key, v]) => {
      const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;
      if (v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length > 0) {
        const nested = key.charAt(0).toUpperCase() + key.slice(1).replace(/[^a-zA-Z0-9]/g, "");
        walk(v, nested);
        return `  ${safeKey}: ${nested};`;
      }
      return `  ${safeKey}: ${jsonToTs(v)};`;
    });

    parts.push(`export interface ${currentName} {\n${lines.join("\n")}\n}`);
  }

  if (Array.isArray(obj)) {
    if (obj.length > 0 && typeof obj[0] === "object" && obj[0] !== null) {
      walk(obj[0], name);
    }
  } else {
    walk(obj, name);
  }

  return parts.join("\n\n");
}

export default function JsonToTypescript() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [typeName, setTypeName] = useState("Root");
  const [mode, setMode] = useState<"interface" | "type">("interface");

  const handleConvert = useCallback(() => {
    if (!input.trim()) { setOutput(""); setError(null); return; }
    try {
      setError(null);
      const parsed = JSON.parse(input);
      const result = mode === "interface" ? generateAllInterfaces(parsed, typeName) : `type ${typeName} = ${jsonToTs(parsed)};`;
      setOutput(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid JSON");
      setOutput("");
    }
  }, [input, typeName, mode]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try { await navigator.clipboard.writeText(output); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  return (
    <div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">JSON Input</label>
          <textarea class="textarea code-block font-mono" style="min-height: 300px; font-size: 13px" placeholder='{"name": "John", "age": 30, "email": "john@example.com"}' value={input} onInput={(e) => { setInput((e.target as HTMLTextAreaElement).value); if (output) { setOutput(""); setCopied(false); } }} />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">TypeScript Output</label>
            {output && (
              <button class="text-body-sm text-primary hover:text-primary-active transition-colors" onClick={handleCopy}>
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          <pre class="code-block font-mono" style="min-height: 300px; font-size: 13px; white-space: pre-wrap"><code>{output || "// Output will appear here..."}</code></pre>
        </div>
      </div>

      <div class="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Type Name</label>
          <input class="input" style="width: 200px" value={typeName} onInput={(e) => setTypeName((e.target as HTMLInputElement).value)} />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Mode</label>
          <div class="flex rounded-md overflow-hidden border border-hairline" style="width: fit-content">
            <button class={`px-4 py-2 text-body-sm font-medium ${mode === "interface" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body"}`} onClick={() => setMode("interface")}>Interface</button>
            <button class={`px-4 py-2 text-body-sm font-medium ${mode === "type" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body"}`} onClick={() => setMode("type")}>Type</button>
          </div>
        </div>
        <button class="btn-primary" onClick={handleConvert} disabled={!input.trim()}>Convert</button>
      </div>

      {error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
          <p class="text-body-sm text-accent-rose">{error}</p>
        </div>
      )}
    </div>
  );
}
