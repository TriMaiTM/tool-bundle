import { useState, useEffect, useCallback } from "preact/hooks";

interface Countdown {
  id: number;
  label: string;
  target: Date;
}

function getTimeRemaining(target: Date): { days: number; hours: number; minutes: number; seconds: number; expired: boolean } {
  const now = new Date().getTime();
  const diff = target.getTime() - now;

  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

function formatLocalDatetime(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const h = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

function nextMonday(): Date {
  const d = new Date();
  const day = d.getDay();
  const diff = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function nextNewYear(): Date {
  const now = new Date();
  const year = now.getMonth() === 0 && now.getDate() === 1 ? now.getFullYear() : now.getFullYear() + 1;
  return new Date(year, 0, 1, 0, 0, 0);
}

let nextId = 1;

export default function CountdownTimer() {
  const [countdowns, setCountdowns] = useState<Countdown[]>([
    { id: nextId++, label: "New Year", target: nextNewYear() },
  ]);
  const [dateInput, setDateInput] = useState("");
  const [labelInput, setLabelInput] = useState("");
  const [tick, setTick] = useState(0);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const addCountdown = useCallback(
    (target: Date, label?: string) => {
      setCountdowns((prev) => [
        ...prev,
        { id: nextId++, label: label || labelInput || `Countdown ${prev.length + 1}`, target },
      ]);
      setDateInput("");
      setLabelInput("");
    },
    [labelInput],
  );

  const removeCountdown = useCallback((id: number) => {
    setCountdowns((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleCustomAdd = useCallback(() => {
    if (!dateInput) return;
    const target = new Date(dateInput);
    if (isNaN(target.getTime())) return;
    addCountdown(target);
  }, [dateInput, addCountdown]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div class="space-y-6">
      {/* Presets */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Quick Presets</div>
        <div class="flex flex-wrap gap-2">
          <button
            class="btn-secondary text-sm"
            onClick={() => {
              const d = new Date();
              d.setHours(d.getHours() + 1);
              addCountdown(d, "1 Hour From Now");
            }}
          >
            1 Hour From Now
          </button>
          <button
            class="btn-secondary text-sm"
            onClick={() => {
              const d = new Date();
              d.setDate(d.getDate() + 1);
              d.setHours(0, 0, 0, 0);
              addCountdown(d, "Tomorrow");
            }}
          >
            Tomorrow
          </button>
          <button
            class="btn-secondary text-sm"
            onClick={() => addCountdown(nextMonday(), "Next Monday")}
          >
            Next Monday
          </button>
          <button
            class="btn-secondary text-sm"
            onClick={() => addCountdown(nextNewYear(), "New Year")}
          >
            New Year
          </button>
        </div>
      </div>

      {/* Custom countdown */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Custom Countdown</div>
        <div class="flex flex-wrap items-end gap-3">
          <div class="flex-1 min-w-[180px]">
            <label class="text-caption text-muted block mb-1">Label (optional)</label>
            <input
              type="text"
              class="input w-full"
              value={labelInput}
              onInput={(e) => setLabelInput((e.target as HTMLInputElement).value)}
              placeholder="My Event"
            />
          </div>
          <div class="flex-1 min-w-[200px]">
            <label class="text-caption text-muted block mb-1">Date & Time</label>
            <input
              type="datetime-local"
              class="input w-full"
              value={dateInput}
              onInput={(e) => setDateInput((e.target as HTMLInputElement).value)}
            />
          </div>
          <button class="btn-primary" onClick={handleCustomAdd} disabled={!dateInput}>
            Add Countdown
          </button>
        </div>
      </div>

      {/* Countdowns */}
      {countdowns.length === 0 && (
        <div class="text-center py-8">
          <p class="text-muted">No countdowns yet. Add one above to get started.</p>
        </div>
      )}

      <div class="space-y-4">
        {countdowns.map((cd) => {
          const remaining = getTimeRemaining(cd.target);
          return (
            <div class="bg-surface-elevated rounded-lg p-6">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <div class="text-title-sm text-body-strong">{cd.label}</div>
                  <div class="text-caption text-muted">
                    Target: {cd.target.toLocaleString()}
                  </div>
                </div>
                <button
                  class="btn-secondary text-sm"
                  onClick={() => removeCountdown(cd.id)}
                >
                  Remove
                </button>
              </div>

              {remaining.expired ? (
                <div class="text-center py-4">
                  <div class="text-display-sm text-primary" style="animation: pulse 1s ease-in-out infinite">
                    Time's up!
                  </div>
                </div>
              ) : (
                <div class="grid grid-cols-4 gap-3">
                  <div class="bg-surface-soft rounded-lg p-3 text-center">
                    <div class="text-display-sm text-primary">{remaining.days}</div>
                    <div class="text-caption text-muted mt-1">Days</div>
                  </div>
                  <div class="bg-surface-soft rounded-lg p-3 text-center">
                    <div class="text-display-sm text-primary">{pad(remaining.hours)}</div>
                    <div class="text-caption text-muted mt-1">Hours</div>
                  </div>
                  <div class="bg-surface-soft rounded-lg p-3 text-center">
                    <div class="text-display-sm text-primary">{pad(remaining.minutes)}</div>
                    <div class="text-caption text-muted mt-1">Minutes</div>
                  </div>
                  <div class="bg-surface-soft rounded-lg p-3 text-center">
                    <div class="text-display-sm text-primary">{pad(remaining.seconds)}</div>
                    <div class="text-caption text-muted mt-1">Seconds</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
