import { useEffect, useState } from "preact/hooks";

export default function DateAdder() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
	const [operation, setOperation] = useState<"add" | "subtract">("add");
	const [years, setYears] = useState(0);
	const [months, setMonths] = useState(0);
	const [weeks, setWeeks] = useState(0);
	const [days, setDays] = useState(0);
	const [resultDate, setResultDate] = useState("");
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Add/Subtract Date Calculator",
			desc: "Add or subtract years, months, weeks, and days from a calendar start date to compute the target date.",
			lblStart: "Start Date",
			lblOp: "Operation",
			add: "Add (+)",
			subtract: "Subtract (-)",
			lblYears: "Years",
			lblMonths: "Months",
			lblWeeks: "Weeks",
			lblDays: "Days",
			lblResults: "Target Computed Date",
			copied: "Copied!",
			copy: "Copy Date",
		},
		vi: {
			title: "Cộng trừ ngày tháng",
			desc: "Cộng thêm hoặc bớt đi một lượng số năm, tháng, tuần và ngày cụ thể từ một mốc thời gian để tìm ngày đích.",
			lblStart: "Ngày bắt đầu",
			lblOp: "Phép tính",
			add: "Cộng thêm (+)",
			subtract: "Trừ đi (-)",
			lblYears: "Năm",
			lblMonths: "Tháng",
			lblWeeks: "Tuần",
			lblDays: "Ngày",
			lblResults: "Ngày đích tính được",
			copied: "Đã chép!",
			copy: "Sao chép ngày",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Calculate resulting date
	useEffect(() => {
		const base = new Date(startDate);
		if (Number.isNaN(base.getTime())) return;

		const factor = operation === "add" ? 1 : -1;

		// Perform calendar arithmetic correctly
		if (years !== 0) base.setFullYear(base.getFullYear() + years * factor);
		if (months !== 0) base.setMonth(base.getMonth() + months * factor);

		// Weeks & Days are purely numeric offsets
		const totalDaysOffset = (weeks * 7 + days) * factor;
		if (totalDaysOffset !== 0) {
			base.setDate(base.getDate() + totalDaysOffset);
		}

		setResultDate(
			base.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
				weekday: "long",
				year: "numeric",
				month: "long",
				day: "numeric",
			}),
		);
	}, [startDate, operation, years, months, weeks, days, lang]);

	const handleCopy = () => {
		navigator.clipboard.writeText(resultDate);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Controllers Panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Start Date */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblStart}</label>
						<input
							type="date"
							class="input w-full"
							value={startDate}
							onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Operation */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblOp}</label>
						<div class="flex gap-2">
							<button
								class={`btn-secondary w-full py-2 capitalize ${
									operation === "add" ? "bg-primary/10 border-primary text-primary" : ""
								}`}
								onClick={() => setOperation("add")}
							>
								{t.add}
							</button>
							<button
								class={`btn-secondary w-full py-2 capitalize ${
									operation === "subtract" ? "bg-primary/10 border-primary text-primary" : ""
								}`}
								onClick={() => setOperation("subtract")}
							>
								{t.subtract}
							</button>
						</div>
					</div>

					{/* Year Offset */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblYears}</label>
							<span class="font-mono text-primary">{years}</span>
						</div>
						<input
							type="range"
							min="0"
							max="50"
							value={years}
							onInput={(e) => setYears(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Month Offset */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblMonths}</label>
							<span class="font-mono text-primary">{months}</span>
						</div>
						<input
							type="range"
							min="0"
							max="48"
							value={months}
							onInput={(e) => setMonths(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Week Offset */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblWeeks}</label>
							<span class="font-mono text-primary">{weeks}</span>
						</div>
						<input
							type="range"
							min="0"
							max="52"
							value={weeks}
							onInput={(e) => setWeeks(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>

					{/* Day Offset */}
					<div class="space-y-1.5">
						<div class="flex justify-between items-center text-body-sm">
							<label class="text-ink font-bold">{t.lblDays}</label>
							<span class="font-mono text-primary">{days}</span>
						</div>
						<input
							type="range"
							min="0"
							max="365"
							value={days}
							onInput={(e) => setDays(Number((e.target as HTMLInputElement).value))}
							class="w-full accent-primary"
						/>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					<div class="space-y-3">
						<div class="flex gap-2">
							<input
								readOnly
								type="text"
								class="input w-full font-mono text-body-sm bg-surface-soft"
								value={resultDate}
							/>
							<button
								class="btn-secondary py-2 px-4 text-xs whitespace-nowrap"
								onClick={handleCopy}
							>
								{copied ? t.copied : t.copy}
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
