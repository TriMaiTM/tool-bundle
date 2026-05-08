import { useMemo, useState } from "preact/hooks";

interface YearRow {
	year: number;
	contributions: number;
	earnings: number;
	balance: number;
}

interface Scenario {
	rate: number;
	label: string;
	finalValue: number;
	totalContributions: number;
	totalEarnings: number;
	breakdown: YearRow[];
}

function calculateInvestment(
	initial: number,
	monthly: number,
	annualRate: number,
	years: number,
): {
	finalValue: number;
	totalContributions: number;
	totalEarnings: number;
	breakdown: YearRow[];
} {
	const r = annualRate / 100 / 12; // monthly rate
	const totalMonths = years * 12;
	const breakdown: YearRow[] = [];

	let balance = initial;
	let totalContributed = initial;

	for (let month = 1; month <= totalMonths; month++) {
		// Growth on existing balance + new contribution
		balance = (balance + monthly) * (1 + r);
		totalContributed += monthly;

		// Record at year boundaries
		if (month % 12 === 0) {
			const year = month / 12;
			const _earnings = balance - totalContributed;
			const prevContributions = initial + (month - 12) * monthly;
			const _prevBalance =
				year === 1
					? initial * (1 + r) + monthly * (((1 + r) ** 12 - 1) / r) * (1 + r)
					: breakdown[breakdown.length - 2]?.balance
						? (breakdown[breakdown.length - 2].balance + monthly) * (1 + r)
						: initial;
			const _yearEarnings =
				balance - prevContributions - (initial + (month - 12) * monthly > 0 ? 0 : 0);

			breakdown.push({
				year,
				contributions: totalContributed,
				earnings: balance - totalContributed,
				balance,
			});
		}
	}

	return {
		finalValue: balance,
		totalContributions: totalContributed,
		totalEarnings: balance - totalContributed,
		breakdown,
	};
}

const SCENARIO_RATES = [5, 7, 10];

