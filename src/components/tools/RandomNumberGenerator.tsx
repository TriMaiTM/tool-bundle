import { useCallback, useState } from "preact/hooks";

type GenerationResult = {
	numbers: number[];
	timestamp: number;
	settings: {
		min: number;
		max: number;
		count: number;
		allowDuplicates: boolean;
		integerOnly: boolean;
		sort: boolean;
	};
};

function secureRandom(): number {
	const arr = new Uint32Array(1);
	crypto.getRandomValues(arr);
	return arr[0] / (0xffffffff + 1);
}

export default function RandomNumberGenerator() {
	const [min, setMin] = useState(1);
	const [max, setMax] = useState(100);
	const [count, setCount] = useState(1);
	const [allowDuplicates, setAllowDuplicates] = useState(true);
	const [sortResults, setSortResults] = useState(false);
	const [integerOnly, setIntegerOnly] = useState(true);
	const [results, setResults] = useState<number[]>([]);
	const [copiedAll, setCopiedAll] = useState(false);
	const [history, setHistory] = useState<GenerationResult[]>([]);

	const generate = useCallback(() => {
		const actualMin = Math.min(min, max);
		const actualMax = Math.max(min, max);
		const actualCount = Math.min(Math.max(1, count), 1000);

		if (!allowDuplicates && integerOnly) {
			const range = Math.floor(actualMax) - Math.ceil(actualMin) + 1;
			if (actualCount > range) {
				return;
			}
		}

		const nums: number[] = [];
		let attempts = 0;
		const maxAttempts = actualCount * 100;

		while (nums.length < actualCount && attempts < maxAttempts) {
			attempts++;
			let num: number;
			if (integerOnly) {
				num =
					Math.floor(secureRandom() * (Math.floor(actualMax) - Math.ceil(actualMin) + 1)) +
					Math.ceil(actualMin);
			} else {
				num = secureRandom() * (actualMax - actualMin) + actualMin;
				num = Math.round(num * 100) / 100;
			}
			if (allowDuplicates || !nums.includes(num)) {
				nums.push(num);
			}
		}

		const finalNums = sortResults ? [...nums].sort((a, b) => a - b) : nums;
		setResults(finalNums);
		setHistory((prev) =>
			[
				{
					numbers: finalNums,
					timestamp: Date.now(),
					settings: {
						min: actualMin,
						max: actualMax,
						count: actualCount,
						allowDuplicates,
						integerOnly,
						sort: sortResults,
					},
				},
				...prev,
			].slice(0, 5),
		);
	}, [min, max, count, allowDuplicates, sortResults, integerOnly]);

	const stats =
		results.length > 0
			? {
					count: results.length,
					min: Math.min(...results),
					max: Math.max(...results),
					sum: results.reduce((a, b) => a + b, 0),
					avg: results.reduce((a, b) => a + b, 0) / results.length,
				}
			: null;

	const handleCopyAll = useCallback(async () => {
		if (results.length > 0) {
			await navigator.clipboard.writeText(results.join(", "));
			setCopiedAll(true);
			setTimeout(() => setCopiedAll(false), 1500);
		}
	}, [results]);

	return (
		<div>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Min Value</label>
					<input
						type="number"
						class="input w-full"
						value={min}
						onInput={(e) => setMin(Number.parseFloat((e.target as HTMLInputElement).value) || 0)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Max Value</label>
					<input
						type="number"
						class="input w-full"
						value={max}
						onInput={(e) => setMax(Number.parseFloat((e.target as HTMLInputElement).value) || 0)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Count (1–1000)</label>
					<input
						type="number"
						class="input w-full"
						value={count}
						min={1}
						max={1000}
						onInput={(e) =>
							setCount(
								Math.min(
									1000,
									Math.max(1, Number.parseInt((e.target as HTMLInputElement).value) || 1),
								),
							)
						}
					/>
				</div>
			</div>

			<div class="flex flex-wrap gap-4 mb-6">
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={allowDuplicates}
						onChange={(e) => setAllowDuplicates((e.target as HTMLInputElement).checked)}
						class="rounded border-hairline"
					/>
					<span class="text-body-sm text-body">Allow duplicates</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={sortResults}
						onChange={(e) => setSortResults((e.target as HTMLInputElement).checked)}
						class="rounded border-hairline"
					/>
					<span class="text-body-sm text-body">Sort results</span>
				</label>
				<label class="flex items-center gap-2">
					<input
						type="checkbox"
						checked={integerOnly}
						onChange={(e) => setIntegerOnly((e.target as HTMLInputElement).checked)}
						class="rounded border-hairline"
					/>
					<span class="text-body-sm text-body">Integer only</span>
				</label>
			</div>

			<button class="btn-primary mb-6" onClick={generate}>
				Generate
			</button>

			{results.length > 0 && (
				<div class="mb-6">
					<div class="flex items-center justify-between mb-3">
						<span class="text-caption-uppercase text-muted">Results</span>
						<button class="btn-secondary text-body-sm" onClick={handleCopyAll}>
							{copiedAll ? "Copied!" : "Copy All"}
						</button>
					</div>

					<div class="flex flex-wrap gap-2 mb-4">
						{results.map((num, i) => (
							<span class="badge-yellow" key={i}>
								{num}
							</span>
						))}
					</div>

					{stats && (
						<div class="bg-surface-elevated rounded-lg p-3">
							<div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
								<div>
									<span class="text-body-sm text-muted-soft block">Count</span>
									<span class="text-body-strong">{stats.count}</span>
								</div>
								<div>
									<span class="text-body-sm text-muted-soft block">Min</span>
									<span class="text-body-strong">{stats.min}</span>
								</div>
								<div>
									<span class="text-body-sm text-muted-soft block">Max</span>
									<span class="text-body-strong">{stats.max}</span>
								</div>
								<div>
									<span class="text-body-sm text-muted-soft block">Sum</span>
									<span class="text-body-strong">
										{integerOnly ? stats.sum : stats.sum.toFixed(2)}
									</span>
								</div>
								<div>
									<span class="text-body-sm text-muted-soft block">Average</span>
									<span class="text-body-strong">{stats.avg.toFixed(2)}</span>
								</div>
							</div>
						</div>
					)}
				</div>
			)}

			{history.length > 0 && (
				<div>
					<span class="text-caption-uppercase text-muted block mb-3">History</span>
					<div class="space-y-2">
						{history.map((entry, i) => (
							<div class="bg-surface-elevated rounded-lg p-3" key={i}>
								<div class="flex items-center justify-between mb-1">
									<span class="text-body-sm text-muted-soft">
										Range {entry.settings.min}–{entry.settings.max} · Count {entry.settings.count}
									</span>
									<span class="text-body-sm text-muted-soft">
										{new Date(entry.timestamp).toLocaleTimeString()}
									</span>
								</div>
								<div class="flex flex-wrap gap-1">
									{entry.numbers.map((num, j) => (
										<span class="badge-yellow" key={j} style="font-size: 0.7rem;">
											{num}
										</span>
									))}
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			{!allowDuplicates &&
				integerOnly &&
				count > Math.floor(Math.max(min, max)) - Math.ceil(Math.min(min, max)) + 1 && (
					<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 mt-4 text-body-sm text-accent-rose">
						Cannot generate {count} unique integers in the range [{Math.min(min, max)},{" "}
						{Math.max(min, max)}]. Increase the range or enable duplicates.
					</div>
				)}
		</div>
	);
}
