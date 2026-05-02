import { useState, useEffect, useMemo, useCallback } from "preact/hooks";

type InputMode = "timestamp-to-date" | "date-to-timestamp";

function getDefaultDatetimeLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}:${s}`;
}

function formatLocalDate(date: Date): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

export default function UnixTimestampConverter() {
  const [mode, setMode] = useState<InputMode>("timestamp-to-date");
  const [timestampInput, setTimestampInput] = useState("");
  const [unitSeconds, setUnitSeconds] = useState(true);
  const [dateInput, setDateInput] = useState(getDefaultDatetimeLocal());
  const [currentTimestamp, setCurrentTimestamp] = useState(Math.floor(Date.now() / 1000));
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Live current timestamp
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTimestamp(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Timestamp → Date
  const dateFromTimestamp = useMemo(() => {
    if (!timestampInput) return null;
    const num = parseInt(timestampInput);
    if (isNaN(num)) return null;
    const ms = unitSeconds ? num * 1000 : num;
    const d = new Date(ms);
    if (isNaN(d.getTime())) return null;
    return d;
  }, [timestampInput, unitSeconds]);

  // Date → Timestamp
  const timestampFromDate = useMemo(() => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return null;
    return d;
  }, [dateInput]);

  const handleCopy = useCallback(async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1500);
  }, []);

  const fillNow = useCallback(() => {
    if (mode === "timestamp-to-date") {
      setTimestampInput(String(currentTimestamp));
    } else {
      setDateInput(getDefaultDatetimeLocal());
    }
  }, [mode, currentTimestamp]);

  return (
    <div class="space-y-6">
      {/* Current timestamp */}
      <div class="bg-surface-elevated rounded-lg p-6 text-center">
        <div class="text-caption-uppercase text-muted mb-2">Current Unix Timestamp</div>
        <div class="text-display-sm text-primary" style="font-family: var(--font-mono)">{currentTimestamp}</div>
        <div class="text-caption text-muted mt-1">{formatLocalDate(new Date())}</div>
      </div>

      {/* Mode tabs */}
      <div class="flex gap-2">
        <button
          class={mode === "timestamp-to-date" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setMode("timestamp-to-date")}
        >
          Timestamp → Date
        </button>
        <button
          class={mode === "date-to-timestamp" ? "btn-primary text-sm" : "btn-secondary text-sm"}
          onClick={() => setMode("date-to-timestamp")}
        >
          Date → Timestamp
        </button>
      </div>

      {/* Input area */}
      <div class="bg-surface-elevated rounded-lg p-6">
        {mode === "timestamp-to-date" ? (
          <div class="space-y-4">
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">Unix Timestamp</label>
              <div class="flex items-center gap-3">
                <input
                  type="text"
                  class="input flex-1"
                  value={timestampInput}
                  onInput={(e) => setTimestampInput((e.target as HTMLInputElement).value)}
                  placeholder="1746194400"
                  style="font-family: var(--font-mono)"
                />
                <button class="btn-secondary text-sm" onClick={fillNow}>Now</button>
              </div>
            </div>
            <div>
              <label class="text-caption-uppercase text-muted block mb-2">Unit</label>
              <div class="flex gap-2">
                <button
                  class={unitSeconds ? "btn-primary text-sm" : "btn-secondary text-sm"}
                  onClick={() => setUnitSeconds(true)}
                >
                  Seconds
                </button>
                <button
                  class={!unitSeconds ? "btn-primary text-sm" : "btn-secondary text-sm"}
                  onClick={() => setUnitSeconds(false)}
                >
                  Milliseconds
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Date & Time</label>
            <div class="flex items-center gap-3">
              <input
                type="datetime-local"
                class="input flex-1"
                value={dateInput}
                step="1"
                onInput={(e) => setDateInput((e.target as HTMLInputElement).value)}
              />
              <button class="btn-secondary text-sm" onClick={fillNow}>Now</button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {mode === "timestamp-to-date" && dateFromTimestamp && (
        <div class="space-y-3">
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">ISO 8601</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{dateFromTimestamp.toISOString()}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(dateFromTimestamp.toISOString(), "iso")}>
                {copiedField === "iso" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Local</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{formatLocalDate(dateFromTimestamp)}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(formatLocalDate(dateFromTimestamp), "local")}>
                {copiedField === "local" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Unix Seconds</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{Math.floor(dateFromTimestamp.getTime() / 1000)}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(String(Math.floor(dateFromTimestamp.getTime() / 1000)), "sec")}>
                {copiedField === "sec" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Unix Milliseconds</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{dateFromTimestamp.getTime()}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(String(dateFromTimestamp.getTime()), "ms")}>
                {copiedField === "ms" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {mode === "date-to-timestamp" && timestampFromDate && (
        <div class="space-y-3">
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Unix Seconds</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{Math.floor(timestampFromDate.getTime() / 1000)}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(String(Math.floor(timestampFromDate.getTime() / 1000)), "dsec")}>
                {copiedField === "dsec" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Unix Milliseconds</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{timestampFromDate.getTime()}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(String(timestampFromDate.getTime()), "dms")}>
                {copiedField === "dms" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">ISO 8601</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{timestampFromDate.toISOString()}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(timestampFromDate.toISOString(), "diso")}>
                {copiedField === "diso" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-3">
            <div class="flex items-center justify-between gap-2">
              <div>
                <div class="text-caption-uppercase text-muted">Local</div>
                <code class="code-block text-sm" style="font-family: var(--font-mono)">{formatLocalDate(timestampFromDate)}</code>
              </div>
              <button class="btn-secondary text-xs" onClick={() => handleCopy(formatLocalDate(timestampFromDate), "dlocal")}>
                {copiedField === "dlocal" ? "Copied!" : "Copy"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {mode === "timestamp-to-date" && !dateFromTimestamp && (
        <div class="text-center py-8">
          <p class="text-muted">Enter a Unix timestamp to convert it to a human-readable date.</p>
        </div>
      )}
    </div>
  );
}
