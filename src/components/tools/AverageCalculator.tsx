import { useEffect, useState } from "preact/hooks";

export default function AverageCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [rawInput, setRawInput] = useState("10, 15, 20, 20, 25, 30");

	const t = {
		en: {
			title: "Average, Median, Mode Calculator",
			lblInput: "Enter Numbers (separated by commas, spaces, or newlines)",
			lblCount: "Count (n)",
			lblSum: "Sum",
			lblMean: "Mean (Average)",
			lblMedian: "Median",
			lblMode: "Mode",
			lblRange: "Range",
			lblMinMax: "Min / Max",
			lblSorted: "Sorted Data Set",
			lblFrequency: "Frequency Table",
			errEmpty: "Please enter some numbers.",
		},
		vi: {
			title: "Tính số trung bình, trung vị, yếu vị",
			lblInput: "Nhập dãy số (cách nhau bởi dấu phẩy, khoảng trắng hoặc dòng mới)",
			lblCount: "Số lượng (n)",
			lblSum: "Tổng cộng",
			lblMean: "Số trung bình (Mean)",
			lblMedian: "Số trung vị (Median)",
			lblMode: "Số yếu vị (Mode)",
			lblRange: "Khoảng biến thiên (Range)",
			lblMinMax: "Nhỏ nhất / Lớn nhất",
			lblSorted: "Dãy số đã sắp xếp",
			lblFrequency: "Bảng tần suất",
			errEmpty: "Vui lòng nhập một số phần tử.",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	const processData = () => {
		const numbers = rawInput
			.replace(/[\n\r]/g, " ")
			.split(/[\s,]+/)
			.map((x) => Number.parseFloat(x.trim()))
			.filter((x) => !Number.isNaN(x));

		if (numbers.length === 0) {
			return { error: t.errEmpty };
		}

		// Count
		const count = numbers.length;

		// Sum
		const sum = numbers.reduce((a, b) => a + b, 0);

		// Mean
		const mean = sum / count;

		// Sorted
		const sorted = [...numbers].sort((a, b) => a - b);

		// Min, Max
		const min = sorted[0];
		const max = sorted[sorted.length - 1];

		// Range
		const range = max - min;

		// Median
		let median = 0;
		if (count % 2 === 1) {
			median = sorted[Math.floor(count / 2)];
		} else {
			const mid1 = sorted[count / 2 - 1];
			const mid2 = sorted[count / 2];
			median = (mid1 + mid2) / 2;
		}

		// Mode & Frequencies
		const freqMap: Record<number, number> = {};
		for (const n of numbers) {
			freqMap[n] = (freqMap[n] || 0) + 1;
		}

		let maxFreq = 0;
		let modes: number[] = [];
		for (const keyStr in freqMap) {
			const key = Number.parseFloat(keyStr);
			const f = freqMap[key];
			if (f > maxFreq) {
				maxFreq = f;
				modes = [key];
			} else if (f === maxFreq) {
				modes.push(key);
			}
		}

		const modeStr = maxFreq <= 1 ? "None / Không có" : modes.join(", ");

		return {
			count,
			sum,
			mean: Math.round(mean * 10000) / 10000,
			median: Math.round(median * 10000) / 10000,
			mode: modeStr,
			range,
			min,
			max,
			sorted,
			frequencies: Object.entries(freqMap)
				.map(([k, v]) => ({ val: Number(k), count: v }))
				.sort((a, b) => b.count - a.count),
		};
	};

	const res = processData();

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Numbers input area */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<textarea
							class="input w-full h-36 font-mono text-body-sm"
							value={rawInput}
							onInput={(e) => setRawInput((e.target as HTMLTextAreaElement).value)}
						/>
					</div>
				</div>

				{/* Numbers results area */}
				<div class="lg:col-span-7 space-y-4">
					{res.error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{res.error}
						</div>
					)}

					{!res.error && (
						<div class="space-y-4">
							{/* Core values grid */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblMean}</div>
										<div class="text-xl font-bold text-primary">{res.mean}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblMedian}</div>
										<div class="text-xl font-bold text-ink">{res.median}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblMode}</div>
										<div class="text-xl font-bold text-ink">{res.mode}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblCount}</div>
										<div class="text-sm font-bold text-ink">{res.count}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblSum}</div>
										<div class="text-sm font-bold text-ink">{res.sum}</div>
									</div>
									<div>
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblRange}</div>
										<div class="text-sm font-bold text-ink">{res.range}</div>
									</div>
								</div>

								<div class="pt-3 border-t border-hairline text-xs text-muted flex justify-between">
									<span>{t.lblMinMax}:</span>
									<span class="font-bold text-ink">
										{res.min} / {res.max}
									</span>
								</div>
							</div>

							{/* Sorted array preview */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSorted}</h4>
								<div class="text-xs font-mono text-muted bg-surface-soft p-3 rounded-lg overflow-x-auto whitespace-normal max-h-24">
									{res.sorted?.join(", ")}
								</div>
							</div>

							{/* Frequency table */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-2">
								<h4 class="text-body-strong text-ink font-bold">{t.lblFrequency}</h4>
								<div class="grid grid-cols-2 gap-2 text-xs divide-y divide-hairline">
									{res.frequencies?.slice(0, 8).map((f) => (
										<div key={f.val} class="flex justify-between py-1.5 px-2">
											<span class="font-mono text-ink">{f.val}</span>
											<span class="badge badge-yellow">{f.count}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
