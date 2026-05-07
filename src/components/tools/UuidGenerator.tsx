import { useState, useCallback } from "preact/hooks";

function generateUUID(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] / 256) * 16 | 0;
    const v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function formatUUID(uuid: string, format: string): string {
  const raw = uuid.replace(/-/g, "");
  switch (format) {
    case "standard": return uuid;
    case "no-dash": return raw;
    case "uppercase": return uuid.toUpperCase();
    case "braces": return `{${uuid}}`;
    case "url": return `urn:uuid:${uuid}`;
    case "base64": return btoa(raw);
    default: return uuid;
  }
}

const FORMATS = [
  { id: "standard", label: "Standard" },
  { id: "uppercase", label: "UPPERCASE" },
  { id: "no-dash", label: "No Dashes" },
  { id: "braces", label: "With Braces" },
  { id: "url", label: "URN Format" },
  { id: "base64", label: "Base64" },
];

export default function UuidGenerator() {
  const [count, setCount] = useState(1);
  const [format, setFormat] = useState("standard");
  const [uuids, setUuids] = useState<string[]>([]);
  const [copiedAll, setCopiedAll] = useState(false);

  const handleGenerate = useCallback(() => {
    const newUuids = Array.from({ length: count }, () => generateUUID());
    setUuids(newUuids);
    setCopiedAll(false);
  }, [count]);

  const handleCopyAll = useCallback(async () => {
    const text = uuids.map((u) => formatUUID(u, format)).join("\n");
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }, [uuids, format]);

  const handleCopyOne = useCallback(async (uuid: string) => {
    const text = formatUUID(uuid, format);
    try { await navigator.clipboard.writeText(text); } catch { /* ignore */ }
  }, [format]);

  const handleDownload = useCallback(() => {
    const text = uuids.map((u) => formatUUID(u, format)).join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "uuids.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [uuids, format]);

  return (
    <div>
      {/* Controls */}
      <div class="flex flex-wrap items-end gap-4 mb-6">
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Count</label>
          <input class="input" type="number" min={1} max={100} value={count} onInput={(e) => setCount(Math.min(100, Math.max(1, Number((e.target as HTMLInputElement).value) || 1)))} style="width: 80px" />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-1">Format</label>
          <div class="flex rounded-md overflow-hidden border border-hairline" style="width: fit-content">
            {FORMATS.map((f) => (
              <button key={f.id} class={`px-3 py-2 text-body-sm font-medium transition-colors ${format === f.id ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`} onClick={() => setFormat(f.id)}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <button class="btn-primary" onClick={handleGenerate}>Generate</button>
      </div>

      {/* Generated UUIDs */}
      {uuids.length > 0 && (
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="text-caption-uppercase text-muted">Generated ({uuids.length})</span>
            <div class="flex gap-2">
              <button class="text-body-sm text-primary hover:text-primary-active" onClick={handleCopyAll}>{copiedAll ? "Copied!" : "Copy All"}</button>
              <button class="text-body-sm text-primary hover:text-primary-active" onClick={handleDownload}>Download</button>
            </div>
          </div>
          <div class="space-y-2">
            {uuids.map((uuid, i) => (
              <div key={i} class="flex items-center gap-3 bg-surface-elevated rounded-lg p-3">
                <span class="text-caption text-muted w-8">{i + 1}.</span>
                <code class="font-mono text-body-sm text-on-dark flex-1">{formatUUID(uuid, format)}</code>
                <button class="text-body-sm text-primary hover:text-primary-active" onClick={() => handleCopyOne(uuid)}>Copy</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {uuids.length === 0 && (
        <div class="bg-surface-elevated rounded-lg p-6 text-center">
          <p class="text-body-sm text-muted">Click "Generate" to create UUID v4 values.</p>
        </div>
      )}
    </div>
  );
}
