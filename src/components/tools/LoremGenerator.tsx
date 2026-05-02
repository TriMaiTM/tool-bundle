import { useState, useCallback } from "preact/hooks";

const LOREM_WORDS = "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua enim ad minim veniam quis nostrud exercitation ullamco laboris nisi aliquip ex ea commodo consequat duis aute irure in reprehenderit voluptate velit esse cillum fugiat nulla pariatur excepteur sint occaecat cupidatat non proident sunt culpa qui officia deserunt mollit anim id est laborum".split(" ");

function generateWords(count: number): string {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    result.push(LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
  }
  return result.join(" ");
}

function generateSentence(): string {
  const length = 8 + Math.floor(Math.random() * 12);
  const words = generateWords(length);
  return words.charAt(0).toUpperCase() + words.slice(1) + ".";
}

function generateParagraph(): string {
  const sentenceCount = 3 + Math.floor(Math.random() * 5);
  return Array.from({ length: sentenceCount }, () => generateSentence()).join(" ");
}

type Mode = "paragraphs" | "sentences" | "words";

export default function LoremGenerator() {
  const [mode, setMode] = useState<Mode>("paragraphs");
  const [count, setCount] = useState(3);
  const [result, setResult] = useState("");

  const generate = useCallback(() => {
    let text = "";
    if (mode === "paragraphs") {
      text = Array.from({ length: count }, () => generateParagraph()).join("\n\n");
    } else if (mode === "sentences") {
      text = Array.from({ length: count }, () => generateSentence()).join(" ");
    } else {
      text = generateWords(count);
    }
    setResult(text);
  }, [mode, count]);

  const handleCopy = useCallback(async () => {
    if (result) await navigator.clipboard.writeText(result);
  }, [result]);

  return (
    <div>
      <div class="flex flex-wrap items-center gap-3 mb-6">
        <div class="flex rounded-md overflow-hidden border border-hairline">
          {(["paragraphs", "sentences", "words"] as Mode[]).map((m) => (
            <button
              key={m}
              class={`px-4 py-2 text-body-sm font-medium transition-colors capitalize ${mode === m ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"}`}
              onClick={() => setMode(m)}
            >
              {m}
            </button>
          ))}
        </div>

        <input
          type="number"
          class="input"
          style="width: 80px; height: 36px"
          min={1}
          max={100}
          value={count}
          onInput={(e) => setCount(Math.max(1, Math.min(100, Number((e.target as HTMLInputElement).value) || 1)))}
        />

        <button class="btn-primary text-body-sm" style="height: 36px" onClick={generate}>
          Generate
        </button>
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
          style="min-height: 300px"
          value={result}
          readOnly
          placeholder='Click "Generate" to create placeholder text...'
        />
      </div>
    </div>
  );
}
