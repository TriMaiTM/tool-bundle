import { useState, useEffect, useCallback, useMemo, useRef } from "preact/hooks";

interface Question {
  id: string;
  text: string;
  options: [string, string, string, string];
  correctIndex: number;
}

interface Quiz {
  title: string;
  questions: Question[];
}

type Answers = Record<string, number>;

const STORAGE_KEY = "quiz-maker-data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

const OPTION_LABELS = ["A", "B", "C", "D"];

export default function QuizMaker() {
  const [mode, setMode] = useState<"create" | "take">("create");
  const [quiz, setQuiz] = useState<Quiz>({ title: "", questions: [] });

  // Create mode state
  const [qText, setQText] = useState("");
  const [qOpts, setQOpts] = useState<[string, string, string, string]>(["", "", "", ""]);
  const [qCorrect, setQCorrect] = useState(0);
  const [editQId, setEditQId] = useState<string | null>(null);

  // Take mode state
  const [answers, setAnswers] = useState<Answers>({});
  const [submitted, setSubmitted] = useState(false);
  const [reviewMode, setReviewMode] = useState(false);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(10);
  const [timeLeft, setTimeLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.questions) setQuiz(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(quiz));
    } catch {
      // ignore
    }
  }, [quiz]);

  // Timer
  useEffect(() => {
    if (mode === "take" && timerEnabled && !submitted && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mode, timerEnabled, submitted, timeLeft > 0]);

  const addQuestion = useCallback(() => {
    if (!qText.trim() || qOpts.some(o => !o.trim())) return;
    if (editQId) {
      setQuiz(prev => ({
        ...prev,
        questions: prev.questions.map(q =>
          q.id === editQId
            ? { ...q, text: qText.trim(), options: [...qOpts] as [string, string, string, string], correctIndex: qCorrect }
            : q
        ),
      }));
      setEditQId(null);
    } else {
      const newQ: Question = {
        id: generateId(),
        text: qText.trim(),
        options: [...qOpts] as [string, string, string, string],
        correctIndex: qCorrect,
      };
      setQuiz(prev => ({ ...prev, questions: [...prev.questions, newQ] }));
    }
    setQText("");
    setQOpts(["", "", "", ""]);
    setQCorrect(0);
  }, [qText, qOpts, qCorrect, editQId]);

  const deleteQuestion = useCallback((id: string) => {
    setQuiz(prev => ({ ...prev, questions: prev.questions.filter(q => q.id !== id) }));
  }, []);

  const startEditQuestion = useCallback((q: Question) => {
    setQText(q.text);
    setQOpts([...q.options]);
    setQCorrect(q.correctIndex);
    setEditQId(q.id);
  }, []);

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    quiz.questions.forEach(q => {
      if (answers[q.id] === q.correctIndex) correct++;
    });
    const total = quiz.questions.length;
    const pct = total > 0 ? (correct / total) * 100 : 0;
    return { correct, total, percentage: pct, passed: pct >= 70 };
  }, [submitted, answers, quiz.questions]);

  const startTake = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setReviewMode(false);
    setCurrentQIndex(0);
    if (timerEnabled) {
      setTimeLeft(timerMinutes * 60);
    }
    setMode("take");
  }, [timerEnabled, timerMinutes]);

  const handleAnswer = useCallback((qId: string, optIndex: number) => {
    if (submitted) return;
    setAnswers(prev => ({ ...prev, [qId]: optIndex }));
  }, [submitted]);

  const handleSubmit = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
  }, []);

  const restartQuiz = useCallback(() => {
    setAnswers({});
    setSubmitted(false);
    setReviewMode(false);
    setCurrentQIndex(0);
    if (timerEnabled) {
      setTimeLeft(timerMinutes * 60);
    }
  }, [timerEnabled, timerMinutes]);

  const formatTime = useCallback((seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  }, []);

  const currentQ = quiz.questions[currentQIndex];

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
          class={mode === "take" ? "btn-primary" : "btn-secondary"}
          onClick={startTake}
          disabled={quiz.questions.length === 0}
        >
          Take Quiz ({quiz.questions.length} questions)
        </button>
      </div>

      {mode === "create" && (
        <div class="space-y-6">
          {/* Quiz Title */}
          <div class="bg-surface-elevated rounded-lg p-3">
            <label class="text-caption-uppercase text-muted block mb-2">Quiz Title</label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Biology 101 Midterm"
              value={quiz.title}
              onInput={(e) => setQuiz(prev => ({ ...prev, title: (e.target as HTMLInputElement).value }))}
            />
          </div>

          {/* Add Question */}
          <div class="bg-surface-elevated rounded-lg p-3">
            <h3 class="text-title-lg text-primary mb-4">{editQId ? "Edit Question" : "Add Question"}</h3>
            <div class="space-y-4">
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Question Text</label>
                <textarea
                  class="textarea w-full"
                  rows={2}
                  placeholder="Enter the question..."
                  value={qText}
                  onInput={(e) => setQText((e.target as HTMLTextAreaElement).value)}
                />
              </div>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OPTION_LABELS.map((label, i) => (
                  <div key={label}>
                    <label class="text-caption-uppercase text-muted block mb-2">Option {label}</label>
                    <input
                      type="text"
                      class="input w-full"
                      placeholder={`Option ${label}`}
                      value={qOpts[i]}
                      onInput={(e) => {
                        const next = [...qOpts] as [string, string, string, string];
                        next[i] = (e.target as HTMLInputElement).value;
                        setQOpts(next);
                      }}
                    />
                  </div>
                ))}
              </div>
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">Correct Answer</label>
                <select
                  class="input w-full"
                  value={qCorrect}
                  onChange={(e) => setQCorrect(parseInt((e.target as HTMLSelectElement).value))}
                >
                  {OPTION_LABELS.map((label, i) => (
                    <option key={i} value={i}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary" onClick={addQuestion}>
                  {editQId ? "Update Question" : "Add Question"}
                </button>
                {editQId && (
                  <button
                    class="btn-secondary"
                    onClick={() => {
                      setEditQId(null);
                      setQText("");
                      setQOpts(["", "", "", ""]);
                      setQCorrect(0);
                    }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Question List */}
          {quiz.questions.length > 0 && (
            <div class="bg-surface-elevated rounded-lg p-3">
              <h3 class="text-title-lg text-primary mb-4">Questions ({quiz.questions.length})</h3>
              <div class="space-y-3">
                {quiz.questions.map((q, idx) => (
                  <div key={q.id} class="p-3 border border-hairline rounded-lg">
                    <div class="flex items-start justify-between gap-3">
                      <div class="flex-1 min-w-0">
                        <div class="text-body-strong">
                          <span class="badge badge-yellow mr-2">Q{idx + 1}</span>
                          {q.text}
                        </div>
                        <div class="mt-2 grid grid-cols-2 gap-1 text-body-sm">
                          {q.options.map((opt, oi) => (
                            <div key={oi} class={oi === q.correctIndex ? "text-accent-emerald font-semibold" : "text-muted"}>
                              {OPTION_LABELS[oi]}. {opt}
                              {oi === q.correctIndex && " ✓"}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div class="flex gap-2 shrink-0">
                        <button class="btn-secondary text-body-sm" onClick={() => startEditQuestion(q)}>
                          Edit
                        </button>
                        <button class="btn-secondary text-body-sm" onClick={() => deleteQuestion(q.id)}>
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quiz Preview */}
          {quiz.questions.length > 0 && (
            <div class="bg-surface-elevated rounded-lg p-3">
              <h3 class="text-title-lg text-primary mb-2">Quiz Preview</h3>
              <p class="text-body-sm text-muted">
                {quiz.title || "Untitled Quiz"} — {quiz.questions.length} question{quiz.questions.length !== 1 ? "s" : ""}
              </p>
            </div>
          )}
        </div>
      )}

      {mode === "take" && (
        <div class="space-y-6">
          {/* Timer Settings */}
          {!submitted && (
            <div class="bg-surface-elevated rounded-lg p-3">
              <div class="flex flex-wrap items-center gap-4">
                <label class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={timerEnabled}
                    onChange={(e) => {
                      const checked = (e.target as HTMLInputElement).checked;
                      setTimerEnabled(checked);
                      if (checked) setTimeLeft(timerMinutes * 60);
                    }}
                    class="rounded border-hairline"
                  />
                  <span class="text-body-sm">Enable Timer</span>
                </label>
                {timerEnabled && (
                  <div class="flex items-center gap-2">
                    <input
                      type="number"
                      class="input w-20"
                      min={1}
                      max={180}
                      value={timerMinutes}
                      onInput={(e) => {
                        const v = parseInt((e.target as HTMLInputElement).value);
                        setTimerMinutes(v);
                        if (!submitted) setTimeLeft(v * 60);
                      }}
                    />
                    <span class="text-body-sm text-muted">minutes</span>
                  </div>
                )}
                {timerEnabled && !submitted && (
                  <span class="badge badge-yellow text-body-sm">{formatTime(timeLeft)}</span>
                )}
              </div>
            </div>
          )}

          {quiz.title && (
            <h2 class="text-title-lg text-primary">{quiz.title}</h2>
          )}

          {!submitted && currentQ && (
            <>
              {/* Question Navigator */}
              <div class="flex flex-wrap gap-2">
                {quiz.questions.map((q, i) => (
                  <button
                    key={q.id}
                    class={`badge ${i === currentQIndex ? "badge-yellow" : answers[q.id] !== undefined ? "bg-accent-emerald text-white" : ""} cursor-pointer`}
                    onClick={() => setCurrentQIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              {/* Current Question */}
              <div class="bg-surface-elevated rounded-lg p-6">
                <div class="text-caption-uppercase text-muted mb-2">
                  Question {currentQIndex + 1} of {quiz.questions.length}
                </div>
                <p class="text-body-strong mb-4">{currentQ.text}</p>
                <div class="space-y-3">
                  {currentQ.options.map((opt, i) => (
                    <label
                      key={i}
                      class={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors border ${
                        answers[currentQ.id] === i
                          ? "border-primary bg-primary/10"
                          : "border-hairline hover:bg-surface-soft/50"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${currentQ.id}`}
                        checked={answers[currentQ.id] === i}
                        onChange={() => handleAnswer(currentQ.id, i)}
                        class="border-hairline"
                      />
                      <span>
                        <span class="text-body-strong mr-2">{OPTION_LABELS[i]}.</span>
                        {opt}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Navigation */}
              <div class="flex items-center justify-between">
                <button
                  class="btn-secondary"
                  onClick={() => setCurrentQIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQIndex === 0}
                >
                  Previous
                </button>
                {currentQIndex < quiz.questions.length - 1 ? (
                  <button
                    class="btn-primary"
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                  >
                    Next
                  </button>
                ) : (
                  <button class="btn-primary" onClick={handleSubmit}>
                    Submit Quiz
                  </button>
                )}
              </div>
            </>
          )}

          {/* Results */}
          {submitted && score && !reviewMode && (
            <div class="space-y-4">
              <div class="bg-surface-elevated rounded-lg p-6 text-center">
                <div class="text-title-lg text-primary mb-2">
                  {score.correct} / {score.total}
                </div>
                <div class="text-title-lg text-primary mb-2">{score.percentage.toFixed(1)}%</div>
                <div class={`badge ${score.passed ? "bg-accent-emerald text-white" : "bg-accent-rose text-white"} text-body-sm`}>
                  {score.passed ? "PASSED" : "FAILED"}
                </div>
                <p class="text-body-sm text-muted mt-2">Passing threshold: 70%</p>
              </div>

              {/* Per-question result */}
              <div class="bg-surface-elevated rounded-lg p-3">
                <h3 class="text-title-lg text-primary mb-4">Results</h3>
                <div class="space-y-2">
                  {quiz.questions.map((q, i) => {
                    const userAns = answers[q.id];
                    const isCorrect = userAns === q.correctIndex;
                    return (
                      <div key={q.id} class="flex items-center gap-3 p-3 border border-hairline rounded-lg">
                        <span class={`badge ${isCorrect ? "bg-accent-emerald text-white" : "bg-accent-rose text-white"}`}>
                          {isCorrect ? "✓" : "✗"}
                        </span>
                        <span class="text-body-sm flex-1 truncate">Q{i + 1}: {q.text}</span>
                        {!isCorrect && (
                          <span class="text-body-sm text-accent-emerald shrink-0">
                            Correct: {OPTION_LABELS[q.correctIndex]}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div class="flex gap-3">
                <button class="btn-primary" onClick={() => setReviewMode(true)}>
                  Review Answers
                </button>
                <button class="btn-secondary" onClick={restartQuiz}>
                  Retake Quiz
                </button>
                <button class="btn-secondary" onClick={() => setMode("create")}>
                  Back to Editor
                </button>
              </div>
            </div>
          )}

          {/* Review Mode */}
          {submitted && reviewMode && (
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-title-lg text-primary">Review</h3>
                <button class="btn-secondary" onClick={() => setReviewMode(false)}>
                  Back to Results
                </button>
              </div>
              {quiz.questions.map((q, i) => {
                const userAns = answers[q.id];
                const isCorrect = userAns === q.correctIndex;
                return (
                  <div key={q.id} class="bg-surface-elevated rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-2">
                      <span class={`badge ${isCorrect ? "bg-accent-emerald text-white" : "bg-accent-rose text-white"}`}>
                        {isCorrect ? "Correct" : "Incorrect"}
                      </span>
                      <span class="text-caption-uppercase text-muted">Question {i + 1}</span>
                    </div>
                    <p class="text-body-strong mb-3">{q.text}</p>
                    <div class="space-y-2">
                      {q.options.map((opt, oi) => {
                        const isUser = userAns === oi;
                        const isRight = q.correctIndex === oi;
                        let cls = "text-muted";
                        if (isRight) cls = "text-accent-emerald font-semibold";
                        else if (isUser && !isRight) cls = "text-accent-rose font-semibold";
                        return (
                          <div key={oi} class={`text-body-sm ${cls}`}>
                            {OPTION_LABELS[oi]}. {opt}
                            {isRight && " ✓ (correct)"}
                            {isUser && !isRight && " ✗ (your answer)"}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
