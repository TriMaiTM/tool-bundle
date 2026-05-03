import { useState, useMemo, useEffect } from "preact/hooks";

type InputMode = "lmp" | "dueDate";

interface Milestone {
  week: number;
  label: string;
}

const MILESTONES: Milestone[] = [
  { week: 6, label: "Heartbeat detectable" },
  { week: 12, label: "End of first trimester" },
  { week: 20, label: "Anatomy scan" },
  { week: 24, label: "Viability milestone" },
  { week: 28, label: "Third trimester begins" },
  { week: 37, label: "Full term" },
];

function getTrimester(week: number): { name: string; color: string; number: number } {
  if (week <= 12) return { name: "First Trimester", color: "text-accent-blue", number: 1 };
  if (week <= 27) return { name: "Second Trimester", color: "text-accent-emerald", number: 2 };
  return { name: "Third Trimester", color: "text-accent-rose", number: 3 };
}

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((b.getTime() - a.getTime()) / msPerDay);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export default function PregnancyDueDate() {
  const [inputMode, setInputMode] = useState<InputMode>("lmp");
  const [lmpDate, setLmpDate] = useState("");
  const [dueDateInput, setDueDateInput] = useState("");
  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setToday(new Date());
    }, 60000 * 60); // update every hour
    return () => clearInterval(interval);
  }, []);

  const result = useMemo(() => {
    let lmp: Date;
    let dueDate: Date;

    if (inputMode === "lmp") {
      if (!lmpDate) return null;
      lmp = new Date(lmpDate + "T00:00:00");
      if (isNaN(lmp.getTime())) return null;
      dueDate = addDays(lmp, 280);
    } else {
      if (!dueDateInput) return null;
      dueDate = new Date(dueDateInput + "T00:00:00");
      if (isNaN(dueDate.getTime())) return null;
      lmp = addDays(dueDate, -280);
    }

    const daysPregnant = daysBetween(lmp, today);
    const currentWeek = Math.floor(daysPregnant / 7);
    const daysIntoWeek = daysPregnant % 7;
    const daysRemaining = daysBetween(today, dueDate);
    const weeksRemaining = Math.max(0, Math.floor(daysRemaining / 7));
    const trimester = getTrimester(currentWeek);
    const progressPct = Math.min(100, Math.max(0, (daysPregnant / 280) * 100));

    // Handle past due
    const isPastDue = daysRemaining < 0;
    const absDaysRemaining = Math.abs(daysRemaining);

    return {
      lmp,
      dueDate,
      currentWeek: Math.max(0, currentWeek),
      daysIntoWeek: Math.max(0, daysIntoWeek),
      daysPregnant: Math.max(0, daysPregnant),
      daysRemaining,
      absDaysRemaining,
      weeksRemaining,
      trimester,
      progressPct,
      isPastDue,
    };
  }, [inputMode, lmpDate, dueDateInput, today]);

  return (
    <div class="space-y-6">
      {/* Input Section */}
      <div class="bg-surface-elevated rounded-lg p-6">
        {/* Mode toggle */}
        <div class="flex rounded-md overflow-hidden border border-hairline mb-6">
          <button
            class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
              inputMode === "lmp"
                ? "bg-primary text-on-primary"
                : "bg-surface-elevated text-body hover:text-on-dark"
            }`}
            onClick={() => setInputMode("lmp")}
          >
            Last Menstrual Period (LMP)
          </button>
          <button
            class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
              inputMode === "dueDate"
                ? "bg-primary text-on-primary"
                : "bg-surface-elevated text-body hover:text-on-dark"
            }`}
            onClick={() => setInputMode("dueDate")}
          >
            I know my due date
          </button>
        </div>

        {inputMode === "lmp" ? (
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              First Day of Last Menstrual Period
            </label>
            <input
              type="date"
              class="input w-full sm:w-auto"
              style="min-width: 240px"
              value={lmpDate}
              max={new Date().toISOString().split("T")[0]}
              onInput={(e) => setLmpDate((e.target as HTMLInputElement).value)}
            />
          </div>
        ) : (
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Due Date</label>
            <input
              type="date"
              class="input w-full sm:w-auto"
              style="min-width: 240px"
              value={dueDateInput}
              onInput={(e) => setDueDateInput((e.target as HTMLInputElement).value)}
            />
          </div>
        )}
      </div>

      {/* Results */}
      {result && (
        <div class="space-y-4">
          {/* Main info cards */}
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">
                {result.currentWeek}w {result.daysIntoWeek}d
              </div>
              <div class="text-caption text-muted mt-1">Current Week</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class={`text-title-lg ${result.isPastDue ? "text-accent-rose" : "text-primary"}`}>
                {result.isPastDue ? `+${result.absDaysRemaining}` : result.daysRemaining}
              </div>
              <div class="text-caption text-muted mt-1">
                {result.isPastDue ? "Days Past Due" : "Days Remaining"}
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class={`text-title-lg ${result.trimester.color}`}>
                T{result.trimester.number}
              </div>
              <div class="text-caption text-muted mt-1">{result.trimester.name}</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{Math.round(result.progressPct)}%</div>
              <div class="text-caption text-muted mt-1">Progress</div>
            </div>
          </div>

          {/* Due Date */}
          <div class="bg-surface-elevated rounded-lg p-6 text-center">
            <div class="text-caption-uppercase text-muted mb-2">Estimated Due Date</div>
            <div class="text-title-lg text-primary" style="font-size: 24px">
              {formatDate(result.dueDate)}
            </div>
            {result.isPastDue && (
              <div class="text-body-sm text-accent-rose mt-2">
                You're past your estimated due date. This is perfectly normal — most babies arrive
                within 2 weeks of the due date.
              </div>
            )}
          </div>

          {/* Timeline visualization */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">Pregnancy Timeline</h3>

            {/* Progress bar with trimesters */}
            <div class="relative mb-6">
              <div class="flex h-6 rounded-full overflow-hidden">
                <div class="bg-accent-blue/40" style="flex: 12" title="Trimester 1"></div>
                <div class="bg-accent-emerald/40" style="flex: 15" title="Trimester 2"></div>
                <div class="bg-accent-rose/40" style="flex: 13" title="Trimester 3"></div>
              </div>
              {/* Current position marker */}
              <div
                class="absolute top-0 -translate-x-1/2"
                style={`left: ${result.progressPct}%`}
              >
                <div class="w-0.5 h-6 bg-white" style="margin: 0 auto"></div>
                <div
                  class="bg-surface-card border border-hairline rounded px-2 py-1 text-body-sm text-primary text-center"
                  style="transform: translateX(-50%); min-width: 60px; position: relative; left: 50%; white-space: nowrap"
                >
                  Week {result.currentWeek}
                </div>
              </div>
            </div>

            {/* Trimester labels */}
            <div class="flex text-caption text-muted mb-6">
              <div style="flex: 12" class="text-center">
                <span class="text-accent-blue">●</span> Trimester 1 (1–12)
              </div>
              <div style="flex: 15" class="text-center">
                <span class="text-accent-emerald">●</span> Trimester 2 (13–27)
              </div>
              <div style="flex: 13" class="text-center">
                <span class="text-accent-rose">●</span> Trimester 3 (28–40)
              </div>
            </div>

            {/* Milestones */}
            <h4 class="text-body-sm text-body-strong mb-3">Key Milestones</h4>
            <div class="space-y-2">
              {MILESTONES.map((ms) => {
                const isPast = result.currentWeek >= ms.week;
                const isCurrent = result.currentWeek === ms.week;
                return (
                  <div
                    key={ms.week}
                    class={`flex items-center gap-3 p-2 rounded-lg ${
                      isCurrent
                        ? "bg-surface-soft border border-hairline"
                        : ""
                    }`}
                  >
                    <div
                      class={`w-6 h-6 rounded-full flex items-center justify-center text-caption ${
                        isPast
                          ? "bg-accent-emerald text-on-primary"
                          : "bg-surface-soft text-muted border border-hairline"
                      }`}
                    >
                      {isPast ? "✓" : ""}
                    </div>
                    <div class="flex-1">
                      <span
                        class={`text-body-sm ${isPast ? "text-body-strong" : "text-muted"}`}
                      >
                        Week {ms.week}: {ms.label}
                      </span>
                    </div>
                    {isCurrent && <span class="badge badge-yellow">Now</span>}
                  </div>
                );
              })}
            </div>
          </div>

          {/* LMP Date Display */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-3">Dates</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm text-muted">LMP Date</span>
                <span class="text-body-sm text-primary font-medium">
                  {result.lmp.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm text-muted">Due Date</span>
                <span class="text-body-sm text-primary font-medium">
                  {result.dueDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm text-muted">Days Pregnant</span>
                <span class="text-body-sm text-primary font-medium">{result.daysPregnant} days</span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-body-sm text-muted">Weeks Pregnant</span>
                <span class="text-body-sm text-primary font-medium">{result.currentWeek} weeks</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div class="bg-surface-elevated rounded-lg p-4 flex items-start gap-3">
            <span class="text-warning text-title-sm">⚠</span>
            <p class="text-body-sm text-muted">
              <strong class="text-body-strong">Disclaimer:</strong> This is an estimate based on a
              280-day (40-week) gestation period. Only about 5% of babies are born on their exact due
              date. Consult your healthcare provider for accurate dates and prenatal care.
            </p>
          </div>
        </div>
      )}

      {!result && (
        <div class="text-center py-8">
          <p class="text-muted">
            {inputMode === "lmp"
              ? "Enter the first day of your last menstrual period to estimate your due date."
              : "Enter your due date to calculate your current week of pregnancy."}
          </p>
        </div>
      )}
    </div>
  );
}
