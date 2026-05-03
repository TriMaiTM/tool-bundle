import { useState, useMemo } from "preact/hooks";

type FilingStatus = "single" | "married" | "head";

const STANDARD_DEDUCTIONS: Record<FilingStatus, number> = {
  single: 14600,
  married: 29200,
  head: 21900,
};

const STATUS_LABELS: Record<FilingStatus, string> = {
  single: "Single",
  married: "Married Filing Jointly",
  head: "Head of Household",
};

interface TaxBracket {
  rate: number;
  min: number;
  max: number; // Infinity for top bracket
}

const BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { rate: 0.1, min: 0, max: 11600 },
    { rate: 0.12, min: 11601, max: 47150 },
    { rate: 0.22, min: 47151, max: 100525 },
    { rate: 0.24, min: 100526, max: 191950 },
    { rate: 0.32, min: 191951, max: 243725 },
    { rate: 0.35, min: 243726, max: 609350 },
    { rate: 0.37, min: 609351, max: Infinity },
  ],
  married: [
    { rate: 0.1, min: 0, max: 23200 },
    { rate: 0.12, min: 23201, max: 94300 },
    { rate: 0.22, min: 94301, max: 201050 },
    { rate: 0.24, min: 201051, max: 383900 },
    { rate: 0.32, min: 383901, max: 487450 },
    { rate: 0.35, min: 487451, max: 731200 },
    { rate: 0.37, min: 731201, max: Infinity },
  ],
  head: [
    { rate: 0.1, min: 0, max: 16550 },
    { rate: 0.12, min: 16551, max: 63100 },
    { rate: 0.22, min: 63101, max: 100500 },
    { rate: 0.24, min: 100501, max: 191950 },
    { rate: 0.32, min: 191951, max: 243700 },
    { rate: 0.35, min: 243701, max: 609350 },
    { rate: 0.37, min: 609351, max: Infinity },
  ],
};

interface BracketDetail {
  rate: number;
  bracketMin: number;
  bracketMax: number;
  taxableInBracket: number;
  taxInBracket: number;
}

