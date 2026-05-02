import { useState, useCallback, useMemo } from "preact/hooks";
import FileDropZone from "../ui/FileDropZone";

type Delimiter = "," | ";" | "\t" | "|";
type QuoteChar = '"' | "'" | "none";

const DELIMITERS: { label: string; value: Delimiter | "auto" }[] = [
  { label: "Auto-detect", value: "auto" },
  { label: "Comma (,)", value: "," },
  { label: "Semicolon (;)", value: ";" },
  { label: "Tab", value: "\t" },
  { label: "Pipe (|)", value: "|" },
];

const QUOTE_CHARS: { label: string; value: QuoteChar }[] = [
  { label: 'Double Quote (")', value: '"' },
  { label: "Single Quote (')", value: "'" },
  { label: "None", value: "none" },
];

const SAMPLE_CSV = `name,age,email,city,role,department
Alice Johnson,28,alice@example.com,New York,Engineer,Engineering
Bob Smith,34,bob@example.com,San Francisco,Designer,Design
Charlie Brown,22,charlie@example.com,London,Developer,Engineering
Diana Prince,30,diana@example.com,Berlin,Manager,Management
Eve Davis,27,eve@example.com,Tokyo,Analyst,Analytics
Frank Miller,45,frank@example.com,Paris,Director,Management
Grace Lee,31,grace@example.com,Seoul,Lead Developer,Engineering
Henry Wilson,29,henry@example.com,Sydney,UX Designer,Design
Iris Chen,26,iris@example.com,Singapore,Data Scientist,Analytics
Jack Taylor,38,jack@example.com,Dubai,CTO,Management`;

function detectDelimiter(text: string): Delimiter {
  const firstLines = text.split("\n").slice(0, 10).join("\n");
  const counts: Record<string, number> = {
    ",": (firstLines.match(/,/g) || []).length,
    ";": (firstLines.match(/;/g) || []).length,
    "\t": (firstLines.match(/\t/g) || []).length,
    "|": (firstLines.match(/\|/g) || []).length,
  };
  const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return (best[1] > 0 ? best[0] : ",") as Delimiter;
}

function parseCsvLines(text: string, delimiter: Delimiter): string[][] {
  const lines = text.split("\n");
  const result: string[][] = [];
  let current: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === delimiter && !inQuotes) {
        current.push(field);
        field = "";
      } else {
        field += ch;
      }
    }
    if (inQuotes) {
      field += "\n";
    } else {
      current.push(field);
      field = "";
      result.push(current);
      current = [];
    }
  }
  // Handle last field if file doesn't end with newline
  if (field || current.length > 0) {
    current.push(field);
    result.push(current);
  }
  return result;
}

function formatCsvRow(fields: string[], delimiter: Delimiter, quoteChar: QuoteChar): string {
  if (quoteChar === "none") {
    return fields.join(delimiter);
  }
  return fields
    .map((f) => {
      const needsQuote =
        f.includes(delimiter) || f.includes(quoteChar) || f.includes("\n") || f.includes("\r");
      if (needsQuote) {
        return quoteChar + f.replace(new RegExp(quoteChar === '"' ? '"' : "'", "g"), quoteChar + quoteChar) + quoteChar;
      }
      return f;
    })
    .join(delimiter);
}

