import { useState, useCallback } from "preact/hooks";

export default function CssGridGenerator() {
  const [cols, setCols] = useState(3);
  const [rows, setRows] = useState(2);
  const [gap, setGap] = useState(16);
  const [colSize, setColSize] = useState("1fr");
  const [rowSize, setRowSize] = useState("auto");
  const [copied, setCopied] = useState(false);

  const css = `display: grid;\ngrid-template-columns: repeat(${cols}, ${colSize});\ngrid-template-rows: repeat(${rows}, ${rowSize});\ngap: ${gap}px;`;

  const handleCopy = useCallback(async () => {
    try { await navigator.clipboard.writeText(css); } catch { /* ignore */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [css]);

  return (
    <div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Columns: {cols}</label>
            <input type="range" min={1} max={12} value={cols} onInput={(e) => setCols(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Rows: {rows}</label>
            <input type="range" min={1} max={12} value={rows} onInput={(e) => setRows(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Column Size</label>
            <select class="input" value={colSize} onChange={(e) => setColSize((e.target as HTMLSelectElement).value)}>
              <option value="1fr">1fr (equal)</option>
              <option value="auto">auto</option>
              <option value="min-content">min-content</option>
              <option value="max-content">max-content</option>
              <option value="200px">200px</option>
              <option value="250px">250px</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Row Size</label>
            <select class="input" value={rowSize} onChange={(e) => setRowSize((e.target as HTMLSelectElement).value)}>
              <option value="auto">auto</option>
              <option value="1fr">1fr (equal)</option>
              <option value="min-content">min-content</option>
              <option value="max-content">max-content</option>
              <option value="100px">100px</option>
              <option value="150px">150px</option>
            </select>
          </div>
          <div class="mb-6">
            <label class="text-caption-uppercase text-muted block mb-1">Gap: {gap}px</label>
            <input type="range" min={0} max={48} value={gap} onInput={(e) => setGap(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <label class="text-caption-uppercase text-muted">Generated CSS</label>
              <button class="text-body-sm text-primary hover:text-primary-active" onClick={handleCopy}>{copied ? "Copied!" : "Copy"}</button>
            </div>
            <pre class="code-block font-mono" style="font-size: 13px"><code>{css}</code></pre>
          </div>
        </div>
        <div class="flex items-center justify-center">
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, ${colSize})`, gridTemplateRows: `repeat(${rows}, ${rowSize})`, gap: `${gap}px`, width: "100%", maxWidth: 400 }}>
            {Array.from({ length: cols * rows }).map((_, i) => (
              <div key={i} class="bg-primary/20 border border-primary/40 rounded-md flex items-center justify-center text-body-sm text-primary" style={{ minHeight: 60 }}>
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
