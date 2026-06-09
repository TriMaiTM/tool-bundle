import { useCallback, useEffect, useState } from "preact/hooks";

type CronMode = "every" | "increment" | "specific";

export default function CronGenerator() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	const [activeTab, setActiveTab] = useState<"build" | "explain">("build");

	// State for Builder
	const [minMode, setMinMode] = useState<CronMode>("every");
	const [minVal, setMinVal] = useState("5");
	const [minSpecific, setMinSpecific] = useState<string[]>([]);

	const [hourMode, setHourMode] = useState<CronMode>("every");
	const [hourVal, setHourVal] = useState("2");
	const [hourSpecific, setHourSpecific] = useState<string[]>([]);

	const [domMode, setDomMode] = useState<CronMode>("every");
	const [domVal, setDomVal] = useState("1");
	const [domSpecific, setDomSpecific] = useState<string[]>([]);

	const [monthMode, setMonthMode] = useState<CronMode>("every");
	const [monthVal, setMonthVal] = useState("1");
	const [monthSpecific, setMonthSpecific] = useState<string[]>([]);

	const [dowMode, setDowMode] = useState<CronMode>("every");
	const [dowVal, setDowVal] = useState("1");
	const [dowSpecific, setDowSpecific] = useState<string[]>([]);

	// Explained state
	const [cronExpression, setCronExpression] = useState("* * * * *");
	const [explanation, setExplanation] = useState("");
	const [copied, setCopied] = useState(false);

	const t = {
		en: {
			title: "Cron Expression Generator",
			tabBuild: "Build Cron",
			tabExplain: "Explain Cron",
			lblMinutes: "Minutes",
			lblHours: "Hours",
			lblDom: "Day of Month",
			lblMonths: "Months",
			lblDow: "Day of Week",
			optEvery: "Every",
			optIncrement: "Every N intervals",
			optSpecific: "Specific selections",
			btnCopy: "Copy Expression",
			copied: "Copied!",
			lblResult: "Generated Cron Expression",
			lblExplanation: "Human-Readable Explanation",
			errInvalid: "Invalid expression. Must contain exactly 5 fields separated by spaces.",
			descMinutes: "minute",
			descHours: "hour",
			descDom: "day of month",
			descMonths: "month",
			descDow: "day of week",
		},
		vi: {
			title: "Trình tạo biểu thức Cron",
			tabBuild: "Tạo biểu thức",
			tabExplain: "Giải nghĩa Cron",
			lblMinutes: "Phút",
			lblHours: "Giờ",
			lblDom: "Ngày trong tháng",
			lblMonths: "Tháng",
			lblDow: "Ngày trong tuần",
			optEvery: "Mỗi (Tất cả)",
			optIncrement: "Lặp lại sau mỗi N",
			optSpecific: "Các giá trị cụ thể",
			btnCopy: "Sao chép biểu thức",
			copied: "Đã copy!",
			lblResult: "Biểu thức Cron tạo ra",
			lblExplanation: "Mô tả bằng ngôn ngữ tự nhiên",
			errInvalid:
				"Biểu thức không hợp lệ. Phải chứa chính xác 5 trường ngăn cách bởi khoảng trắng.",
			descMinutes: "phút",
			descHours: "giờ",
			descDom: "ngày trong tháng",
			descMonths: "tháng",
			descDow: "ngày trong tuần",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Explainer logic
	const explainPart = (part: string, type: "minute" | "hour" | "dom" | "month" | "dow"): string => {
		const isEn = lang === "en";
		const names = {
			minute: t.descMinutes,
			hour: t.descHours,
			dom: t.descDom,
			month: t.descMonths,
			dow: t.descDow,
		};
		const name = names[type];

		if (part === "*") {
			if (type === "minute") return isEn ? "every minute" : "mỗi phút";
			if (type === "hour") return isEn ? "every hour" : "mỗi giờ";
			if (type === "dom") return isEn ? "every day" : "mỗi ngày";
			if (type === "month") return isEn ? "every month" : "mỗi tháng";
			return isEn ? "every day of week" : "tất cả các ngày trong tuần";
		}

		if (part.startsWith("*/")) {
			const num = part.substring(2);
			return isEn ? `every ${num} ${name}s` : `mỗi ${num} ${name}`;
		}

		if (part.includes(",")) {
			const list = part.split(",");
			return isEn ? `at ${name}s: ${list.join(", ")}` : `vào các ${name}: ${list.join(", ")}`;
		}

		if (part.includes("-")) {
			const [start, end] = part.split("-");
			return isEn ? `from ${name} ${start} to ${end}` : `từ ${name} ${start} đến ${end}`;
		}

		return isEn ? `at ${name} ${part}` : `vào ${name} ${part}`;
	};

	const generateExplanation = useCallback(
		(expr: string) => {
			const parts = expr.trim().split(/\s+/);
			if (parts.length !== 5) {
				setExplanation(t.errInvalid);
				return;
			}

			const m = explainPart(parts[0], "minute");
			const h = explainPart(parts[1], "hour");
			const dom = explainPart(parts[2], "dom");
			const mon = explainPart(parts[3], "month");
			const dow = explainPart(parts[4], "dow");

			if (lang === "en") {
				setExplanation(`Runs ${m}, ${h}, ${dom}, ${mon}, and ${dow}.`);
			} else {
				setExplanation(`Chạy vào ${m}, ${h}, ${dom}, ${mon}, và ${dow}.`);
			}
		},
		[lang, t.errInvalid],
	);

	const buildPart = (mode: CronMode, incVal: string, specificVals: string[]): string => {
		if (mode === "every") return "*";
		if (mode === "increment") return `*/${incVal || "1"}`;
		if (mode === "specific" && specificVals.length > 0) return specificVals.join(",");
		return "*";
	};

	// Generate expression from builders
	useEffect(() => {
		if (activeTab === "build") {
			const m = buildPart(minMode, minVal, minSpecific);
			const h = buildPart(hourMode, hourVal, hourSpecific);
			const dom = buildPart(domMode, domVal, domSpecific);
			const mon = buildPart(monthMode, monthVal, monthSpecific);
			const dow = buildPart(dowMode, dowVal, dowSpecific);

			const expr = `${m} ${h} ${dom} ${mon} ${dow}`;
			setCronExpression(expr);
			generateExplanation(expr);
		}
	}, [
		minMode,
		minVal,
		minSpecific,
		hourMode,
		hourVal,
		hourSpecific,
		domMode,
		domVal,
		domSpecific,
		monthMode,
		monthVal,
		monthSpecific,
		dowMode,
		dowVal,
		dowSpecific,
		activeTab,
		generateExplanation,
	]);

	const handleCopy = () => {
		navigator.clipboard.writeText(cronExpression).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};

	const toggleSpecific = (val: string, list: string[], setList: (arr: string[]) => void) => {
		if (list.includes(val)) {
			setList(list.filter((x) => x !== val));
		} else {
			setList([...list, val].sort((a, b) => Number.parseInt(a) - Number.parseInt(b)));
		}
	};

	return (
		<div class="space-y-6">
			{/* Tab Header */}
			<div class="flex border-b border-hairline gap-2">
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "build"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("build")}
				>
					{t.tabBuild}
				</button>
				<button
					class={`px-4 py-2 text-body-sm font-bold border-b-2 transition-all ${
						activeTab === "explain"
							? "border-primary text-primary"
							: "border-transparent text-muted hover:text-ink"
					}`}
					onClick={() => setActiveTab("explain")}
				>
					{t.tabExplain}
				</button>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Builder Options */}
				<div class="lg:col-span-8 space-y-4">
					{activeTab === "build" ? (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
							{/* Minutes */}
							<div class="space-y-2 border-b border-hairline pb-4">
								<h3 class="text-body-strong text-ink font-bold">{t.lblMinutes}</h3>
								<div class="flex gap-4 flex-wrap">
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="minMode"
											checked={minMode === "every"}
											onChange={() => setMinMode("every")}
										/>
										{t.optEvery}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="minMode"
											checked={minMode === "increment"}
											onChange={() => setMinMode("increment")}
										/>
										{t.optIncrement}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="minMode"
											checked={minMode === "specific"}
											onChange={() => setMinMode("specific")}
										/>
										{t.optSpecific}
									</label>
								</div>

								{minMode === "increment" && (
									<div class="flex items-center gap-2 pt-2">
										<span class="text-xs text-muted">Every</span>
										<input
											type="number"
											class="input py-1 w-20 text-xs font-bold"
											min="1"
											max="59"
											value={minVal}
											onInput={(e) => setMinVal((e.target as HTMLInputElement).value)}
										/>
										<span class="text-xs text-muted">minutes</span>
									</div>
								)}

								{minMode === "specific" && (
									<div class="grid grid-cols-10 gap-1.5 pt-2">
										{Array.from({ length: 12 }, (_, idx) => idx * 5).map((m) => (
											<button
												key={m}
												class={`py-1 text-center font-mono text-[11px] rounded border transition-colors ${
													minSpecific.includes(m.toString())
														? "bg-primary text-white border-primary"
														: "bg-surface-soft border-hairline text-ink hover:border-primary"
												}`}
												onClick={() => toggleSpecific(m.toString(), minSpecific, setMinSpecific)}
											>
												{m}m
											</button>
										))}
									</div>
								)}
							</div>

							{/* Hours */}
							<div class="space-y-2 border-b border-hairline pb-4">
								<h3 class="text-body-strong text-ink font-bold">{t.lblHours}</h3>
								<div class="flex gap-4 flex-wrap">
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="hourMode"
											checked={hourMode === "every"}
											onChange={() => setHourMode("every")}
										/>
										{t.optEvery}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="hourMode"
											checked={hourMode === "increment"}
											onChange={() => setHourMode("increment")}
										/>
										{t.optIncrement}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="hourMode"
											checked={hourMode === "specific"}
											onChange={() => setHourMode("specific")}
										/>
										{t.optSpecific}
									</label>
								</div>

								{hourMode === "increment" && (
									<div class="flex items-center gap-2 pt-2">
										<span class="text-xs text-muted">Every</span>
										<input
											type="number"
											class="input py-1 w-20 text-xs font-bold"
											min="1"
											max="23"
											value={hourVal}
											onInput={(e) => setHourVal((e.target as HTMLInputElement).value)}
										/>
										<span class="text-xs text-muted">hours</span>
									</div>
								)}

								{hourMode === "specific" && (
									<div class="grid grid-cols-8 gap-1.5 pt-2">
										{Array.from({ length: 24 }, (_, idx) => idx).map((h) => (
											<button
												key={h}
												class={`py-1 text-center font-mono text-[11px] rounded border transition-colors ${
													hourSpecific.includes(h.toString())
														? "bg-primary text-white border-primary"
														: "bg-surface-soft border-hairline text-ink hover:border-primary"
												}`}
												onClick={() => toggleSpecific(h.toString(), hourSpecific, setHourSpecific)}
											>
												{h}h
											</button>
										))}
									</div>
								)}
							</div>

							{/* Day of Month */}
							<div class="space-y-2 border-b border-hairline pb-4">
								<h3 class="text-body-strong text-ink font-bold">{t.lblDom}</h3>
								<div class="flex gap-4 flex-wrap">
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="domMode"
											checked={domMode === "every"}
											onChange={() => setDomMode("every")}
										/>
										{t.optEvery}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="domMode"
											checked={domMode === "specific"}
											onChange={() => setDomMode("specific")}
										/>
										{t.optSpecific}
									</label>
								</div>

								{domMode === "specific" && (
									<div class="grid grid-cols-8 gap-1.5 pt-2">
										{Array.from({ length: 31 }, (_, idx) => idx + 1).map((d) => (
											<button
												key={d}
												class={`py-1 text-center font-mono text-[11px] rounded border transition-colors ${
													domSpecific.includes(d.toString())
														? "bg-primary text-white border-primary"
														: "bg-surface-soft border-hairline text-ink hover:border-primary"
												}`}
												onClick={() => toggleSpecific(d.toString(), domSpecific, setDomSpecific)}
											>
												{d}
											</button>
										))}
									</div>
								)}
							</div>

							{/* Day of Week */}
							<div class="space-y-2">
								<h3 class="text-body-strong text-ink font-bold">{t.lblDow}</h3>
								<div class="flex gap-4 flex-wrap">
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="dowMode"
											checked={dowMode === "every"}
											onChange={() => setDowMode("every")}
										/>
										{t.optEvery}
									</label>
									<label class="flex items-center gap-1.5 text-xs font-bold text-ink cursor-pointer">
										<input
											type="radio"
											class="accent-primary"
											name="dowMode"
											checked={dowMode === "specific"}
											onChange={() => setDowMode("specific")}
										/>
										{t.optSpecific}
									</label>
								</div>

								{dowMode === "specific" && (
									<div class="grid grid-cols-7 gap-1.5 pt-2">
										{[
											{ key: "0", name: "Sun" },
											{ key: "1", name: "Mon" },
											{ key: "2", name: "Tue" },
											{ key: "3", name: "Wed" },
											{ key: "4", name: "Thu" },
											{ key: "5", name: "Fri" },
											{ key: "6", name: "Sat" },
										].map((day) => (
											<button
												key={day.key}
												class={`py-1 text-center font-mono text-[11px] rounded border transition-colors ${
													dowSpecific.includes(day.key)
														? "bg-primary text-white border-primary"
														: "bg-surface-soft border-hairline text-ink hover:border-primary"
												}`}
												onClick={() => toggleSpecific(day.key, dowSpecific, setDowSpecific)}
											>
												{day.name}
											</button>
										))}
									</div>
								)}
							</div>
						</div>
					) : (
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<div class="space-y-2">
								<label class="text-body-sm-strong text-ink block">Input Cron Expression</label>
								<input
									type="text"
									class="input w-full font-mono text-body-sm"
									value={cronExpression}
									onInput={(e) => {
										const val = (e.target as HTMLInputElement).value;
										setCronExpression(val);
										generateExplanation(val);
									}}
								/>
							</div>

							<div class="bg-surface-soft p-4 rounded-lg border border-hairline space-y-2">
								<h4 class="text-xs text-muted font-bold uppercase">Syntax Description</h4>
								<div class="grid grid-cols-5 text-[10px] font-mono text-center gap-1">
									<div class="bg-surface-elevated p-1 rounded border border-hairline">
										<div class="text-primary font-bold">*</div>
										<div class="text-muted mt-0.5">Min</div>
									</div>
									<div class="bg-surface-elevated p-1 rounded border border-hairline">
										<div class="text-primary font-bold">*</div>
										<div class="text-muted mt-0.5">Hour</div>
									</div>
									<div class="bg-surface-elevated p-1 rounded border border-hairline">
										<div class="text-primary font-bold">*</div>
										<div class="text-muted mt-0.5">Day</div>
									</div>
									<div class="bg-surface-elevated p-1 rounded border border-hairline">
										<div class="text-primary font-bold">*</div>
										<div class="text-muted mt-0.5">Month</div>
									</div>
									<div class="bg-surface-elevated p-1 rounded border border-hairline">
										<div class="text-primary font-bold">*</div>
										<div class="text-muted mt-0.5">Week</div>
									</div>
								</div>
							</div>
						</div>
					)}
				</div>

				{/* Right Side Outputs */}
				<div class="lg:col-span-4 space-y-4">
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<div class="space-y-2">
							<span class="text-body-sm-strong text-ink block">{t.lblResult}</span>
							<div class="flex gap-2">
								<input
									type="text"
									class="input flex-1 font-mono text-body font-bold text-center bg-surface-soft"
									readOnly
									value={cronExpression}
								/>
								<button
									class="btn-secondary px-3 py-2 text-xs flex items-center font-bold active:scale-[0.98] transition-all cursor-pointer rounded-full"
									onClick={handleCopy}
								>
									{copied ? t.copied : t.btnCopy}
								</button>
							</div>
						</div>

						<div class="space-y-2 pt-2 border-t border-hairline">
							<span class="text-body-sm-strong text-ink block">{t.lblExplanation}</span>
							<p class="text-body-sm text-ink leading-relaxed p-3.5 bg-surface-soft border border-hairline rounded-lg font-bold">
								{explanation}
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