export default function CsvFormatter() {
  const [input, setInput] = useState("");
  const [delimiterSetting, setDelimiterSetting] = useState<Delimiter | "auto">("auto");
  const [quoteChar, setQuoteChar] = useState<QuoteChar>('"');
  const [copied, setCopied] = useState(false);

  const effectiveDelimiter = useMemo<Delimiter>(() => {
    if (delimiterSetting === "auto") {
      return input.trim() ? detectDelimiter(input) : ",";
    }
    return delimiterSetting;
  }, [delimiterSetting, input]);

  const parsedRows = useMemo(() => {
    if (!input.trim()) return [];
    return parseCsvLines(input, effectiveDelimiter);
  }, [input, effectiveDelimiter]);

  const validation = useMemo(() => {
    if (parsedRows.length === 0) return { valid: true, errors: [] as { line: number; expected: number; got: number }[] };
    const expectedCols = parsedRows[0].length;
    const errors: { line: number; expected: number; got: number }[] = [];
    for (let i = 1; i < parsedRows.length; i++) {
      if (parsedRows[i].length !== expectedCols) {
        errors.push({ line: i + 1, expected: expectedCols, got: parsedRows[i].length });
      }
    }
    return { valid: errors.length === 0, errors };
  }, [parsedRows]);

  const formattedOutput = useMemo(() => {
    if (parsedRows.length === 0) return "";
    return parsedRows.map((row) => formatCsvRow(row, effectiveDelimiter, quoteChar)).join("\n");
  }, [parsedRows, effectiveDelimiter, quoteChar]);

  const stats = useMemo(() => {
    return {
      rows: parsedRows.length,
      cols: parsedRows[0]?.length || 0,
      size: new Blob([formattedOutput]).size,
    };
  }, [parsedRows, formattedOutput]);

  const handleCopy = useCallback(async () => {
    if (!formattedOutput) return;
    await navigator.clipboard.writeText(formattedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [formattedOutput]);

  const handleDownload = useCallback(() => {
    if (!formattedOutput) return;
    const blob = new Blob([formattedOutput], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "formatted.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [formattedOutput]);

  const handleSample = useCallback(() => {
    setInput(SAMPLE_CSV);
  }, []);

  const handleFile = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setInput(reader.result as string);
    reader.readAsText(file);
  }, []);

  const previewRows = parsedRows.slice(0, 100);
  const hasMoreRows = parsedRows.length > 100;

  return (
    <div>
      {/* Options */}
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex items-center gap-2">
          <label class="text-caption-uppercase text-muted">Delimiter</label>
          <select
            class="input"
            style="width: auto; height: 36px"
            value={delimiterSetting}
            onChange={(e) => setDelimiterSetting((e.target as HTMLSelectElement).value as Delimiter | "auto")}
          >
            {DELIMITERS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-caption-uppercase text-muted">Quote Char</label>
          <select
            class="input"
            style="width: auto; height: 36px"
            value={quoteChar}
            onChange={(e) => setQuoteChar((e.target as HTMLSelectElement).value as QuoteChar)}
          >
            {QUOTE_CHARS.map((q) => (
              <option key={q.value} value={q.value}>{q.label}</option>
            ))}
          </select>
        </div>

        <button class="btn-secondary text-body-sm" style="height: 36px" onClick={handleSample}>
          Sample CSV
        </button>
      </div>

      {/* Stats */}
      {parsedRows.length > 0 && (
        <div class="flex gap-3 mb-4">
          <div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
            <div class="text-title-lg text-primary">{stats.rows}</div>
            <div class="text-caption-uppercase text-muted">Rows</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
            <div class="text-title-lg text-primary">{stats.cols}</div>
            <div class="text-caption-uppercase text-muted">Columns</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 flex-1 text-center">
            <div class="text-title-lg text-primary">
              {stats.size < 1024 ? `${stats.size} B` : `${(stats.size / 1024).toFixed(1)} KB`}
            </div>
            <div class="text-caption-uppercase text-muted">Output Size</div>
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {!validation.valid && (
        <div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mb-4">
          <p class="text-body-sm text-accent-rose font-medium mb-2">
            Found {validation.errors.length} row(s) with inconsistent column count:
          </p>
          <div class="space-y-1" style="max-height: 120px; overflow-y: auto">
            {validation.errors.slice(0, 20).map((err) => (
              <p key={err.line} class="text-caption text-accent-rose">
                Line {err.line}: expected {err.expected} columns, got {err.got}
              </p>
            ))}
            {validation.errors.length > 20 && (
              <p class="text-caption text-accent-rose">
                ...and {validation.errors.length - 20} more errors
              </p>
            )}
          </div>
        </div>
      )}

      {/* Input */}
      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">CSV Input</label>
        <FileDropZone
          accept=".csv,text/csv"
          multiple={false}
          onFiles={handleFile}
          label="Drop a CSV file here or click to browse"
          sublabel=".csv files accepted"
        />
        <textarea
          class="textarea mt-3"
          style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
          placeholder="Paste CSV data here..."
          value={input}
          onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      {/* Table Preview */}
      {parsedRows.length > 0 && (
        <div class="mb-4">
          <div class="flex items-center justify-between mb-2">
            <label class="text-caption-uppercase text-muted">Preview</label>
            {hasMoreRows && (
              <span class="text-caption text-muted">
                Showing 100 of {parsedRows.length} rows
              </span>
            )}
          </div>
          <div
            class="bg-surface-elevated rounded-lg"
            style="max-height: 360px; overflow: auto"
          >
            <div style="min-width: max-content">
              {previewRows.map((row, ri) => (
                <div
                  key={ri}
                  class="flex"
                  style={{
                    borderBottom: "1px solid var(--color-hairline)",
                    background:
                      ri === 0
                        ? "var(--color-surface-soft)"
                        : ri % 2 === 0
                          ? "transparent"
                          : "var(--color-surface-soft)",
                  }}
                >
                  {row.map((cell, ci) => (
                    <div
                      key={ci}
                      class={`px-3 py-2 text-body-sm truncate ${ri === 0 ? "font-medium" : ""}`}
                      style="min-width: 120px; flex-shrink: 0"
                      title={cell}
                    >
                      {cell}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Output */}
      <div>
        <div class="flex items-center justify-between mb-2">
          <label class="text-caption-uppercase text-muted">Formatted CSV</label>
          {formattedOutput && (
            <div class="flex items-center gap-3">
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
              <button
                class="text-body-sm text-primary hover:text-primary-active transition-colors"
                onClick={handleDownload}
              >
                Download
              </button>
            </div>
          )}
        </div>
        <textarea
          class="textarea"
          style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
          value={formattedOutput}
          readOnly
          placeholder="Formatted CSV will appear here..."
        />
      </div>
    </div>
  );
}
