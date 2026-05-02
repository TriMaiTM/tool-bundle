import { useState, useMemo, useCallback } from "preact/hooks";

type TermUnit = "years" | "months";

interface AmortizationRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export default function LoanCalculator() {
  const [principal, setPrincipal] = useState("");
  const [annualRate, setAnnualRate] = useState("");
  const [term, setTerm] = useState("");
  const [termUnit, setTermUnit] = useState<TermUnit>("years");
  const [showSchedule, setShowSchedule] = useState(false);

  const calculation = useMemo(() => {
    const p = parseFloat(principal);
    const r = parseFloat(annualRate);
    const t = parseFloat(term);

    if (isNaN(p) || isNaN(r) || isNaN(t) || p <= 0 || r < 0 || t <= 0) {
      return null;
    }

    const monthlyRate = r / 100 / 12;
    const totalMonths = termUnit === "years" ? Math.round(t * 12) : Math.round(t);

    if (monthlyRate === 0) {
      // 0% interest
      const monthlyPayment = p / totalMonths;
      return {
        monthlyPayment,
        totalPayment: p,
        totalInterest: 0,
        totalMonths,
        schedule: generateSchedule(p, 0, totalMonths),
      };
    }

    const monthlyPayment = p * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
    const totalPayment = monthlyPayment * totalMonths;
    const totalInterest = totalPayment - p;

    return {
      monthlyPayment,
      totalPayment,
      totalInterest,
      totalMonths,
      schedule: generateSchedule(p, monthlyRate, totalMonths),
    };
  }, [principal, annualRate, term, termUnit]);

  function generateSchedule(p: number, monthlyRate: number, totalMonths: number): AmortizationRow[] {
    if (totalMonths > 600) return []; // Cap at 50 years to prevent huge tables

    const schedule: AmortizationRow[] = [];
    let balance = p;
    const monthlyPayment = monthlyRate === 0
      ? p / totalMonths
      : p * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1);

    for (let month = 1; month <= totalMonths; month++) {
      const interest = balance * monthlyRate;
      const principalPart = monthlyPayment - interest;
      balance = Math.max(0, balance - principalPart);

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPart,
        interest,
        balance,
      });
    }

    return schedule;
  }

  const formatCurrency = (n: number): string => {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="sm:col-span-2 lg:col-span-1">
            <label class="text-caption-uppercase text-muted block mb-2">Loan Amount</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 250000"
              value={principal}
              onInput={(e) => setPrincipal((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Annual Rate (%)</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 5.5"
              step="0.01"
              value={annualRate}
              onInput={(e) => setAnnualRate((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Loan Term</label>
            <div class="flex gap-2">
              <input
                type="number"
                class="input flex-1"
                placeholder={termUnit === "years" ? "e.g. 30" : "e.g. 360"}
                value={term}
                onInput={(e) => setTerm((e.target as HTMLInputElement).value)}
              />
              <div class="flex rounded-md overflow-hidden border border-hairline">
                <button
                  class={`px-3 py-2 text-body-sm font-medium transition-colors ${
                    termUnit === "years" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"
                  }`}
                  onClick={() => setTermUnit("years")}
                >
                  Yr
                </button>
                <button
                  class={`px-3 py-2 text-body-sm font-medium transition-colors ${
                    termUnit === "months" ? "bg-primary text-on-primary" : "bg-surface-elevated text-body hover:text-on-dark"
                  }`}
                  onClick={() => setTermUnit("months")}
                >
                  Mo
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      {calculation && (
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">${formatCurrency(calculation.monthlyPayment)}</div>
              <div class="text-caption text-muted mt-1">Monthly Payment</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">${formatCurrency(calculation.totalPayment)}</div>
              <div class="text-caption text-muted mt-1">Total Payment</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-rose">${formatCurrency(calculation.totalInterest)}</div>
              <div class="text-caption text-muted mt-1">Total Interest</div>
            </div>
          </div>

          {/* Breakdown bar */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-3">Payment Breakdown</h3>
            <div class="flex h-6 rounded-full overflow-hidden mb-3">
              <div
                class="bg-primary"
                style={`flex: ${parseFloat(principal)}`}
                title="Principal"
              ></div>
              <div
                class="bg-accent-rose"
                style={`flex: ${calculation.totalInterest}`}
                title="Interest"
              ></div>
            </div>
            <div class="flex justify-between text-body-sm">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-primary"></div>
                <span class="text-muted">Principal: ${formatCurrency(parseFloat(principal))} ({((parseFloat(principal) / calculation.totalPayment) * 100).toFixed(1)}%)</span>
              </div>
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 rounded-full bg-accent-rose"></div>
                <span class="text-muted">Interest: ${formatCurrency(calculation.totalInterest)} ({((calculation.totalInterest / calculation.totalPayment) * 100).toFixed(1)}%)</span>
              </div>
            </div>
          </div>

          {/* Amortization Schedule Toggle */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-title-sm text-body-strong">Amortization Schedule</h3>
              <button
                class="btn-secondary text-body-sm"
                onClick={() => setShowSchedule(!showSchedule)}
              >
                {showSchedule ? "Hide" : "Show"} Schedule
              </button>
            </div>

            {showSchedule && calculation.schedule.length > 0 && (
              <div class="overflow-x-auto">
                <table class="w-full text-body-sm">
                  <thead>
                    <tr class="border-b border-hairline">
                      <th class="text-left text-caption-uppercase text-muted py-2 px-3">#</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Payment</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Principal</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Interest</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculation.schedule.map((row) => (
                      <tr key={row.month} class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors">
                        <td class="py-2 px-3 text-muted">{row.month}</td>
                        <td class="py-2 px-3 text-right">${formatCurrency(row.payment)}</td>
                        <td class="py-2 px-3 text-right text-accent-emerald">${formatCurrency(row.principal)}</td>
                        <td class="py-2 px-3 text-right text-accent-rose">${formatCurrency(row.interest)}</td>
                        <td class="py-2 px-3 text-right text-primary">${formatCurrency(row.balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {showSchedule && calculation.schedule.length === 0 && (
              <p class="text-muted text-body-sm">Schedule is too large to display (over 600 months).</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
