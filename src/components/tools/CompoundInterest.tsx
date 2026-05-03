import { useState, useMemo } from "preact/hooks";

type CompoundingFrequency =
  | "annually"
  | "semi-annually"
  | "quarterly"
  | "monthly"
  | "daily";

const FREQUENCY_MAP: Record<
  CompoundingFrequency,
  { label: string; n: number }
> = {
  annually: { label: "Annually", n: 1 },
  "semi-annually": { label: "Semi-Annually", n: 2 },
  quarterly: { label: "Quarterly", n: 4 },
  monthly: { label: "Monthly", n: 12 },
  daily: { label: "Daily", n: 365 },
};

interface YearRow {
  year: number;
  balance: number;
  interestEarned: number;
  cumulativeInterest: number;
}

const PRESETS = [
  {
    label: "$1,000 at 5% for 10 years",
    principal: "1000",
    rate: "5",
    years: "10",
    freq: "monthly" as CompoundingFrequency,
  },
  {
    label: "$10,000 at 7% for 30 years",
    principal: "10000",
    rate: "7",
    years: "30",
    freq: "monthly" as CompoundingFrequency,
  },
];

export default function CompoundInterest() {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [frequency, setFrequency] = useState<CompoundingFrequency>("monthly");
  const [years, setYears] = useState("");
  const [showBreakdown, setShowBreakdown] = useState(false);

  const calculation = useMemo(() => {
    const P = parseFloat(principal);
    const r = parseFloat(annualRate) / 100;
    const t = parseFloat(years);
    const n = FREQUENCY_MAP[frequency].n;

    if (isNaN(P) || isNaN(r) || isNaN(t) || P <= 0 || r < 0 || t <= 0) {
      return null;
    }

    // A = P(1 + r/n)^(nt)
    const A = P * Math.pow(1 + r / n, n * t);
    const totalInterest = A - P;

    // Year-by-year breakdown
    const breakdown: YearRow[] = [];
    let cumulativeInterest = 0;
    for (let year = 1; year <= Math.ceil(t); year++) {
      const balance = P * Math.pow(1 + r / n, n * year);
      const prevBalance =
        year === 1 ? P : P * Math.pow(1 + r / n, n * (year - 1));
      const interestEarned = balance - prevBalance;
      cumulativeInterest += interestEarned;

      breakdown.push({
        year,
        balance,
        interestEarned,
        cumulativeInterest,
      });
    }

    return {
      finalBalance: A,
      totalInterest,
      principal: P,
      breakdown,
    };
  }, [principal, annualRate, frequency, years]);

  const maxBalance = calculation
    ? calculation.breakdown[calculation.breakdown.length - 1]?.balance || 1
    : 1;

  const formatCurrency = (n: number): string => {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const applyPreset = (preset: (typeof PRESETS)[0]) => {
    setPrincipal(preset.principal);
    setAnnualRate(preset.rate);
    setYears(preset.years);
    setFrequency(preset.freq);
  };

  return (
    <div class="space-y-6">
      {/* Presets */}
      <div class="bg-surface-elevated rounded-lg p-4">
        <div class="text-caption-uppercase text-muted mb-2">Quick Presets</div>
        <div class="flex flex-wrap gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              class="btn-secondary text-body-sm"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Inputs */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Principal ($)
            </label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 10000"
              value={principal}
              onInput={(e) =>
                setPrincipal((e.target as HTMLInputElement).value)
              }
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Annual Rate (%)
            </label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 7"
              step="0.01"
              value={annualRate}
              onInput={(e) =>
                setAnnualRate((e.target as HTMLInputElement).value)
              }
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Compounding
            </label>
            <select
              class="input w-full"
              value={frequency}
              onChange={(e) =>
                setFrequency(
                  (e.target as HTMLSelectElement).value as CompoundingFrequency,
                )
              }
            >
              {Object.entries(FREQUENCY_MAP).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Time Period (years)
            </label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 10"
              value={years}
              onInput={(e) => setYears((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div class="space-y-4">
          {/* Summary Cards */}
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">
                ${formatCurrency(calculation.finalBalance)}
              </div>
              <div class="text-caption text-muted mt-1">Final Balance</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-emerald">
                ${formatCurrency(calculation.totalInterest)}
              </div>
              <div class="text-caption text-muted mt-1">
                Total Interest Earned
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">
                ${formatCurrency(calculation.principal)}
              </div>
              <div class="text-caption text-muted mt-1">
                Total Contributions
              </div>
            </div>
          </div>

          {/* Bar Chart: Principal vs Interest */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">
              Growth Breakdown
            </h3>
            <div class="flex h-8 rounded-full overflow-hidden mb-3">
              <div
                class="bg-primary"
                style={`flex: ${calculation.principal}`}
                title="Principal"
              />
              <div
                class="bg-accent-emerald"
                style={`flex: ${calculation.totalInterest}`}
                title="Interest"
              />
            </div>
            <div class="flex justify-between text-body-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-primary" />
                <span class="text-muted">
                  Principal: ${formatCurrency(calculation.principal)} (
                  {(
                    (calculation.principal / calculation.finalBalance) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-accent-emerald" />
                <span class="text-muted">
                  Interest: ${formatCurrency(calculation.totalInterest)} (
                  {(
                    (calculation.totalInterest / calculation.finalBalance) *
                    100
                  ).toFixed(1)}
                  %)
                </span>
              </div>
            </div>
          </div>

          {/* Formula */}
          <div class="bg-surface-elevated rounded-lg p-3 text-center">
            <span class="badge-yellow">Formula</span>
            <p class="text-body-sm text-muted mt-2">A = P(1 + r/n)^(nt)</p>
          </div>

          {/* Year-by-Year Breakdown */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-title-sm text-body-strong">
                Year-by-Year Breakdown
              </h3>
              <button
                class="btn-secondary text-body-sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
              >
                {showBreakdown ? "Hide" : "Show"} Breakdown
              </button>
            </div>

            {showBreakdown && (
              <div class="space-y-3">
                {calculation.breakdown.map((row) => (
                  <div key={row.year} class="flex items-center gap-3">
                    <div class="w-12 text-caption text-muted text-right shrink-0">
                      Yr {row.year}
                    </div>
                    <div class="flex-1">
                      <div class="flex h-6 rounded overflow-hidden">
                        <div
                          class="bg-primary"
                          style={`width: ${(calculation.principal / maxBalance) * 100}%`}
                          title={`Principal: $${formatCurrency(calculation.principal)}`}
                        />
                        <div
                          class="bg-accent-emerald"
                          style={`width: ${((row.balance - calculation.principal) / maxBalance) * 100}%`}
                          title={`Interest: $${formatCurrency(row.balance - calculation.principal)}`}
                        />
                      </div>
                    </div>
                    <div class="w-28 text-body-sm text-right text-primary shrink-0">
                      ${formatCurrency(row.balance)}
                    </div>
                    <div class="w-28 text-body-sm text-right text-accent-emerald shrink-0">
                      +${formatCurrency(row.interestEarned)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Table */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">Detailed Table</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-body-sm">
                <thead>
                  <tr class="border-b border-hairline">
                    <th class="text-left text-caption-uppercase text-muted py-2 px-3">
                      Year
                    </th>
                    <th class="text-right text-caption-uppercase text-muted py-2 px-3">
                      Balance
                    </th>
                    <th class="text-right text-caption-uppercase text-muted py-2 px-3">
                      Interest Earned
                    </th>
                    <th class="text-right text-caption-uppercase text-muted py-2 px-3">
                      Cumulative Interest
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.breakdown.map((row) => (
                    <tr
                      key={row.year}
                      class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
                    >
                      <td class="py-2 px-3 text-muted">{row.year}</td>
                      <td class="py-2 px-3 text-right text-primary font-medium">
                        ${formatCurrency(row.balance)}
                      </td>
                      <td class="py-2 px-3 text-right text-accent-emerald">
                        ${formatCurrency(row.interestEarned)}
                      </td>
                      <td class="py-2 px-3 text-right text-muted">
                        ${formatCurrency(row.cumulativeInterest)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
