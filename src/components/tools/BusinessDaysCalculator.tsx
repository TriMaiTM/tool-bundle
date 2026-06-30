import { useEffect, useState } from "preact/hooks";

export default function BusinessDaysCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [mode, setMode] = useState<"diff" | "add">("diff");

	// Diff mode inputs
	const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
	const [endDate, setEndDate] = useState(
		new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
	);

	// Add mode inputs
	const [baseDate, setBaseDate] = useState(new Date().toISOString().split("T")[0]);
	const [daysOffset, setDaysOffset] = useState(10);

	// Holiday lists
	const [customHolidays, setCustomHolidays] = useState<string[]>([]);
	const [newHoliday, setNewHoliday] = useState("");

	// Results
	const [resultDiff, setResultDiff] = useState({ total: 0, weekends: 0, business: 0 });
	const [resultAddDate, setResultAddDate] = useState("");

	const t = {
		en: {
			title: "Business Days Calculator",
			desc: "Calculate working days between dates or determine target dates by adding/subtracting business days.",
			tabDiff: "Days Between Dates",
			tabAdd: "Add/Subtract Days",
			lblStart: "Start Date",
			lblEnd: "End Date",
			lblBase: "Base Date",
			lblOffset: "Business Days to Add/Subtract",
			lblHolidays: "Holidays List",
			lblAddHoliday: "Add Custom Holiday",
			lblResults: "Results",
			totalDays: "Total Calendar Days",
			weekendDays: "Weekend Days (Sat/Sun)",
			businessDays: "Business Days (Working Days)",
			targetDate: "Target Date",
			add: "Add",
			copied: "Copied!",
			copy: "Copy Date",
		},
		vi: {
			title: "Tính toán ngày làm việc",
			desc: "Tính số ngày làm việc giữa hai mốc ngày hoặc cộng/trừ số ngày làm việc cụ thể để tính ngày kết quả.",
			tabDiff: "Tính khoảng cách ngày",
			tabAdd: "Cộng/Trừ ngày làm việc",
			lblStart: "Ngày bắt đầu",
			lblEnd: "Ngày kết thúc",
			lblBase: "Ngày gốc",
			lblOffset: "Số ngày làm việc cần cộng/trừ",
			lblHolidays: "Danh sách ngày lễ",
			lblAddHoliday: "Thêm ngày lễ tùy chọn",
			lblResults: "Kết quả tính toán",
			totalDays: "Tổng số ngày lịch",
			weekendDays: "Số ngày cuối tuần (T7/CN)",
			businessDays: "Số ngày làm việc thực tế",
			targetDate: "Ngày đích",
			add: "Thêm",
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

	// Calculate results on input change
	useEffect(() => {
		if (mode === "diff") {
			const start = new Date(startDate);
			const end = new Date(endDate);
			if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;

			let total = 0;
			let weekends = 0;
			let business = 0;

			const current = new Date(Math.min(start.getTime(), end.getTime()));
			const target = new Date(Math.max(start.getTime(), end.getTime()));

			// Set hours to noon to avoid daylight saving hour changes shifting dates
			current.setHours(12, 0, 0, 0);
			target.setHours(12, 0, 0, 0);

			while (current <= target) {
				total++;
				const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
				const dateString = current.toISOString().split("T")[0];
				const isHoliday = customHolidays.includes(dateString);

				if (dayOfWeek === 0 || dayOfWeek === 6 || isHoliday) {
					weekends++;
				} else {
					business++;
				}
				current.setDate(current.getDate() + 1);
			}

			// If start date is after end date, make it negative
			const sign = start.getTime() > end.getTime() ? -1 : 1;

			setResultDiff({
				total: total * sign,
				weekends: weekends * sign,
				business: business * sign,
			});
		} else {
			const base = new Date(baseDate);
			if (Number.isNaN(base.getTime())) return;

			base.setHours(12, 0, 0, 0);
			let remainingDays = Math.abs(daysOffset);
			const direction = daysOffset >= 0 ? 1 : -1;

			while (remainingDays > 0) {
				base.setDate(base.getDate() + direction);
				const dayOfWeek = base.getDay();
				const dateString = base.toISOString().split("T")[0];
				const isHoliday = customHolidays.includes(dateString);

				if (dayOfWeek !== 0 && dayOfWeek !== 6 && !isHoliday) {
					remainingDays--;
				}
			}

			setResultAddDate(
				base.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
					weekday: "long",
					year: "numeric",
					month: "long",
					day: "numeric",
				}),
			);
		}
	}, [startDate, endDate, baseDate, daysOffset, customHolidays, mode, lang]);

	const addHoliday = () => {
		if (newHoliday && !customHolidays.includes(newHoliday)) {
			setCustomHolidays((prev) => [...prev, newHoliday].sort());
			setNewHoliday("");
		}
	};

	const removeHoliday = (dateStr: string) => {
		setCustomHolidays((prev) => prev.filter((d) => d !== dateStr));
	};

	const [copied, setCopied] = useState(false);
	const handleCopyResult = () => {
		navigator.clipboard.writeText(resultAddDate);
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	return (
		<div class="space-y-6">
			{/* Mode navigation tabs */}
			<div class="flex border-b border-hairline gap-4">
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "diff"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("diff")}
				>
					{t.tabDiff}
				</button>
				<button
					class={`pb-2 text-body-sm-strong cursor-pointer border-b-2 transition-all ${
						mode === "add"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setMode("add")}
				>
					{t.tabAdd}
				</button>
			</div>

			<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm">
				<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2 mb-2">
					{t.title}
				</h3>
				<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Input Control panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					{mode === "diff" ? (
						<>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblStart}</label>
								<input
									type="date"
									class="input w-full"
									value={startDate}
									onChange={(e) => setStartDate((e.target as HTMLInputElement).value)}
								/>
							</div>

							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblEnd}</label>
								<input
									type="date"
									class="input w-full"
									value={endDate}
									onChange={(e) => setEndDate((e.target as HTMLInputElement).value)}
								/>
							</div>
						</>
					) : (
						<>
							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblBase}</label>
								<input
									type="date"
									class="input w-full"
									value={baseDate}
									onChange={(e) => setBaseDate((e.target as HTMLInputElement).value)}
								/>
							</div>

							<div class="space-y-1.5">
								<label class="text-body-sm-strong text-ink block">{t.lblOffset}</label>
								<input
									type="number"
									class="input w-full"
									value={daysOffset}
									onChange={(e) => setDaysOffset(Number((e.target as HTMLInputElement).value))}
								/>
							</div>
						</>
					)}

					{/* Holidays Config block */}
					<div class="border-t border-hairline pt-4 space-y-3">
						<label class="text-body-sm-strong text-ink block">{t.lblHolidays}</label>
						<div class="flex gap-2">
							<input
								type="date"
								class="input w-full"
								value={newHoliday}
								onChange={(e) => setNewHoliday((e.target as HTMLInputElement).value)}
							/>
							<button class="btn-primary py-2 px-4 shrink-0" onClick={addHoliday}>
								{t.add}
							</button>
						</div>

						{customHolidays.length > 0 && (
							<div class="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-hairline p-2 rounded-lg bg-surface-soft">
								{customHolidays.map((hDate) => (
									<div
										key={hDate}
										class="flex items-center gap-1.5 bg-surface-elevated border border-hairline rounded px-2 py-0.5 text-xs font-mono"
									>
										<span>{hDate}</span>
										<button
											class="text-muted hover:text-accent-rose font-bold"
											onClick={() => removeHoliday(hDate)}
										>
											×
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{mode === "diff" ? (
						<div class="space-y-3">
							<div class="flex justify-between items-center bg-surface-soft p-3 rounded-lg border border-hairline">
								<span class="text-body-sm text-muted">{t.totalDays}</span>
								<span class="font-mono text-body-sm-strong font-bold text-ink">
									{resultDiff.total}
								</span>
							</div>
							<div class="flex justify-between items-center bg-surface-soft p-3 rounded-lg border border-hairline">
								<span class="text-body-sm text-muted">{t.weekendDays}</span>
								<span class="font-mono text-body-sm-strong font-bold text-ink">
									{resultDiff.weekends}
								</span>
							</div>
							<div class="flex justify-between items-center bg-surface-soft p-3 rounded-lg border border-hairline">
								<span class="text-body-sm text-muted">{t.businessDays}</span>
								<span class="font-mono text-body-sm-strong font-bold text-primary">
									{resultDiff.business}
								</span>
							</div>
						</div>
					) : (
						<div class="space-y-3">
							<label class="text-caption-uppercase text-muted block">{t.targetDate}</label>
							<div class="flex gap-2">
								<input
									readOnly
									type="text"
									class="input w-full font-mono text-body-sm bg-surface-soft"
									value={resultAddDate}
								/>
								<button
									class="btn-secondary py-2 px-4 text-xs whitespace-nowrap"
									onClick={handleCopyResult}
								>
									{copied ? t.copied : t.copy}
								</button>
							</div>
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
