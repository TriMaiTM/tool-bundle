import { useState, useMemo } from "preact/hooks";

interface AgeResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  totalHours: number;
  totalMinutes: number;
  nextBirthday: { months: number; days: number; totalDays: number };
  zodiac: string;
  zodiacSymbol: string;
}

const ZODIAC_SIGNS: { sign: string; symbol: string; start: [number, number]; end: [number, number] }[] = [
  { sign: "Capricorn", symbol: "♑", start: [12, 22], end: [1, 19] },
  { sign: "Aquarius", symbol: "♒", start: [1, 20], end: [2, 18] },
  { sign: "Pisces", symbol: "♓", start: [2, 19], end: [3, 20] },
  { sign: "Aries", symbol: "♈", start: [3, 21], end: [4, 19] },
  { sign: "Taurus", symbol: "♉", start: [4, 20], end: [5, 20] },
  { sign: "Gemini", symbol: "♊", start: [5, 21], end: [6, 20] },
  { sign: "Cancer", symbol: "♋", start: [6, 21], end: [7, 22] },
  { sign: "Leo", symbol: "♌", start: [7, 23], end: [8, 22] },
  { sign: "Virgo", symbol: "♍", start: [8, 23], end: [9, 22] },
  { sign: "Libra", symbol: "♎", start: [9, 23], end: [10, 22] },
  { sign: "Scorpio", symbol: "♏", start: [10, 23], end: [11, 21] },
  { sign: "Sagittarius", symbol: "♐", start: [11, 22], end: [12, 21] },
];

function getZodiacSign(month: number, day: number): { sign: string; symbol: string } {
  for (const z of ZODIAC_SIGNS) {
    if (z.sign === "Capricorn") {
      if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) {
        return { sign: z.sign, symbol: z.symbol };
      }
    } else {
      const [startMonth, startDay] = z.start;
      const [endMonth, endDay] = z.end;
      if (
        (month === startMonth && day >= startDay) ||
        (month === endMonth && day <= endDay)
      ) {
        return { sign: z.sign, symbol: z.symbol };
      }
    }
  }
  return { sign: "Capricorn", symbol: "♑" };
}

