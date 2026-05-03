import { useState, useEffect, useCallback, useMemo } from "preact/hooks";
import type { JSX } from "preact";

interface Exam {
  id: string;
  subject: string;
  date: string;
  difficulty: "easy" | "medium" | "hard";
  hoursNeeded: number;
}

interface StudySession {
  id: string;
  examId: string;
  date: string;
  hours: number;
  completed: boolean;
}

const STORAGE_KEY = "study-planner-data";

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function daysBetween(date1: string, date2: string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function todayStr(): string {
  const d = new Date();
  return d.toISOString().split("T")[0];
}

const DIFFICULTY_MULTIPLIER: Record<string, number> = {
  easy: 0.8,
  medium: 1.0,
  hard: 1.4,
};

export default function StudyPlanner() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(
    "medium",
  );
  const [hoursNeeded, setHoursNeeded] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [viewDate, setViewDate] = useState(todayStr());

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.exams) setExams(parsed.exams);
        if (parsed.sessions) setSessions(parsed.sessions);
      }
    } catch {
      // ignore
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ exams, sessions }));
    } catch {
      // ignore
    }
  }, [exams, sessions]);

  const addExam = useCallback(() => {
    if (!subject.trim() || !examDate || !hoursNeeded) return;
    const hrs = parseFloat(hoursNeeded);
    if (isNaN(hrs) || hrs <= 0) return;

    if (editId) {
      setExams((prev) =>
        prev.map((e) =>
          e.id === editId
            ? {
                ...e,
                subject: subject.trim(),
                date: examDate,
                difficulty,
                hoursNeeded: hrs,
              }
            : e,
        ),
      );
      setEditId(null);
    } else {
      setExams((prev) => [
        ...prev,
        {
          id: generateId(),
          subject: subject.trim(),
          date: examDate,
          difficulty,
          hoursNeeded: hrs,
        },
      ]);
    }
    setSubject("");
    setExamDate("");
    setDifficulty("medium");
    setHoursNeeded("");
  }, [subject, examDate, difficulty, hoursNeeded, editId]);

  const deleteExam = useCallback((id: string) => {
    setExams((prev) => prev.filter((e) => e.id !== id));
    setSessions((prev) => prev.filter((s) => s.examId !== id));
  }, []);

  const startEdit = useCallback((exam: Exam) => {
    setSubject(exam.subject);
    setExamDate(exam.date);
    setDifficulty(exam.difficulty);
    setHoursNeeded(String(exam.hoursNeeded));
    setEditId(exam.id);
  }, []);

  const sortedExams = useMemo(() => {
    return [...exams].sort((a, b) => a.date.localeCompare(b.date));
  }, [exams]);

  // Auto-generate study plan
  const generatePlan = useCallback(() => {
    const today = todayStr();
    const newSessions: StudySession[] = [];

    exams.forEach((exam) => {
      const days = daysBetween(today, exam.date);
      if (days <= 0) return;

      const multiplier = DIFFICULTY_MULTIPLIER[exam.difficulty] || 1;
      const totalHours = exam.hoursNeeded * multiplier;
      const hoursPerDay = Math.max(0.5, totalHours / days);

      for (let i = 0; i < days; i++) {
        const d = new Date(today + "T00:00:00");
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split("T")[0];
        newSessions.push({
          id: generateId(),
          examId: exam.id,
          date: dateStr,
          hours: Math.round(hoursPerDay * 10) / 10,
          completed: false,
        });
      }
    });

    setSessions(newSessions);
  }, [exams]);

  const toggleSession = useCallback((id: string) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, completed: !s.completed } : s)),
    );
  }, []);

  // Sessions for the selected date
  const daySessions = useMemo(() => {
    return sessions.filter((s) => s.date === viewDate);
  }, [sessions, viewDate]);

  // All dates that have sessions
  const allDates = useMemo(() => {
    const dates = new Set(sessions.map((s) => s.date));
    return Array.from(dates).sort();
  }, [sessions]);

  // Stats
  const stats = useMemo(() => {
    const total = sessions.reduce((sum, s) => sum + s.hours, 0);
    const completed = sessions
      .filter((s) => s.completed)
      .reduce((sum, s) => sum + s.hours, 0);
    return { total, completed, remaining: total - completed };
  }, [sessions]);

  // Date navigation
  const shiftDate = useCallback(
    (offset: number) => {
      const d = new Date(viewDate + "T00:00:00");
      d.setDate(d.getDate() + offset);
      setViewDate(d.toISOString().split("T")[0]);
    },
    [viewDate],
  );

  const getExamForSession = useCallback(
    (examId: string) => {
      return exams.find((e) => e.id === examId);
    },
    [exams],
  );

  return (
    <div class="space-y-6">
      {/* Input */}
      <div class="bg-surface-elevated rounded-lg p-3">
        <h3 class="text-title-lg text-primary mb-4">
          {editId ? "Edit Exam" : "Add Exam"}
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Subject Name
            </label>
            <input
              type="text"
              class="input w-full"
              placeholder="e.g. Calculus II"
              value={subject}
              onInput={(e) => setSubject((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Exam Date
            </label>
            <input
              type="date"
              class="input w-full"
              value={examDate}
              onInput={(e) => setExamDate((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Difficulty
            </label>
            <select
              class="input w-full"
              value={difficulty}
              onChange={(e) =>
                setDifficulty(
                  (e.target as HTMLSelectElement).value as
                    | "easy"
                    | "medium"
                    | "hard",
                )
              }
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Hours Needed
            </label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 20"
              min={1}
              value={hoursNeeded}
              onInput={(e) =>
                setHoursNeeded((e.target as HTMLInputElement).value)
              }
            />
          </div>
        </div>
        <div class="flex gap-2">
          <button class="btn-primary" onClick={addExam}>
            {editId ? "Update Exam" : "Add Exam"}
          </button>
          {editId && (
            <button
              class="btn-secondary"
              onClick={() => {
                setEditId(null);
                setSubject("");
                setExamDate("");
                setDifficulty("medium");
                setHoursNeeded("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Exam List */}
      {sortedExams.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-title-lg text-primary">
              Exams ({sortedExams.length})
            </h3>
            <button class="btn-primary text-body-sm" onClick={generatePlan}>
              Generate Study Plan
            </button>
          </div>
          <div class="space-y-2">
            {sortedExams.map((exam) => {
              const days = daysBetween(todayStr(), exam.date);
              const diffColor =
                exam.difficulty === "hard"
                  ? "text-accent-rose"
                  : exam.difficulty === "medium"
                    ? "text-yellow-500"
                    : "text-accent-emerald";
              return (
                <div
                  key={exam.id}
                  class="flex items-center justify-between p-3 border border-hairline rounded-lg"
                >
                  <div class="flex-1 min-w-0 mr-3">
                    <div class="text-body-strong">{exam.subject}</div>
                    <div class="text-body-sm text-muted">
                      {formatDate(exam.date)} ·{" "}
                      {days > 0 ? `${days} days away` : "Past due"} ·{" "}
                      <span class={diffColor}>{exam.difficulty}</span> ·{" "}
                      {exam.hoursNeeded}h needed
                    </div>
                  </div>
                  <div class="flex gap-2 shrink-0">
                    <button
                      class="btn-secondary text-body-sm"
                      onClick={() => startEdit(exam)}
                    >
                      Edit
                    </button>
                    <button
                      class="btn-secondary text-body-sm"
                      onClick={() => deleteExam(exam.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Stats */}
      {sessions.length > 0 && (
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-primary">
              {stats.total.toFixed(1)}h
            </div>
            <div class="text-caption text-muted mt-1">Total Study Hours</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-accent-emerald">
              {stats.completed.toFixed(1)}h
            </div>
            <div class="text-caption text-muted mt-1">Hours Completed</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <div class="text-title-lg text-accent-rose">
              {stats.remaining.toFixed(1)}h
            </div>
            <div class="text-caption text-muted mt-1">Hours Remaining</div>
          </div>
        </div>
      )}

      {/* Daily Schedule View */}
      {sessions.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <h3 class="text-title-lg text-primary mb-4">Daily Schedule</h3>

          {/* Date Navigator */}
          <div class="flex items-center justify-between mb-4">
            <button
              class="btn-secondary text-body-sm"
              onClick={() => shiftDate(-1)}
            >
              &larr; Previous
            </button>
            <span class="text-body-strong">{formatDate(viewDate)}</span>
            <button
              class="btn-secondary text-body-sm"
              onClick={() => shiftDate(1)}
            >
              Next &rarr;
            </button>
          </div>

          {/* Sessions for selected date */}
          {daySessions.length > 0 ? (
            <div class="space-y-2">
              {daySessions.map((session) => {
                const exam = getExamForSession(session.examId);
                return (
                  <div
                    key={session.id}
                    class={`flex items-center gap-3 p-3 rounded-lg border ${
                      session.completed
                        ? "border-accent-emerald/30 bg-accent-emerald/5"
                        : "border-hairline"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={session.completed}
                      onChange={() => toggleSession(session.id)}
                      class="rounded border-hairline"
                    />
                    <div class="flex-1">
                      <span
                        class={
                          session.completed
                            ? "line-through text-muted"
                            : "text-body-strong"
                        }
                      >
                        {exam?.subject || "Unknown"}
                      </span>
                      <span class="text-body-sm text-muted ml-2">
                        {session.hours}h
                      </span>
                    </div>
                    <span
                      class={`badge ${
                        exam?.difficulty === "hard"
                          ? "bg-accent-rose text-white"
                          : exam?.difficulty === "medium"
                            ? "badge-yellow"
                            : "bg-accent-emerald text-white"
                      }`}
                    >
                      {exam?.difficulty}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p class="text-muted text-body-sm text-center py-4">
              No study sessions for this date.
            </p>
          )}

          {/* Progress Bar */}
          {sessions.length > 0 && (
            <div class="mt-4">
              <div class="flex justify-between text-body-sm text-muted mb-2">
                <span>Overall Progress</span>
                <span>
                  {stats.total > 0
                    ? Math.round((stats.completed / stats.total) * 100)
                    : 0}
                  %
                </span>
              </div>
              <div class="h-2 bg-hairline rounded-full overflow-hidden">
                <div
                  class="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${stats.total > 0 ? (stats.completed / stats.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Calendar View */}
      {allDates.length > 0 && (
        <div class="bg-surface-elevated rounded-lg p-3">
          <h3 class="text-title-lg text-primary mb-4">Calendar Overview</h3>
          <div class="grid grid-cols-7 gap-1 text-center text-body-sm mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} class="text-caption-uppercase text-muted py-1">
                {d}
              </div>
            ))}
          </div>
          <div class="grid grid-cols-7 gap-1">
            {/* Find the first date and pad */}
            {(() => {
              if (allDates.length === 0) return null;
              const firstDate = new Date(allDates[0] + "T00:00:00");
              const startDay = firstDate.getDay();
              const lastDate = new Date(
                allDates[allDates.length - 1] + "T00:00:00",
              );
              const totalDays =
                daysBetween(allDates[0], allDates[allDates.length - 1]) + 1;
              const cells: JSX.Element[] = [];

              // Pad with empty cells
              for (let i = 0; i < startDay; i++) {
                cells.push(<div key={`pad-${i}`} class="p-1"></div>);
              }

              for (let i = 0; i < totalDays; i++) {
                const d = new Date(firstDate);
                d.setDate(d.getDate() + i);
                const dateStr = d.toISOString().split("T")[0];
                const daySess = sessions.filter((s) => s.date === dateStr);
                const hasSessions = daySess.length > 0;
                const completedCount = daySess.filter(
                  (s) => s.completed,
                ).length;
                const totalHrs = daySess.reduce((sum, s) => sum + s.hours, 0);
                const isToday = dateStr === todayStr();
                const isViewDate = dateStr === viewDate;

                cells.push(
                  <button
                    key={dateStr}
                    class={`p-1 rounded text-center min-h-[40px] text-body-sm transition-colors ${
                      isViewDate ? "ring-2 ring-primary" : ""
                    } ${isToday ? "font-bold" : ""} ${
                      hasSessions
                        ? completedCount === daySess.length
                          ? "bg-accent-emerald/20 text-accent-emerald"
                          : "bg-primary/10 text-primary"
                        : "text-muted"
                    }`}
                    onClick={() => setViewDate(dateStr)}
                  >
                    <div>{d.getDate()}</div>
                    {hasSessions && <div class="text-[10px]">{totalHrs}h</div>}
                  </button>,
                );
              }
              return cells;
            })()}
          </div>
          <div class="flex flex-wrap gap-3 mt-3 text-body-sm">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-primary/20"></div>
              <span class="text-muted">In progress</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-accent-emerald/20"></div>
              <span class="text-muted">Completed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
