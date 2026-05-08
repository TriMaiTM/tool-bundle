import { useState, useCallback } from "preact/hooks";

export default function BoxShadowGenerator() {
  const [h, setH] = useState(4);
  const [v, setV] = useState(4);
  const [blur, setBlur] = useState(8);
  const [spread, setSpread] = useState(0);
  const [color, setColor] = useState("#00000080");
  const [inset, setInset] = useState(false);
  const [copied, setCopied] = useState(false);

  const shadow = `${inset ? "inset " : ""}${h}px ${v}px ${blur}px ${spread}px ${color}`;
  const css = `box-shadow: ${shadow};`;

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
            <label class="text-caption-uppercase text-muted block mb-1">Horizontal Offset: {h}px</label>
            <input type="range" min={-50} max={50} value={h} onInput={(e) => setH(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Vertical Offset: {v}px</label>
            <input type="range" min={-50} max={50} value={v} onInput={(e) => setV(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Blur Radius: {blur}px</label>
            <input type="range" min={0} max={100} value={blur} onInput={(e) => setBlur(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Spread Radius: {spread}px</label>
            <input type="range" min={-50} max={50} value={spread} onInput={(e) => setSpread(Number((e.target as HTMLInputElement).value))} class="w-full" />
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">Shadow Color</label>
            <div class="flex gap-2">
              <input type="color" value={color.slice(0, 7)} onInput={(e) => setColor((e.target as HTMLInputElement).value)} class="w-10 h-10 rounded cursor-pointer border border-hairline" />
              <input class="input font-mono flex-1" value={color} onInput={(e) => setColor((e.target as HTMLInputElement).value)} />
            </div>
          </div>
          <div class="mb-6">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={inset} onChange={(e) => setInset((e.target as HTMLInputElement).checked)} class="w-4 h-4" />
              <span class="text-body-sm">Inset shadow</span>
            </label>
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
          <div class="bg-white rounded-lg p-8" style={{ width: 200, height: 200, boxShadow: shadow }}></div>
        </div>
      </div>
    </div>
  );
}
