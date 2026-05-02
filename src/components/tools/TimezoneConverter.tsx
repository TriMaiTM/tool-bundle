import { useState, useEffect, useMemo, useCallback } from "preact/hooks";

interface TimezoneInfo {
  id: string;
  label: string;
  region: string;
}

const TIMEZONES: TimezoneInfo[] = [
  { id: "UTC", label: "UTC", region: "Global" },
  { id: "America/New_York", label: "EST / EDT (New York)", region: "US" },
  { id: "America/Chicago", label: "CST / CDT (Chicago)", region: "US" },
  { id: "America/Denver", label: "MST / MDT (Denver)", region: "US" },
  { id: "America/Los_Angeles", label: "PST / PDT (Los Angeles)", region: "US" },
  { id: "Europe/London", label: "GMT / BST (London)", region: "UK" },
  { id: "Europe/Paris", label: "CET / CEST (Paris)", region: "EU" },
  { id: "Europe/Athens", label: "EET / EEST (Athens)", region: "EU" },
  { id: "Asia/Kolkata", label: "IST (Mumbai)", region: "Asia" },
  { id: "Asia/Shanghai", label: "CST (Shanghai)", region: "Asia" },
  { id: "Asia/Tokyo", label: "JST (Tokyo)", region: "Asia" },
  { id: "Asia/Seoul", label: "KST (Seoul)", region: "Asia" },
  { id: "Asia/Dubai", label: "GST (Dubai)", region: "Asia" },
  { id: "Asia/Singapore", label: "SGT (Singapore)", region: "Asia" },
  { id: "Australia/Sydney", label: "AEST / AEDT (Sydney)", region: "Australia" },
  { id: "Pacific/Auckland", label: "NZST / NZDT (Auckland)", region: "Pacific" },
  { id: "America/Sao_Paulo", label: "BRT (São Paulo)", region: "South America" },
];

function getOffsetString(tz: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find((p) => p.type === "timeZoneName");
    if (offsetPart) {
      const val = offsetPart.value;
      if (val === "GMT") return "UTC+0";
      return val.replace("GMT", "UTC");
    }
  } catch {
    // fallback
  }
  return "";
}

function formatTime(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  }).format(date);
}