function calculateAge(birthDateStr: string): AgeResult | null {
  if (!birthDateStr) return null;

  const birthDate = new Date(birthDateStr + "T00:00:00");
  const now = new Date();

  if (birthDate > now) return null;

  // Calculate years, months, days
  let years = now.getFullYear() - birthDate.getFullYear();
  let months = now.getMonth() - birthDate.getMonth();
  let days = now.getDate() - birthDate.getDate();

  if (days < 0) {
    months--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years--;
    months += 12;
  }

  // Total calculations
  const msDiff = now.getTime() - birthDate.getTime();
  const totalDays = Math.floor(msDiff / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(msDiff / (1000 * 60 * 60));
  const totalMinutes = Math.floor(msDiff / (1000 * 60));

  // Next birthday
  let nextBday = new Date(now.getFullYear(), birthDate.getMonth(), birthDate.getDate());
  if (nextBday <= now) {
    nextBday = new Date(now.getFullYear() + 1, birthDate.getMonth(), birthDate.getDate());
  }
  const nextBdayMs = nextBday.getTime() - now.getTime();
  const nextBdayTotalDays = Math.ceil(nextBdayMs / (1000 * 60 * 60 * 24));

  let nbMonths = nextBday.getMonth() - now.getMonth();
  let nbDays = nextBday.getDate() - now.getDate();
  if (nbDays < 0) {
    nbMonths--;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    nbDays += prevMonth.getDate();
  }
  if (nbMonths < 0) {
    nbMonths += 12;
  }

  const { sign, symbol } = getZodiacSign(birthDate.getMonth() + 1, birthDate.getDate());

  return {
    years,
    months,
    days,
    totalDays,
    totalHours,
    totalMinutes,
    nextBirthday: { months: nbMonths, days: nbDays, totalDays: nextBdayTotalDays },
    zodiac: sign,
    zodiacSymbol: symbol,
  };
}

export default function AgeCalculator() {
  const [birthDate, setBirthDate] = useState("");

  const result = useMemo(() => calculateAge(birthDate), [birthDate]);

  const formatNumber = (n: number): string => n.toLocaleString();

  return (
    <div class="space-y-6">
      <div class="bg-surface-elevated rounded-lg p-6">
        <label class="text-caption-uppercase text-muted block mb-2">Date of Birth</label>
        <input
          type="date"
          class="input w-full sm:w-auto"
          style="min-width: 220px"
          value={birthDate}
          max={new Date().toISOString().split("T")[0]}
          onInput={(e) => setBirthDate((e.target as HTMLInputElement).value)}
        />
      </div>

      {result && (
        <div class="space-y-4">
          {/* Main age display */}
          <div class="bg-surface-elevated rounded-lg p-6 text-center">
            <div class="text-caption-uppercase text-muted mb-2">Your Age</div>
            <div class="text-title-lg text-primary" style="font-size: 32px; letter-spacing: -1px">
              {result.years} <span class="text-body text-muted">years</span>{" "}
              {result.months} <span class="text-body text-muted">months</span>{" "}
              {result.days} <span class="text-body text-muted">days</span>
            </div>
          </div>

          {/* Stat boxes */}
          <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.years)}</div>
              <div class="text-caption text-muted mt-1">Years</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.years * 12 + result.months)}</div>
              <div class="text-caption text-muted mt-1">Months</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.totalDays)}</div>
              <div class="text-caption text-muted mt-1">Days</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.totalHours)}</div>
              <div class="text-caption text-muted mt-1">Hours</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.totalMinutes)}</div>
              <div class="text-caption text-muted mt-1">Minutes</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{formatNumber(result.totalMinutes * 60)}</div>
              <div class="text-caption text-muted mt-1">Seconds</div>
            </div>
          </div>

          {/* Next Birthday & Zodiac */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="bg-surface-elevated rounded-lg p-6 text-center">
              <div class="text-caption-uppercase text-muted mb-2">Next Birthday</div>
              <div class="text-title-lg text-primary mb-1">
                {result.nextBirthday.months} <span class="text-body text-muted">months</span>{" "}
                {result.nextBirthday.days} <span class="text-body text-muted">days</span>
              </div>
              <div class="text-body-sm text-muted">
                {result.nextBirthday.totalDays} day{result.nextBirthday.totalDays !== 1 ? "s" : ""} away
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-6 text-center">
              <div class="text-caption-uppercase text-muted mb-2">Zodiac Sign</div>
              <div class="text-title-lg text-primary">
                <span style="font-size: 36px">{result.zodiacSymbol}</span>
              </div>
              <div class="text-body-sm text-primary mt-1">{result.zodiac}</div>
            </div>
          </div>

          {/* Fun facts */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-3">Fun Facts</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 text-body-sm">
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-muted">Heartbeats (approx.)</span>
                <span class="text-primary font-medium">{formatNumber(Math.round(result.totalMinutes * 72))}</span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-muted">Breaths taken (approx.)</span>
                <span class="text-primary font-medium">{formatNumber(Math.round(result.totalMinutes * 16))}</span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-muted">Sleep time (approx.)</span>
                <span class="text-primary font-medium">{formatNumber(Math.round(result.totalDays * 8 / 24))} days</span>
              </div>
              <div class="flex justify-between p-3 rounded-lg bg-surface-soft">
                <span class="text-muted">Day of week born</span>
                <span class="text-primary font-medium">
                  {new Date(birthDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long" })}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {!birthDate && (
        <div class="text-center py-8">
          <p class="text-muted">Enter your date of birth to calculate your exact age.</p>
        </div>
      )}
    </div>
  );
}
