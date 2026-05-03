import { useState, useEffect, useCallback, useMemo } from "preact/hooks";

interface Card {
  id: string;
  front: string;
  back: string;
}

type StudyRating = "know" | "unsure" | "dontknow" | null;

interface StudyState {
  currentIndex: number;
  flipped: boolean;
  ratings: Record<string, StudyRating>;
  shuffled: boolean;
}

const STORAGE_KEY = "flashcard-maker-data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function FlashcardMaker() {
  const [mode, setMode] = useState<"create" | "study">("create");
  const [cards, setCards] = useState<Card[]>([]);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [study, setStudy] = useState<StudyState>({
    currentIndex: 0,
    flipped: false,
    ratings: {},
    shuffled: false,
  });

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setCards(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // ignore
    }
  }, [cards]);

  const addCard = useCallback(() => {
    if (!front.trim() || !back.trim()) return;
    if (editId) {
      setCards(prev =>
        prev.map(c => (c.id === editId ? { ...c, front: front.trim(), back: back.trim() } : c))
      );
      setEditId(null);
    } else {
      setCards(prev => [...prev, { id: generateId(), front: front.trim(), back: back.trim() }]);
    }
    setFront("");
    setBack("");
  }, [front, back, editId]);

  const deleteCard = useCallback((id: string) => {
    setCards(prev => prev.filter(c => c.id !== id));
  }, []);

  const startEdit = useCallback((card: Card) => {
    setFront(card.front);
    setBack(card.back);
    setEditId(card.id);
  }, []);

  const bulkAdd = useCallback(() => {
    const lines = bulkText
      .split("\n")
      .map(l => l.trim())
      .filter(l => l.includes("|"));
    if (lines.length === 0) return;
    const newCards: Card[] = lines.map(line => {
      const [f, b] = line.split("|").map(s => s.trim());
      return { id: generateId(), front: f, back: b || "" };
    });
    setCards(prev => [...prev, ...newCards]);
    setBulkText("");
  }, [bulkText]);

  const exportJson = useCallback(() => {
    const json = JSON.stringify(cards, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [cards]);

  const importJson = useCallback((e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (Array.isArray(parsed)) {
          const imported: Card[] = parsed.map((c: any) => ({
            id: c.id || generateId(),
            front: String(c.front || ""),
            back: String(c.back || ""),
          }));
          setCards(prev => [...prev, ...imported]);
        }
      } catch {
        // ignore
      }
    };
    reader.readAsText(file);
  }, []);

  // Study mode helpers
  const studyCards = useMemo(() => {
    if (study.shuffled) return shuffleArray(cards);
    return cards;
  }, [cards, study.shuffled]);

  const currentCard = studyCards[study.currentIndex];

  const score = useMemo(() => {
    const entries = Object.values(study.ratings);
    return {
      correct: entries.filter(r => r === "know").length,
      incorrect: entries.filter(r => r === "dontknow").length,
      unsure: entries.filter(r => r === "unsure").length,
      total: studyCards.length,
    };
  }, [study.ratings, studyCards.length]);

  const progressPercent = useMemo(() => {
    const reviewed = Object.keys(study.ratings).length;
    return studyCards.length > 0 ? (reviewed / studyCards.length) * 100 : 0;
  }, [study.ratings, studyCards.length]);

  const flipCard = useCallback(() => {
    setStudy(prev => ({ ...prev, flipped: !prev.flipped }));
  }, []);

  const rateCard = useCallback(
    (rating: StudyRating) => {
      if (!currentCard) return;
      setStudy(prev => ({
        ...prev,
        ratings: { ...prev.ratings, [currentCard.id]: rating },
        flipped: false,
        currentIndex: Math.min(prev.currentIndex + 1, studyCards.length - 1),
      }));
    },
    [currentCard, studyCards.length]
  );

  const nextCard = useCallback(() => {
    setStudy(prev => ({
      ...prev,
      currentIndex: Math.min(prev.currentIndex + 1, studyCards.length - 1),
      flipped: false,
    }));
  }, [studyCards.length]);

  const prevCard = useCallback(() => {
    setStudy(prev => ({
      ...prev,
      currentIndex: Math.max(prev.currentIndex - 1, 0),
      flipped: false,
    }));
  }, []);

  const shuffleCards = useCallback(() => {
    setStudy(prev => ({ ...prev, shuffled: !prev.shuffled, currentIndex: 0, flipped: false }));
  }, []);

  const restart = useCallback(() => {
    setStudy({ currentIndex: 0, flipped: false, ratings: {}, shuffled: false });
  }, []);

  return (
    <div class="space-y-6">
      {/* Mode Tabs */}
      <div class="flex gap-2">
        <button
          class={mode === "create" ? "btn-primary" : "btn-secondary"}
          onClick={() => setMode("create")}
        >
          Create
        </button>
        <button
          class={mode === "study" ? "btn-primary" : "btn-secondary"}
          onClick={() => {
            setMode("study");
            setStudy({ currentIndex: 0, flipped: false, ratings: {}, shuffled: false });
          }}
        >
          Study ({cards.length} cards)
        </button>
      </div>

      {mode === "create" && (
        <div class="space-y-6">
          {/* Add Card */}
          <div class="bg-surface-elevated rounded-lg p-3">
            <h3 class="text-title-lg text-primary mb-4">{editId ? "Edit Card" : "Add Card"}</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Front (Question/Term)</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="e.g. What is photosynthesis?"
                  value={front}
                  onInput={(e) => setFront((e.target as HTMLInputElement).value)}
                />
              </div>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Back (Answer/Definition)</label>
                <input
                  type="text"
                  class="input w-full"
                  placeholder="e.g. The process by which plants convert sunlight into energy"
                  value={back}
                  onInput={(e) => setBack((e.target as HTMLInputElement).value)}
                />
              </div>
            </div>
            <div class="flex gap-2">
              <button class="btn-primary" onClick={addCard}>
                {editId ? "Update Card" : "Add Card"}
              </button>
              {editId && (
                <button
                  class="btn-secondary"
                  onClick={() => {
                    setEditId(null);
                    setFront("");
                    setBack("");
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          {/* Bulk Add */}
          <div class="bg-surface-elevated rounded-lg p-3">
            <h3 class="text-title-lg text-primary mb-4">Bulk Add</h3>
            <p class="text-caption-uppercase text-muted mb-2">Paste "front | back" pairs, one per line:</p>
            <textarea
              class="textarea w-full"
              rows={4}
              placeholder="What is 2+2? | 4\nCapital of France? | Paris"
              value={bulkText}
              onInput={(e) => setBulkText((e.target as HTMLTextAreaElement).value)}
            />
            <button class="btn-primary mt-3" onClick={bulkAdd}>
              Add All
            </button>
          </div>

          {/* Import / Export */}
          <div class="bg-surface-elevated rounded-lg p-3">
            <h3 class="text-title-lg text-primary mb-4">Import / Export</h3>
            <div class="flex flex-wrap gap-3">
              <button class="btn-primary" onClick={exportJson} disabled={cards.length === 0}>
                Export JSON
              </button>
              <label class="btn-secondary cursor-pointer inline-block">
                Import JSON
                <input type="file" accept=".json" class="hidden" onChange={importJson} />
              </label>
            </div>
          </div>

          {/* Card List */}
          {cards.length > 0 && (
            <div class="bg-surface-elevated rounded-lg p-3">
              <h3 class="text-title-lg text-primary mb-4">Cards ({cards.length})</h3>
              <div class="space-y-2">
                {cards.map((card) => (
                  <div
                    key={card.id}
                    class="flex items-center justify-between p-3 border border-hairline rounded-lg"
                  >
                    <div class="flex-1 min-w-0 mr-3">
                      <div class="text-body-strong truncate">{card.front}</div>
                      <div class="text-muted text-body-sm truncate">{card.back}</div>
                    </div>
                    <div class="flex gap-2 shrink-0">
                      <button class="btn-secondary text-body-sm" onClick={() => startEdit(card)}>
                        Edit
                      </button>
                      <button class="btn-secondary text-body-sm" onClick={() => deleteCard(card.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {mode === "study" && (
        <div class="space-y-6">
          {cards.length === 0 ? (
            <div class="bg-surface-elevated rounded-lg p-6 text-center">
              <p class="text-muted">No cards yet. Go to Create mode to add flashcards.</p>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div class="flex flex-wrap items-center gap-3">
                <span class="text-caption-uppercase text-muted">
                  Card {study.currentIndex + 1} of {studyCards.length}
                </span>
                <button class="btn-secondary text-body-sm" onClick={shuffleCards}>
                  {study.shuffled ? "Unshuffle" : "Shuffle"}
                </button>
                <button class="btn-secondary text-body-sm" onClick={restart}>
                  Restart
                </button>
              </div>

              {/* Progress Bar */}
              <div class="bg-surface-elevated rounded-lg p-3">
                <div class="flex justify-between text-body-sm text-muted mb-2">
                  <span>Progress</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div class="h-2 bg-hairline rounded-full overflow-hidden">
                  <div
                    class="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Score */}
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-surface-elevated rounded-lg p-3 text-center">
                  <div class="text-title-lg text-accent-emerald">{score.correct}</div>
                  <div class="text-caption text-muted">Know it</div>
                </div>
                <div class="bg-surface-elevated rounded-lg p-3 text-center">
                  <div class="text-title-lg text-yellow-500">{score.unsure}</div>
                  <div class="text-caption text-muted">Not sure</div>
                </div>
                <div class="bg-surface-elevated rounded-lg p-3 text-center">
                  <div class="text-title-lg text-accent-rose">{score.incorrect}</div>
                  <div class="text-caption text-muted">Don't know</div>
                </div>
              </div>

              {/* Card Display */}
              {currentCard && (
                <div class="bg-surface-elevated rounded-lg p-6">
                  <div
                    class="min-h-[160px] flex items-center justify-center cursor-pointer select-none"
                    onClick={flipCard}
                  >
                    {!study.flipped ? (
                      <div class="text-center">
                        <div class="text-caption-uppercase text-muted mb-2">Front</div>
                        <div class="text-title-lg text-primary">{currentCard.front}</div>
                        <div class="text-body-sm text-muted mt-4">Click to reveal answer</div>
                      </div>
                    ) : (
                      <div class="text-center">
                        <div class="text-caption-uppercase text-muted mb-2">Back</div>
                        <div class="text-title-lg text-primary">{currentCard.back}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Navigation */}
              <div class="flex items-center justify-between">
                <button
                  class="btn-secondary"
                  onClick={prevCard}
                  disabled={study.currentIndex === 0}
                >
                  Previous
                </button>
                <button
                  class="btn-secondary"
                  onClick={nextCard}
                  disabled={study.currentIndex >= studyCards.length - 1}
                >
                  Next
                </button>
              </div>

              {/* Rating Buttons */}
              {study.flipped && (
                <div class="bg-surface-elevated rounded-lg p-3">
                  <p class="text-caption-uppercase text-muted mb-3">How well did you know it?</p>
                  <div class="flex flex-wrap gap-3">
                    <button class="btn-primary" onClick={() => rateCard("know")}>
                      Know it
                    </button>
                    <button
                      class="btn-secondary"
                      style="background-color: #854d0e; color: white;"
                      onClick={() => rateCard("unsure")}
                    >
                      Not sure
                    </button>
                    <button class="btn-secondary" onClick={() => rateCard("dontknow")}>
                      Don't know
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
