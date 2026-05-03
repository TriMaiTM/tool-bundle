import { useState, useMemo } from "preact/hooks";

export default function BreakEvenCalculator() {
  const [fixedCosts, setFixedCosts] = useState("");
  const [variableCost, setVariableCost] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [sellUnits, setSellUnits] = useState("");

  const formatCurrency = (n: number): string => {
    return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const calculation = useMemo(() => {
    const fc = parseFloat(fixedCosts);
    const vc = parseFloat(variableCost);
    const sp = parseFloat(sellingPrice);

    if (isNaN(fc) || isNaN(vc) || isNaN(sp) || fc < 0 || vc < 0 || sp <= 0) return null;
    if (sp <= vc) return null; // Price must exceed variable cost

    const contributionMargin = sp - vc;
    const contributionMarginRatio = contributionMargin / sp;
    const breakEvenUnits = Math.ceil(fc / contributionMargin);
    const breakEvenRevenue = breakEvenUnits * sp;

    return {
      fixedCosts: fc,
      variableCost: vc,
      sellingPrice: sp,
      contributionMargin,
      contributionMarginRatio,
      breakEvenUnits,
      breakEvenRevenue,
    };
  }, [fixedCosts, variableCost, sellingPrice]);

  const profitCalc = useMemo(() => {
    if (!calculation) return null;
    const units = parseInt(sellUnits);
    if (isNaN(units) || units < 0) return null;

    const revenue = units * calculation.sellingPrice;
    const totalCost = calculation.fixedCosts + units * calculation.variableCost;
    const profit = revenue - totalCost;

    return { units, revenue, totalCost, profit };
  }, [sellUnits, calculation]);

  // What-if scenarios: show impact of changing price
  const scenarios = useMemo(() => {
    const fc = parseFloat(fixedCosts);
    const vc = parseFloat(variableCost);
    const sp = parseFloat(sellingPrice);

    if (isNaN(fc) || isNaN(vc) || isNaN(sp) || fc < 0 || vc < 0 || sp <= 0) return [];

    const priceChanges = [-10, -5, 0, 5, 10];
    return priceChanges.map((pctChange) => {
      const newPrice = sp * (1 + pctChange / 100);
      if (newPrice <= vc) return null;
      const cm = newPrice - vc;
      const beUnits = Math.ceil(fc / cm);
      const beRevenue = beUnits * newPrice;
      return {
        pctChange,
        price: newPrice,
        contributionMargin: cm,
        breakEvenUnits: beUnits,
        breakEvenRevenue: beRevenue,
      };
    }).filter(Boolean) as Array<{
      pctChange: number;
      price: number;
      contributionMargin: number;
      breakEvenUnits: number;
      breakEvenRevenue: number;
    }>;
  }, [fixedCosts, variableCost, sellingPrice]);

  // Chart data: generate points for break-even visualization
  const chartData = useMemo(() => {
    if (!calculation) return null;
    const { breakEvenUnits, fixedCosts: fc, variableCost: vc, sellingPrice: sp } = calculation;
    const maxUnits = Math.max(breakEvenUnits * 2, 10);
    const step = Math.max(1, Math.floor(maxUnits / 20));
    const points: Array<{ units: number; cost: number; revenue: number }> = [];

    for (let u = 0; u <= maxUnits; u += step) {
      points.push({
        units: u,
        cost: fc + u * vc,
        revenue: u * sp,
      });
    }

    const maxValue = Math.max(
      points[points.length - 1]?.cost || 1,
      points[points.length - 1]?.revenue || 1,
    );

    return { points, maxValue, maxUnits };
  }, [calculation]);

  return (
    <div class="space-y-6">
      {/* Inputs */}
      <div class="bg-surface-elevated rounded-lg p-6">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Fixed Costs ($)</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 50000"
              value={fixedCosts}
              onInput={(e) => setFixedCosts((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Variable Cost per Unit ($)</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 15"
              step="0.01"
              value={variableCost}
              onInput={(e) => setVariableCost((e.target as HTMLInputElement).value)}
            />
          </div>
          <div>
            <label class="text-caption-uppercase text-muted block mb-2">Selling Price per Unit ($)</label>
            <input
              type="number"
              class="input w-full"
              placeholder="e.g. 50"
              step="0.01"
              value={sellingPrice}
              onInput={(e) => setSellingPrice((e.target as HTMLInputElement).value)}
            />
          </div>
        </div>
        {parseFloat(sellingPrice) > 0 && parseFloat(variableCost) > 0 && parseFloat(sellingPrice) <= parseFloat(variableCost) && (
          <div class="mt-4 p-3 rounded-lg bg-accent-rose/10 text-accent-rose text-body-sm">
            Selling price must be greater than variable cost per unit to break even.
          </div>
        )}
      </div>

      {/* Results */}
      {calculation && (
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">{calculation.breakEvenUnits.toLocaleString()}</div>
              <div class="text-caption text-muted mt-1">Break-Even Units</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-primary">${formatCurrency(calculation.breakEvenRevenue)}</div>
              <div class="text-caption text-muted mt-1">Break-Even Revenue</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-emerald">${formatCurrency(calculation.contributionMargin)}</div>
              <div class="text-caption text-muted mt-1">Contribution Margin / Unit</div>
            </div>
            <div class="bg-surface-elevated rounded-lg p-3 text-center">
              <div class="text-title-lg text-accent-emerald">{(calculation.contributionMarginRatio * 100).toFixed(1)}%</div>
              <div class="text-caption text-muted mt-1">Contribution Margin Ratio</div>
            </div>
          </div>

          {/* Break-Even Chart (CSS) */}
          {chartData && (
            <div class="bg-surface-elevated rounded-lg p-6">
              <h3 class="text-title-sm text-body-strong mb-4">Break-Even Chart</h3>
              <div class="relative" style="height: 240px;">
                {/* Y-axis labels */}
                <div class="absolute left-0 top-0 bottom-0 w-20 flex flex-col justify-between text-caption text-muted text-right pr-2">
                  <span>${formatCurrency(chartData.maxValue)}</span>
                  <span>${formatCurrency(chartData.maxValue * 0.75)}</span>
                  <span>${formatCurrency(chartData.maxValue * 0.5)}</span>
                  <span>${formatCurrency(chartData.maxValue * 0.25)}</span>
                  <span>$0</span>
                </div>
                {/* Chart area */}
                <div class="ml-20 relative h-full border-l border-b border-hairline">
                  {/* Horizontal grid lines */}
                  {[0.25, 0.5, 0.75].map((pct) => (
                    <div
                      key={pct}
                      class="absolute left-0 right-0 border-t border-hairline/30"
                      style={`bottom: ${pct * 100}%`}
                    />
                  ))}
                  {/* Vertical grid lines for break-even */}
                  <div
                    class="absolute top-0 bottom-0 border-l border-dashed border-accent-rose/50"
                    style={`left: ${(calculation.breakEvenUnits / chartData.maxUnits) * 100}%`}
                  />
                  {/* Break-even label */}
                  <div
                    class="absolute top-0 text-caption text-accent-rose"
                    style={`left: ${(calculation.breakEvenUnits / chartData.maxUnits) * 100}%; transform: translateX(-50%)`}
                  >
                    BE: {calculation.breakEvenUnits.toLocaleString()}
                  </div>
                  {/* Cost line bars */}
                  {chartData.points.map((pt, i) => {
                    const x = (pt.units / chartData.maxUnits) * 100;
                    const costH = (pt.cost / chartData.maxValue) * 100;
                    const revH = (pt.revenue / chartData.maxValue) * 100;
                    return (
                      <div key={i}>
                        {/* Cost bar */}
                        <div
                          class="absolute bottom-0 bg-accent-rose/60"
                          style={`left: ${x}%; width: 2px; height: ${costH}%`}
                          title={`Units: ${pt.units}, Cost: $${formatCurrency(pt.cost)}`}
                        />
                        {/* Revenue bar */}
                        <div
                          class="absolute bottom-0 bg-accent-emerald/60"
                          style={`left: calc(${x}% + 3px); width: 2px; height: ${revH}%`}
                          title={`Units: ${pt.units}, Revenue: $${formatCurrency(pt.revenue)}`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
              <div class="flex justify-center gap-6 mt-3 text-body-sm">
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-accent-rose" />
                  <span class="text-muted">Total Cost</span>
                </div>
                <div class="flex items-center gap-2">
                  <div class="w-3 h-3 rounded-full bg-accent-emerald" />
                  <span class="text-muted">Revenue</span>
                </div>
              </div>
            </div>
          )}

          {/* Profit Calculator */}
          <div class="bg-surface-elevated rounded-lg p-6">
            <h3 class="text-title-sm text-body-strong mb-4">Profit Calculator</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="text-caption-uppercase text-muted block mb-2">If you sell X units...</label>
                <input
                  type="number"
                  class="input w-full"
                  placeholder={`e.g. ${calculation.breakEvenUnits * 2}`}
                  value={sellUnits}
                  onInput={(e) => setSellUnits((e.target as HTMLInputElement).value)}
                />
              </div>
              {profitCalc && (
                <div class="space-y-2">
                  <div class="flex justify-between text-body-sm">
                    <span class="text-muted">Revenue</span>
                    <span class="text-primary">${formatCurrency(profitCalc.revenue)}</span>
                  </div>
                  <div class="flex justify-between text-body-sm">
                    <span class="text-muted">Total Cost</span>
                    <span class="text-accent-rose">${formatCurrency(profitCalc.totalCost)}</span>
                  </div>
                  <div class="flex justify-between text-body font-medium border-t border-hairline pt-2 mt-2">
                    <span>Profit</span>
                    <span class={profitCalc.profit >= 0 ? "text-accent-emerald" : "text-accent-rose"}>
                      {profitCalc.profit < 0 ? "−" : ""}${formatCurrency(Math.abs(profitCalc.profit))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* What-If Scenarios */}
          {scenarios.length > 0 && (
            <div class="bg-surface-elevated rounded-lg p-6">
              <h3 class="text-title-sm text-body-strong mb-4">What-If: Price Change Impact</h3>
              <div class="overflow-x-auto">
                <table class="w-full text-body-sm">
                  <thead>
                    <tr class="border-b border-hairline">
                      <th class="text-left text-caption-uppercase text-muted py-2 px-3">Price Change</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Price / Unit</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Contribution Margin</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Break-Even Units</th>
                      <th class="text-right text-caption-uppercase text-muted py-2 px-3">Break-Even Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarios.map((s) => (
                      <tr
                        key={s.pctChange}
                        class={`border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors ${
                          s.pctChange === 0 ? "bg-surface-soft" : ""
                        }`}
                      >
                        <td class="py-2 px-3">
                          <span class={`badge ${s.pctChange === 0 ? "badge-yellow" : ""}`}>
                            {s.pctChange > 0 ? "+" : ""}{s.pctChange}%
                          </span>
                        </td>
                        <td class="py-2 px-3 text-right text-primary">${formatCurrency(s.price)}</td>
                        <td class="py-2 px-3 text-right text-accent-emerald">${formatCurrency(s.contributionMargin)}</td>
                        <td class="py-2 px-3 text-right text-primary font-medium">{s.breakEvenUnits.toLocaleString()}</td>
                        <td class="py-2 px-3 text-right text-muted">${formatCurrency(s.breakEvenRevenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
