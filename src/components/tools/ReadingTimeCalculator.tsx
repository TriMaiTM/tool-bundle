import { useState, useMemo } from "preact/hooks";

function formatTime(seconds: number): string {
  if (seconds < 1) return "0 sec";
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins === 0) return `${secs} sec`;
  if (secs === 0) return `${mins} min`;
  return `${mins} min ${secs} sec`;
}

export default function ReadingTimeCalculator() {
  const [text, setText] = useState("");
  const [readingWpm, setReadingWpm] = useState(200);
  const [speakingWpm, setSpeakingWpm] = useState(150);

  const stats = useMemo(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      return {
        words: 0,
        characters: 0,
        sentences: 0,
        readingSeconds: 0,
        speakingSeconds: 0,
      };
    }
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const characters = text.length;
    const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const readingSeconds = (words / readingWpm) * 60;
    const speakingSeconds = (words / speakingWpm) * 60;

    return { words, characters, sentences, readingSeconds, speakingSeconds };
  }, [text, readingWpm, speakingWpm]);

  const statItems = [
    { label: "Words", value: stats.words },
    { label: "Characters", value: stats.characters },
    { label: "Sentences", value: stats.sentences },
    { label: "Reading Time", value: formatTime(stats.readingSeconds) },
    { label: "Speaking Time", value: formatTime(stats.speakingSeconds) },
  ];

  return (
    <div>
      <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {statItems.map((item) => (
          <div key={item.label} class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">{item.value}</div>
            <div class="text-caption-uppercase text-muted mt-1">{item.label}</div>
          </div>
        ))}
      </div>

      <div class="flex flex-wrap gap-4 mb-4">
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Reading WPM</label>
          <input
            class="input"
            type="number"
            min={50}
            max={1000}
            value={readingWpm}
            style="width: 120px"
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setReadingWpm(Math.max(50, Math.min(1000, v || 200)));
            }}
          />
        </div>
        <div>
          <label class="text-caption-uppercase text-muted block mb-2">Speaking WPM</label>
          <input
            class="input"
            type="number"
            min={50}
            max={500}
            value={speakingWpm}
            style="width: 120px"
            onInput={(e) => {
              const v = Number((e.target as HTMLInputElement).value);
              setSpeakingWpm(Math.max(50, Math.min(500, v || 150)));
            }}
          />
        </div>
      </div>

      <textarea
        class="textarea"
        style="min-height: 300px"
        placeholder="Type or paste your text to calculate reading and speaking time..."
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