function formatDate(date: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

function getDefaultDatetimeLocal(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

export default function TimezoneConverter() {
  const [sourceTz, setSourceTz] = useState("America/New_York");
  const [targetTz, setTargetTz] = useState("Asia/Tokyo");
  const [datetimeInput, setDatetimeInput] = useState(getDefaultDatetimeLocal());
  const [tick, setTick] = useState(0);

  // Live clock tick
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const convertedTime = useMemo(() => {
    try {
      // Parse the input datetime as if it's in the source timezone
      const localDate = new Date(datetimeInput);
      if (isNaN(localDate.getTime())) return null;

      // Get the offset difference between source tz and local, then adjust
      const sourceFormatted = new Intl.DateTimeFormat("en-US", {
        timeZone: sourceTz,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(localDate);

      // We use the input as a local time and display it in both zones
      const inputDate = new Date(datetimeInput);

      return {
        sourceTime: formatTime(inputDate, sourceTz),
        sourceDate: formatDate(inputDate, sourceTz),
        targetTime: formatTime(inputDate, targetTz),
        targetDate: formatDate(inputDate, targetTz),
        sourceOffset: getOffsetString(sourceTz),
        targetOffset: getOffsetString(targetTz),
      };
    } catch {
      return null;
    }
  }, [datetimeInput, sourceTz, targetTz, tick]);

  const liveNow = useMemo(() => {
    const now = new Date();
    return {
      sourceTime: formatTime(now, sourceTz),
      targetTime: formatTime(now, targetTz),
    };
  }, [sourceTz, targetTz, tick]);

  const handleSwap = useCallback(() => {
    const tmp = sourceTz;
    setSourceTz(targetTz);
    setTargetTz(tmp);
  }, [sourceTz, targetTz]);

  return (
    <div class="space-y-6">
      {/* Live clocks */}
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div class="bg-surface-elevated rounded-lg p-6 text-center">
          <div class="text-caption-uppercase text-muted mb-1">Current Time — Source</div>
          <div class="text-caption text-muted mb-2">{sourceTz} ({getOffsetString(sourceTz)})</div>
          <div class="text-title-lg text-primary">{liveNow.sourceTime}</div>
        </div>
        <div class="bg-surface-elevated rounded-lg p-6 text-center">
          <div class="text-caption-uppercase text-muted mb-1">Current Time — Target</div>
          <div class="text-caption text-muted mb-2">{targetTz} ({getOffsetString(targetTz)})</div>
          <div class="text-title-lg text-primary">{liveNow.targetTime}</div>
        </div>
      </div>

      {/* Input area */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Source Timezone</label>
            <select
              class="input w-full"
              value={sourceTz}
              onChange={(e) => setSourceTz((e.target as HTMLSelectElement).value)}
            >
              {TIMEZONES.map((tz) => (
                <option value={tz.id}>{tz.label} ({getOffsetString(tz.id)})</option>
              ))}
            </select>
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Target Timezone</label>
            <select
              class="input w-full"
              value={targetTz}
              onChange={(e) => setTargetTz((e.target as HTMLSelectElement).value)}
            >
              {TIMEZONES.map((tz) => (
                <option value={tz.id}>{tz.label} ({getOffsetString(tz.id)})</option>
              ))}
            </select>
          </div>
        </div>

        <div class="flex items-end gap-3">
          <div class="flex-1">
            <label class="text-caption-uppercase text-muted block mb-2">Date & Time</label>
            <input
              type="datetime-local"
              class="input w-full"
              value={datetimeInput}
              onInput={(e) => setDatetimeInput((e.target as HTMLInputElement).value)}
            />
          </div>
          <button class="btn-secondary" onClick={handleSwap}>
            ⇄ Swap
          </button>
        </div>
      </div>

      {/* Conversion result */}
      {convertedTime && (
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-surface-elevated rounded-lg p-6 text-center">
            <div class="text-caption-uppercase text-muted mb-1">Source</div>
            <div class="text-caption text-primary mb-2">{sourceTz} · {convertedTime.sourceOffset}</div>
            <div class="text-title-lg text-primary">{convertedTime.sourceTime}</div>
            <div class="text-body-sm text-muted mt-1">{convertedTime.sourceDate}</div>
          </div>
          <div class="bg-surface-elevated rounded-lg p-6 text-center">
            <div class="text-caption-uppercase text-muted mb-1">Target</div>
            <div class="text-caption text-primary mb-2">{targetTz} · {convertedTime.targetOffset}</div>
            <div class="text-title-lg text-primary">{convertedTime.targetTime}</div>
            <div class="text-body-sm text-muted mt-1">{convertedTime.targetDate}</div>
          </div>
        </div>
      )}

      {/* Timezone reference table */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="text-caption-uppercase text-muted mb-3">Common Timezones</div>
        <div class="overflow-x-auto">
          <table class="w-full text-body-sm" style="border-collapse: collapse;">
            <thead>
              <tr class="border-b border-hairline">
                <th class="text-left p-2 text-caption-uppercase text-muted">Timezone</th>
                <th class="text-left p-2 text-caption-uppercase text-muted">Region</th>
                <th class="text-left p-2 text-caption-uppercase text-muted">UTC Offset</th>
                <th class="text-left p-2 text-caption-uppercase text-muted">Current Time</th>
              </tr>
            </thead>
            <tbody>
              {TIMEZONES.map((tz) => (
                <tr class="border-b border-hairline">
                  <td class="p-2 text-body-strong">{tz.label}</td>
                  <td class="p-2 text-muted">{tz.region}</td>
                  <td class="p-2 text-primary">{getOffsetString(tz.id)}</td>
                  <td class="p-2" style="font-family: var(--font-mono)">{formatTime(new Date(), tz.id)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
