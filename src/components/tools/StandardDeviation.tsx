import { useEffect, useState } from "preact/hooks";

export default function StandardDeviation() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [rawInput, setRawInput] = useState("10, 12, 23, 23, 16, 23, 21, 16");

	const t = {
		en: {
			title: "Standard Deviation Calculator",
			lblInput: "Enter Numbers (separated by commas, spaces, or newlines)",
			lblCount: "Count (N)",
			lblMean: "Mean (μ)",
			lblSum: "Sum (Σx)",
			lblPopSD: "Population SD (σ)",
			lblPopVar: "Population Variance (σ²)",
			lblSampleSD: "Sample SD (s)",
			lblSampleVar: "Sample Variance (s²)",
			lblSteps: "Step-by-Step Calculations",
			lblNumber: "Number (x)",
			lblDev: "Deviation (x - μ)",
			lblSqDev: "Squared Dev (x - μ)²",
			errEmpty: "Please enter some numbers.",
			errNotEnough: "Please enter at least 2 numbers for sample variance.",
		},
		vi: {
			title: "Tính độ lệch chuẩn và phương sai",
			lblInput: "Nhập dãy số (cách nhau bởi dấu phẩy, khoảng trắng hoặc dòng mới)",
			lblCount: "Số lượng (N)",
			lblMean: "Trung bình (μ)",
			lblSum: "Tổng (Σx)",
			lblPopSD: "Độ lệch chuẩn tổng thể (σ)",
			lblPopVar: "Phương sai tổng thể (σ²)",
			lblSampleSD: "Độ lệch chuẩn mẫu (s)",
			lblSampleVar: "Phương sai mẫu (s²)",
			lblSteps: "Các bước tính chi tiết",
			lblNumber: "Số (x)",
			lblDev: "Độ lệch (x - μ)",
			lblSqDev: "Bình phương độ lệch (x - μ)²",
			errEmpty: "Vui lòng nhập một số phần tử.",
			errNotEnough: "Nhập ít nhất 2 số để tính độ lệch chuẩn mẫu.",
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

		if (numbers.length === 0) return { error: t.errEmpty };
		if (numbers.length < 2) return { error: t.errNotEnough };

		const count = numbers.length;
		const sum = numbers.reduce((a, b) => a + b, 0);
		const mean = sum / count;

		// Calculate deviations and squared deviations
		const details = numbers.map((x) => {
			const deviation = x - mean;
			const squared = deviation * deviation;
			return {
				val: x,
				dev: Math.round(deviation * 1000) / 1000,
				sq: Math.round(squared * 1000) / 1000,
			};
		});

		const sumSquaredDev = details.reduce((a, b) => a + b.sq, 0);

		// Population Variance and SD
		const popVar = sumSquaredDev / count;
		const popSD = Math.sqrt(popVar);

		// Sample Variance and SD
		const sampleVar = sumSquaredDev / (count - 1);
		const sampleSD = Math.sqrt(sampleVar);

		return {
			count,
			sum,
			mean: Math.round(mean * 10000) / 10000,
			sumSq: Math.round(sumSquaredDev * 10000) / 10000,
			popVar: Math.round(popVar * 10000) / 10000,
			popSD: Math.round(popSD * 10000) / 10000,
			sampleVar: Math.round(sampleVar * 10000) / 10000,
			sampleSD: Math.round(sampleSD * 10000) / 10000,
			details,
		};
	};

	const res = processData();

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input box */}
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

				{/* Results dashboard */}
				<div class="lg:col-span-7 space-y-4">
					{res.error && (
						<div class="bg-accent-rose/10 border border-accent-rose/30 rounded-lg p-4 text-body-sm text-accent-rose">
							{res.error}
						</div>
					)}

					{!res.error && (
						<div class="space-y-4">
							{/* Standard Deviation outputs */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
								<div class="grid grid-cols-2 gap-4">
									<div class="bg-surface-soft p-3 rounded-lg border border-hairline">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblPopSD}</div>
										<div class="text-2xl font-bold text-primary">{res.popSD}</div>
									</div>
									<div class="bg-surface-soft p-3 rounded-lg border border-hairline">
										<div class="text-[10px] text-muted font-bold uppercase">{t.lblSampleSD}</div>
										<div class="text-2xl font-bold text-accent-emerald">{res.sampleSD}</div>
									</div>
									<div>
										<div class="text-[9px] text-muted font-bold uppercase">{t.lblPopVar}</div>
										<div class="text-lg font-bold text-ink">{res.popVar}</div>
									</div>
									<div>
										<div class="text-[9px] text-muted font-bold uppercase">{t.lblSampleVar}</div>
										<div class="text-lg font-bold text-ink">{res.sampleVar}</div>
									</div>
									<div>
										<div class="text-[9px] text-muted font-bold uppercase">{t.lblMean}</div>
										<div class="text-sm font-bold text-ink">{res.mean}</div>
									</div>
									<div>
										<div class="text-[9px] text-muted font-bold uppercase">{t.lblCount}</div>
										<div class="text-sm font-bold text-ink">{res.count}</div>
									</div>
								</div>

								<div class="pt-3 border-t border-hairline text-xs text-muted flex justify-between">
									<span>Sum of Squares (SS):</span>
									<span class="font-bold text-ink">{res.sumSq}</span>
								</div>
							</div>

							{/* Step-by-Step Table */}
							<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
								<h4 class="text-body-strong text-ink font-bold">{t.lblSteps}</h4>
								<div class="overflow-x-auto max-h-64 border border-hairline rounded-lg">
									<table class="w-full text-xs text-left divide-y divide-hairline">
										<thead class="bg-surface-soft text-muted font-bold">
											<tr>
												<th class="px-4 py-2">{t.lblNumber}</th>
												<th class="px-4 py-2">{t.lblDev}</th>
												<th class="px-4 py-2">{t.lblSqDev}</th>
											</tr>
										</thead>
										<tbody class="divide-y divide-hairline text-ink font-mono">
											{res.details?.map((row, idx) => (
												<tr key={idx}>
													<td class="px-4 py-2">{row.val}</td>
													<td class="px-4 py-2">{row.dev}</td>
													<td class="px-4 py-2">{row.sq}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
