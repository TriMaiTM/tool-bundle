import { useState, useMemo, useCallback } from "preact/hooks";

type Separator = "newline" | "space" | "comma" | "custom";

const SEPARATORS: { id: Separator; label: string; value: string }[] = [
  { id: "newline", label: "Newline", value: "\n" },
  { id: "space", label: "Space", value: " " },
  { id: "comma", label: "Comma", value: ", " },
  { id: "custom", label: "Custom", value: "" },
];

export default function TextRepeater() {
  const [text, setText] = useState("");
  const [count, setCount] = useState(5);
  const [separator, setSeparator] = useState<Separator>("newline");
  const [customSeparator, setCustomSeparator] = useState("");

  const result = useMemo(() => {
    if (!text || count < 1) return "";
    const sep =
      separator === "custom"
        ? customSeparator
        : SEPARATORS.find((s) => s.id === separator)?.value ?? "\n";
    return Array.from({ length: count }, () => text).join(sep);
  }, [text, count, separator, customSeparator]);

  const resultStats = useMemo(() => {
    if (!result) return { words: 0, characters: 0 };
    return {
      words: result.trim().split(/\s+/).filter(Boolean).length,
      characters: result.length,
    };
  }, [result]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  return (
    <div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div class="bg-surface-elevated rounded-lg p-3 text-center">
          <div class="text-title-lg text-primary">{count}</div>
          <div class="text-caption-uppercase text-muted mt-1">Repetitions</div>
        </div>
        <div class="bg-surface-elevated rounded-lg p-3 text-center">
          <div class="text-title-lg text-primary">{resultStats.words}</div>
          <div class="text-caption-uppercase text-muted mt-1">Words</div>
        </div>
        <div class="bg-surface-elevated rounded-lg p-3 text-center">
          <div class="text-title-lg text-primary">{resultStats.characters}</div>
          <div class="text-caption-uppercase text-muted mt-1">Characters</div>
        </div>
        <div class="bg-surface-elevated rounded-lg p-3 text-center">
          <div class="text-title-lg text-primary">{text ? text.split(/\s+/).filter(Boolean).length : 0}</div>
          <div class="text-caption-uppercase text-muted mt-1">Input Words</div>
        </div>
      </div>

      <div class="mb-4">
        <label class="text-caption-uppercase text-muted block mb-2">Input Text</label>
        <textarea
          class="textarea"
          style="min-height: 100px"
          placeholder="Type or paste the text you want to repeat..."
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
        />
      </div>

      <div class="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Repeat Count</label>
          <input
            class="input"
            type="number"
            min={1}
            max={1000}
            value={count}
            style="width: 120px"
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setCount(Math.max(1, Math.min(1000, v || 1)));
            }}
          />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Separator</label>
          <select
            class="input"
            style="width: auto; height: 40px"
            value={separator}
            onChange={(e) => setSeparator((e.target as HTMLSelectElement).value as Separator)}
          >
            {SEPARATORS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
        {separator === "custom" && (
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Custom Separator</label>
            <input
              class="input"
              type="text"
              placeholder="e.g. -- or |"
              value={customSeparator}
              style="width: 160px"
              onInput={(e) => setCustomSeparator((e.target as HTMLInputElement).value)}
            />
          </div>
        )}
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
          style="min-height: 200px; font-family: var(--font-mono); font-size: 13px"
          value={result}
          readOnly
          placeholder="Repeated text will appear here..."
        />
      </div>
    </div>
  );
}