export default function TaxCalculator() {
  const [income, setIncome] = useState("");
  const [status, setStatus] = useState<FilingStatus>("single");

  const calculation = useMemo(() => {
    const grossIncome = parseFloat(income);
    if (isNaN(grossIncome) || grossIncome < 0) return null;

    const deduction = STANDARD_DEDUCTIONS[status];
    const taxableIncome = Math.max(0, grossIncome - deduction);
    const brackets = BRACKETS[status];

    let totalTax = 0;
    const bracketDetails: BracketDetail[] = [];

    for (const bracket of brackets) {
      if (taxableIncome <= bracket.min) {
        // No income in this bracket, still show the bracket info
        bracketDetails.push({
          rate: bracket.rate,
          bracketMin: bracket.min,
          bracketMax: bracket.max,
          taxableInBracket: 0,
          taxInBracket: 0,
        });
        continue;
      }

      const taxableInBracket =
        Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = taxableInBracket * bracket.rate;
      totalTax += taxInBracket;

      bracketDetails.push({
        rate: bracket.rate,
        bracketMin: bracket.min,
        bracketMax: bracket.max,
        taxableInBracket,
        taxInBracket,
      });
    }

    const effectiveRate = grossIncome > 0 ? (totalTax / grossIncome) * 100 : 0;
    const takeHome = grossIncome - totalTax;

    // Find marginal rate: highest bracket with taxable income
    let marginalRate = 0;
    for (const detail of bracketDetails) {
      if (detail.taxableInBracket > 0) {
        marginalRate = detail.rate * 100;
      }
    }

    return {
      grossIncome,
      deduction,
      taxableIncome,
      totalTax,
      effectiveRate,
      marginalRate,
      takeHome,
      bracketDetails,
    };
  }, [income, status]);

  const formatCurrency = (n: number): string => {
    return n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const maxBracketTax = calculation
    ? Math.max(...calculation.bracketDetails.map((d) => d.taxInBracket), 1)
    : 1;

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Annual Gross Income ($)
            </label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 85000"
              value={income}
              onInput={(e) => setIncome((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">
              Filing Status
            </label>
            <select
              class="input w-full"
              value={status}
              onChange={(e) =>
                setStatus((e.target as HTMLSelectElement).value as FilingStatus)
              }
            >
              <option value="single">Single</option>
              <option value="married">Married Filing Jointly</option>
              <option value="head">Head of Household</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div class="space-y-4">
          {/* Summary Cards */}
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-rose">
                ${formatCurrency(calculation.totalTax)}
              </div>
              <div class="text-caption text-muted mt-1">Tax Owed</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">
                {calculation.effectiveRate.toFixed(2)}%
              </div>
              <div class="text-caption text-muted mt-1">Effective Tax Rate</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">
                {calculation.marginalRate.toFixed(0)}%
              </div>
              <div class="text-caption text-muted mt-1">Marginal Tax Rate</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-emerald">
                ${formatCurrency(calculation.takeHome)}
              </div>
              <div class="text-caption text-muted mt-1">Take-Home Pay</div>
            </div>
          </div>

          {/* Breakdown bar: Income → Deduction → Tax → Take Home */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">
              Income Breakdown
            </h3>
            <div class="flex h-8 rounded-full overflow-hidden mb-3">
              <div
                class="bg-accent-emerald"
                style={`flex: ${calculation.takeHome}`}
                title="Take-Home Pay"
              />
              <div
                class="bg-accent-rose"
                style={`flex: ${calculation.totalTax}`}
                title="Tax"
              />
              <div
                class="bg-surface-soft"
                style={`flex: ${calculation.deduction}`}
                title="Standard Deduction"
              />
            </div>
            <div class="flex flex-wrap gap-4 text-body-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-accent-emerald" />
                <span class="text-muted">
                  Take-Home: {"$"}
                  {formatCurrency(calculation.takeHome)}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-accent-rose" />
                <span class="text-muted">
                  Tax: {"$"}
                  {formatCurrency(calculation.totalTax)}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-surface-soft" />
                <span class="text-muted">
                  Deduction: {"$"}
                  {formatCurrency(calculation.deduction)}
                </span>
              </div>
            </div>
          </div>

          {/* Info */}
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3">
              <div class="text-caption-uppercase text-muted mb-1">
                Gross Income
              </div>
              <div class="text-body text-primary">
                ${formatCurrency(calculation.grossIncome)}
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3">
              <div class="text-caption-uppercase text-muted mb-1">
                Standard Deduction ({STATUS_LABELS[status]})
              </div>
              <div class="text-body text-primary">
                −${formatCurrency(calculation.deduction)}
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3">
              <div class="text-caption-uppercase text-muted mb-1">
                Taxable Income
              </div>
              <div class="text-body text-primary">
                ${formatCurrency(calculation.taxableIncome)}
              </div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3">
              <div class="text-caption-uppercase text-muted mb-1">
                Filing Status
              </div>
              <div class="text-body text-primary">{STATUS_LABELS[status]}</div>
            </div>
          </div>

          {/* Bracket Visualization */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">
              Tax Bracket Breakdown (2024)
            </h3>
            <div class="space-y-3">
              {calculation.bracketDetails.map((detail) => {
                const pctLabel = (detail.rate * 100).toFixed(0);
                const maxLabel =
                  detail.bracketMax === Infinity
                    ? "+"
                    : `$${detail.bracketMax.toLocaleString()}`;
                return (
                  <div key={detail.rate} class="flex items-center gap-3">
                    <div class="w-20 shrink-0">
                      <span
                        class={`badge ${detail.taxableInBracket > 0 ? "badge-yellow" : ""}`}
                      >
                        {pctLabel}%
                      </span>
                    </div>
                    <div class="flex-1">
                      <div class="h-5 rounded overflow-hidden bg-surface-soft">
                        <div
                          class={`h-full rounded transition-all ${detail.taxableInBracket > 0 ? "bg-accent-rose" : "bg-transparent"}`}
                          style={`width: ${maxBracketTax > 0 ? (detail.taxInBracket / maxBracketTax) * 100 : 0}%`}
                        />
                      </div>
                    </div>
                    <div class="w-48 text-body-sm text-muted text-right shrink-0">
                      ${detail.bracketMin.toLocaleString()} – {maxLabel}
                    </div>
                    <div class="w-32 text-body-sm text-right shrink-0">
                      {detail.taxableInBracket > 0 ? (
                        <span class="text-accent-rose">
                          ${formatCurrency(detail.taxInBracket)}
                        </span>
                      ) : (
                        <span class="text-muted">—</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detailed Table */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">Bracket Details</h3>
            <div class="overflow-x-auto">
              <table class="w-full text-body-sm">
                <thead>
                  <tr class="border-b border-hairline">
                    <th class="text-left text-caption-uppercase text-muted py-2 px-3">
                      Rate
                    </th>
                    <th class="text-left text-caption-uppercase text-muted py-2 px-3">
                      Bracket Range
                    </th>
                    <th class="text-right text-caption-uppercase text-muted py-2 px-3">
                      Taxable Amount
                    </th>
                    <th class="text-right text-caption-uppercase text-muted py-2 px-3">
                      Tax
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {calculation.bracketDetails.map((detail) => {
                    const maxLabel =
                      detail.bracketMax === Infinity
                        ? "and up"
                        : `$${detail.bracketMax.toLocaleString()}`;
                    return (
                      <tr
                        key={detail.rate}
                        class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
                      >
                        <td class="py-2 px-3 font-medium">
                          {(detail.rate * 100).toFixed(0)}%
                        </td>
                        <td class="py-2 px-3 text-muted">
                          ${detail.bracketMin.toLocaleString()} – {maxLabel}
                        </td>
                        <td class="py-2 px-3 text-right text-primary">
                          {detail.taxableInBracket > 0
                            ? `$${formatCurrency(detail.taxableInBracket)}`
                            : "—"}
                        </td>
                        <td class="py-2 px-3 text-right text-accent-rose">
                          {detail.taxInBracket > 0
                            ? `$${formatCurrency(detail.taxInBracket)}`
                            : "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