export default function InvestmentCalculator() {
	const [initialInvestment, setInitialInvestment] = useState("10000");
	const [monthlyContribution, setMonthlyContribution] = useState("500");
	const [annualReturn, setAnnualReturn] = useState("7");
	const [timePeriod, setTimePeriod] = useState("20");

	const formatCurrency = (n: number): string => {
		return n.toLocaleString(undefined, {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		});
	};

	const primaryCalc = useMemo(() => {
		const P = Number.parseFloat(initialInvestment);
		const PMT = Number.parseFloat(monthlyContribution);
		const r = Number.parseFloat(annualReturn);
		const t = Number.parseFloat(timePeriod);

		if (
			Number.isNaN(P) ||
			Number.isNaN(PMT) ||
			Number.isNaN(r) ||
			Number.isNaN(t) ||
			P < 0 ||
			PMT < 0 ||
			r < 0 ||
			t <= 0
		) {
			return null;
		}

		return calculateInvestment(P, PMT, r, t);
	}, [initialInvestment, monthlyContribution, annualReturn, timePeriod]);

	const scenarios = useMemo<Scenario[]>(() => {
		const P = Number.parseFloat(initialInvestment);
		const PMT = Number.parseFloat(monthlyContribution);
		const t = Number.parseFloat(timePeriod);

		if (Number.isNaN(P) || Number.isNaN(PMT) || Number.isNaN(t) || P < 0 || PMT < 0 || t <= 0) {
			return [];
		}

		return SCENARIO_RATES.map((rate) => {
			const result = calculateInvestment(P, PMT, rate, t);
			return {
				rate,
				label: `${rate}%`,
				...result,
			};
		});
	}, [initialInvestment, monthlyContribution, timePeriod]);

	const maxBalance = primaryCalc
		? primaryCalc.breakdown[primaryCalc.breakdown.length - 1]?.balance || 1
		: 1;

	return (
		<div class="space-y-6">
			{/* Inputs */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">
							Initial Investment ($)
						</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 10000"
							value={initialInvestment}
							onInput={(e) => setInitialInvestment((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">
							Monthly Contribution ($)
						</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 500"
							value={monthlyContribution}
							onInput={(e) => setMonthlyContribution((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Annual Return (%)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 7"
							step="0.1"
							value={annualReturn}
							onInput={(e) => setAnnualReturn((e.target as HTMLInputElement).value)}
						/>
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Time Period (years)</label>
						<input
							type="number"
							class="input w-full"
							placeholder="e.g. 20"
							value={timePeriod}
							onInput={(e) => setTimePeriod((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>
			</div>

			{/* Primary Results */}
			{primaryCalc && (
				<div class="space-y-4">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">
								${formatCurrency(primaryCalc.finalValue)}
							</div>
							<div class="text-caption text-muted mt-1">Final Value</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">
								${formatCurrency(primaryCalc.totalContributions)}
							</div>
							<div class="text-caption text-muted mt-1">Total Contributions</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-accent-emerald">
								${formatCurrency(primaryCalc.totalEarnings)}
							</div>
							<div class="text-caption text-muted mt-1">Total Earnings</div>
						</div>
					</div>

					{/* Stacked bar chart: contributions vs earnings */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Contributions vs Earnings</h3>
						<div class="flex h-8 rounded-full overflow-hidden mb-3">
							<div
								class="bg-primary"
								style={`flex: ${primaryCalc.totalContributions}`}
								title="Contributions"
							/>
							<div
								class="bg-accent-emerald"
								style={`flex: ${primaryCalc.totalEarnings}`}
								title="Earnings"
							/>
						</div>
						<div class="flex justify-between text-body-sm">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-primary" />
								<span class="text-muted">
									Contributions: ${formatCurrency(primaryCalc.totalContributions)} (
									{((primaryCalc.totalContributions / primaryCalc.finalValue) * 100).toFixed(1)}
									%)
								</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-accent-emerald" />
								<span class="text-muted">
									Earnings: ${formatCurrency(primaryCalc.totalEarnings)} (
									{((primaryCalc.totalEarnings / primaryCalc.finalValue) * 100).toFixed(1)}
									%)
								</span>
							</div>
						</div>
					</div>

					{/* Year-by-year stacked bars */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Growth Over Time</h3>
						<div class="space-y-2">
							{primaryCalc.breakdown.map((row) => (
								<div key={row.year} class="flex items-center gap-3">
									<div class="w-12 text-caption text-muted text-right shrink-0">Yr {row.year}</div>
									<div class="flex-1">
										<div class="flex h-5 rounded overflow-hidden">
											<div
												class="bg-primary"
												style={`width: ${(row.contributions / maxBalance) * 100}%`}
												title={`Contributions: $${formatCurrency(row.contributions)}`}
											/>
											<div
												class="bg-accent-emerald"
												style={`width: ${(row.earnings / maxBalance) * 100}%`}
												title={`Earnings: $${formatCurrency(row.earnings)}`}
											/>
										</div>
									</div>
									<div class="w-28 text-body-sm text-right text-primary shrink-0">
										${formatCurrency(row.balance)}
									</div>
								</div>
							))}
						</div>
						<div class="flex gap-4 mt-4 text-body-sm">
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-primary" />
								<span class="text-muted">Contributions</span>
							</div>
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 rounded-full bg-accent-emerald" />
								<span class="text-muted">Earnings</span>
							</div>
						</div>
					</div>

					{/* Year-by-year table */}
					<div class="bg-surface-elevated rounded-lg p-6">
						<h3 class="text-title-sm text-body-strong mb-4">Year-by-Year Table</h3>
						<div class="overflow-x-auto">
							<table class="w-full text-body-sm">
								<thead>
									<tr class="border-b border-hairline">
										<th class="text-left text-caption-uppercase text-muted py-2 px-3">Year</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">
											Contributions
										</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">Earnings</th>
										<th class="text-right text-caption-uppercase text-muted py-2 px-3">Balance</th>
									</tr>
								</thead>
								<tbody>
									{primaryCalc.breakdown.map((row) => (
										<tr
											key={row.year}
											class="border-b border-hairline/50 hover:bg-surface-soft/50 transition-colors"
										>
											<td class="py-2 px-3 text-muted">{row.year}</td>
											<td class="py-2 px-3 text-right text-primary">
												${formatCurrency(row.contributions)}
											</td>
											<td class="py-2 px-3 text-right text-accent-emerald">
												${formatCurrency(row.earnings)}
											</td>
											<td class="py-2 px-3 text-right font-medium text-primary">
												${formatCurrency(row.balance)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					</div>
				</div>
			)}

			{/* Scenario Comparison */}
			{scenarios.length > 0 && (
				<div class="bg-surface-elevated rounded-lg p-6">
					<h3 class="text-title-sm text-body-strong mb-4">Compare Return Scenarios</h3>
					<div class="overflow-x-auto">
						<table class="w-full text-body-sm">
							<thead>
								<tr class="border-b border-hairline">
									<th class="text-left text-caption-uppercase text-muted py-2 px-3">Metric</th>
									{scenarios.map((s) => (
										<th key={s.rate} class="text-right text-caption-uppercase text-muted py-2 px-3">
											{s.label} Return
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								<tr class="border-b border-hairline/50">
									<td class="py-2 px-3 text-muted">Final Value</td>
									{scenarios.map((s) => (
										<td key={s.rate} class="py-2 px-3 text-right text-primary font-medium">
											${formatCurrency(s.finalValue)}
										</td>
									))}
								</tr>
								<tr class="border-b border-hairline/50">
									<td class="py-2 px-3 text-muted">Total Contributions</td>
									{scenarios.map((s) => (
										<td key={s.rate} class="py-2 px-3 text-right text-primary">
											${formatCurrency(s.totalContributions)}
										</td>
									))}
								</tr>
								<tr class="border-b border-hairline/50">
									<td class="py-2 px-3 text-muted">Total Earnings</td>
									{scenarios.map((s) => (
										<td key={s.rate} class="py-2 px-3 text-right text-accent-emerald font-medium">
											${formatCurrency(s.totalEarnings)}
										</td>
									))}
								</tr>
								<tr>
									<td class="py-2 px-3 text-muted">Earnings Multiple</td>
									{scenarios.map((s) => (
										<td key={s.rate} class="py-2 px-3 text-right text-muted">
											{(s.totalEarnings / s.totalContributions).toFixed(2)}x
										</td>
									))}
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
