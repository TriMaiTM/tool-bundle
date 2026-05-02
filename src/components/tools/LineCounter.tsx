import { useState, useMemo } from "preact/hooks";

export default function LineCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    if (!text) return { total: 0, blank: 0, nonBlank: 0, words: 0, characters: 0 };
    const lines = text.split("\n");
    const blank = lines.filter((l) => l.trim().length === 0).length;
    return {
      total: lines.length,
      blank,
      nonBlank: lines.length - blank,
      words: text.trim().split(/\s+/).filter(Boolean).length,
      characters: text.length,
    };
  }, [text]);

  const statItems = [
    { label: "Total Lines", value: stats.total },
    { label: "Non-Blank", value: stats.nonBlank },
    { label: "Blank", value: stats.blank },
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
  ];

  return (
    <div>
      <div class="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-6">
        {statItems.map((item) => (
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{item.value}</div>
            <div class="text-caption text-muted mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <textarea
        class="textarea"
        style="min-height: 300px; font-family: var(--font-mono); font-size: 13px"
        placeholder="Paste your text or code here..."
        value={text}
        onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
      />

      {text && (
        <div class="mt-3 flex justify-end">
          <button class="btn-secondary text-body-sm" onClick={() => setText("")}>
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
