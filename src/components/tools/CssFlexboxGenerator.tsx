import { useState, useCallback } from "preact/hooks";

export default function CssFlexboxGenerator() {
  const [direction, setDirection] = useState("row");
  const [justify, setJustify] = useState("flex-start");
  const [align, setAlign] = useState("stretch");
  const [gap, setGap] = useState(16);
  const [wrap, setWrap] = useState(false);
  const [itemCount, setItemCount] = useState(4);
  const [copied, setCopied] = useState(false);

  const css = `display: flex;\nflex-direction: ${direction};\njustify-content: ${justify};\nalign-items: ${align};\ngap: ${gap}px;${wrap ? "\nflex-wrap: wrap;" : ""}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(css);
    } catch {
      /* ignore */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [css]);

  return (
    <div>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">
              Direction
            </label>
            <select
              class="input"
              value={direction}
              onChange={(e) =>
                setDirection((e.target as HTMLSelectElement).value)
              }
            >
              <option value="row">row</option>
              <option value="row-reverse">row-reverse</option>
              <option value="column">column</option>
              <option value="column-reverse">column-reverse</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">
              Justify Content
            </label>
            <select
              class="input"
              value={justify}
              onChange={(e) =>
                setJustify((e.target as HTMLSelectElement).value)
              }
            >
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="space-between">space-between</option>
              <option value="space-around">space-around</option>
              <option value="space-evenly">space-evenly</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">
              Align Items
            </label>
            <select
              class="input"
              value={align}
              onChange={(e) => setAlign((e.target as HTMLSelectElement).value)}
            >
              <option value="stretch">stretch</option>
              <option value="flex-start">flex-start</option>
              <option value="flex-end">flex-end</option>
              <option value="center">center</option>
              <option value="baseline">baseline</option>
            </select>
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">
              Gap: {gap}px
            </label>
            <input
              type="range"
              min={0}
              max={48}
              value={gap}
              onInput={(e) =>
                setGap(Number((e.target as HTMLInputElement).value))
              }
              class="w-full"
            />
          </div>
          <div class="mb-4">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={wrap}
                onChange={(e) =>
                  setWrap((e.target as HTMLInputElement).checked)
                }
                class="w-4 h-4"
              />
              <span class="text-body-sm">Flex wrap</span>
            </label>
          </div>
          <div class="mb-4">
            <label class="text-caption-uppercase text-muted block mb-1">
              Items: {itemCount}
            </label>
            <input
              type="range"
              min={2}
              max={12}
              value={itemCount}
              onInput={(e) =>
                setItemCount(Number((e.target as HTMLInputElement).value))
              }
              class="w-full"
            />
          </div>
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <label class="text-caption-uppercase text-muted">
                Generated CSS
              </label>
              <button
                class="text-body-sm text-primary hover:text-primary-active"
                onClick={handleCopy}
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre class="code-block font-mono" style="font-size: 13px">
              <code>{css}</code>
            </pre>
          </div>
        </div>
        <div class="flex items-center justify-center">
          <div
            style={{
              display: "flex",
              flexDirection: direction as any,
              justifyContent: justify,
              alignItems: align as any,
              gap: `${gap}px`,
              flexWrap: wrap ? "wrap" : "nowrap",
              width: "100%",
              maxWidth: 400,
              minHeight: 300,
              border: "1px dashed var(--color-hairline-strong)",
              borderRadius: 8,
              padding: 16,
            }}
          >
            {Array.from({ length: itemCount }).map((_, i) => (
              <div
                key={i}
                class="bg-primary/20 border border-primary/40 rounded-md flex items-center justify-center text-body-sm text-primary font-semibold"
                style={{ width: 60, height: 40 }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
