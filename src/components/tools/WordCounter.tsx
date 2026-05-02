import { useState, useMemo } from "preact/hooks";

export default function WordCounter() {
  const [text, setText] = useState("");

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return { characters: 0, charactersNoSpaces: 0, words: 0, sentences: 0, paragraphs: 0, lines: 0 };
    }
    return {
      characters: text.length,
      charactersNoSpaces: text.replace(/\s/g, "").length,
      words: trimmed.split(/\s+/).filter(Boolean).length,
      sentences: trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length,
      paragraphs: trimmed.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length,
      lines: text.split("\n").length,
    };
  }, [text]);

  const statItems = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "No Spaces", value: stats.charactersNoSpaces },
    { label: "Sentences", value: stats.sentences },
    { label: "Paragraphs", value: stats.paragraphs },
    { label: "Lines", value: stats.lines },
  ];

  return (
    <div>
      <div class="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {statItems.map((item) => (
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{item.value}</div>
            <div class="text-caption text-muted mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <textarea
        class="textarea"
        style="min-height: 300px"
        placeholder="Start typing or paste your text here..."
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
