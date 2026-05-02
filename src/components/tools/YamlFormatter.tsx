import { useState, useMemo, useCallback } from "preact/hooks";
import yaml from "js-yaml";

type Mode = "format" | "validate";

export default function YamlFormatter() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<Mode>("format");

  const result = useMemo((): { output: string; error: string | null; errorLine: number | null } => {
    if (!input.trim()) return { output: "", error: null, errorLine: null };

    try {
      const parsed = yaml.load(input);
      if (mode === "format") {
        const output = yaml.dump(parsed, { indent: 2, lineWidth: 120, noRefs: true });
        return { output, error: null, errorLine: null };
      }
      // Validate mode - if we got here, it parsed successfully
      return { output: "✓ Valid YAML", error: null, errorLine: null };
    } catch (e) {
      const err = e as yaml.YAMLException;
      const match = err.message?.match(/at line (\d+)/);
      const line = match ? Number.parseInt(match[1], 10) : null;
      return { output: "", error: err.message || "Invalid YAML", errorLine: line };
    }
  }, [input, mode]);

  const handleCopy = useCallback(async () => {
    if (result.output && mode === "format") await navigator.clipboard.writeText(result.output);
  }, [result.output, mode]);

  const handleSample = useCallback(() => {
    setInput(`# Application Configuration
server:
  host: 0.0.0.0
  port: 8080
  ssl: true

database:
  type: postgres
  host: localhost
  port: 5432
  name: myapp_db
  credentials:
    username: admin
    password: secret123

features:
  - authentication
  - logging
  - caching
  - rate-limiting

logging:
  level: info
  format: json
  outputs:
    - stdout
    - file: /var/log/app.log`);
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
            class={`px-4 py-2 text-body-sm font-medium transition-colors ${mode === "validate" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
            onClick={() => setMode("validate")}
          >
            Validate
          </button>
        </div>

        <button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
          Load Sample
        </button>
      </div>

      {result.error && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4 text-body-sm text-accent-rose">
          <strong>Invalid YAML{result.errorLine ? ` (line ${result.errorLine})` : ""}:</strong> {result.error}
        </div>
      )}

      {mode === "validate" && !result.error && input.trim() && (
        <div class="bg-accent-emerald/10 border border-accent-emerald/30 rounded-lg p-4 mb-4 text-body-sm text-accent-emerald">
          <strong>✓ Valid YAML</strong> — Parsed successfully with no errors.
        </div>
      )}

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Input YAML</label>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            placeholder="Paste your YAML here..."
            value={input}
            onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
          />
        </div>
        <div>
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">{mode === "format" ? "Formatted Output" : "Validation Result"}</label>
            {result.output && mode === "format" && (
              <button class="text-body-sm text-primary hover:text-primary-active transition-colors" onClick={handleCopy}>
                Copy
              </button>
            )}
          </div>
          <textarea
            class="textarea"
            style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
            value={result.output}
            readOnly
            placeholder={mode === "format" ? "Formatted YAML will appear here..." : "Paste YAML to validate..."}
          />
        </div>
      </div>
    </div>
  );
}
