import { useEffect, useState } from "preact/hooks";

export default function TimeDurationCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [startTime, setStartTime] = useState("08:30");
	const [endTime, setEndTime] = useState("17:15");
	const [nextDay, setNextDay] = useState(false);
	const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

	const t = {
		en: {
			title: "Time Duration Calculator",
			desc: "Calculate working shift hours, project durations, or elapsed time between two points of day.",
			lblStart: "Start Time (24h)",
			lblEnd: "End Time (24h)",
			lblNextDay: "End time is on next day (crosses midnight)",
			lblResults: "Computed Durations",
			lblHnM: "Hours and Minutes",
			lblTotalMin: "Total Minutes",
			lblTotalSec: "Total Seconds",
			lblDecimal: "Decimal Hours",
			copied: "Copied!",
			copy: "Copy",
			unitHours: "hours",
			unitMinutes: "minutes",
		},
		vi: {
			title: "Máy tính khoảng thời gian",
			desc: "Tính toán thời gian ca làm việc, thời lượng cuộc họp hoặc khoảng cách giờ giữa hai thời điểm trong ngày.",
			lblStart: "Giờ bắt đầu (24h)",
			lblEnd: "Giờ kết thúc (24h)",
			lblNextDay: "Giờ kết thúc thuộc ngày hôm sau (qua nửa đêm)",
			lblResults: "Thời lượng tính được",
			lblHnM: "Giờ và Phút",
			lblTotalMin: "Tổng số phút",
			lblTotalSec: "Tổng số giây",
			lblDecimal: "Số giờ dạng thập phân",
			copied: "Đã chép!",
			copy: "Sao chép",
			unitHours: "giờ",
			unitMinutes: "phút",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Calculate durations
	const getDurations = () => {
		const [startH, startM] = startTime.split(":").map(Number);
		const [endH, endM] = endTime.split(":").map(Number);

		if (Number.isNaN(startH) || Number.isNaN(startM) || Number.isNaN(endH) || Number.isNaN(endM)) {
			return null;
		}

		const startTotal = startH * 60 + startM;
		let endTotal = endH * 60 + endM;

		if (nextDay || endTotal < startTotal) {
			endTotal += 24 * 60; // Add 24 hours in minutes
		}

		const diffMinutes = endTotal - startTotal;
		const hours = Math.floor(diffMinutes / 60);
		const mins = diffMinutes % 60;

		return {
			formatted: `${hours} ${t.unitHours}, ${mins} ${t.unitMinutes}`,
			minutes: diffMinutes,
			seconds: diffMinutes * 60,
			decimal: (diffMinutes / 60).toFixed(2),
		};
	};

	const result = getDurations();

	const handleCopy = (val: string, format: string) => {
		navigator.clipboard.writeText(val);
		setCopiedFormat(format);
		setTimeout(() => setCopiedFormat(null), 1500);
	};

	return (
		<div class="space-y-6">
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
				{/* Configuration panel */}
				<div class="lg:col-span-5 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.title}
					</h3>
					<p class="text-body-xs text-muted leading-relaxed">{t.desc}</p>

					{/* Start Time */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblStart}</label>
						<input
							type="time"
							class="input w-full"
							value={startTime}
							onChange={(e) => setStartTime((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* End Time */}
					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblEnd}</label>
						<input
							type="time"
							class="input w-full"
							value={endTime}
							onChange={(e) => setEndTime((e.target as HTMLInputElement).value)}
						/>
					</div>

					{/* Midnight crossing checkbox */}
					<div class="flex items-center gap-2 pt-2">
						<input
							type="checkbox"
							id="nextDay"
							checked={nextDay}
							onChange={(e) => setNextDay((e.target as HTMLInputElement).checked)}
							class="w-4 h-4 rounded text-primary focus:ring-primary"
						/>
						<label htmlFor="nextDay" class="text-body-sm text-ink cursor-pointer select-none">
							{t.lblNextDay}
						</label>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
					<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
						{t.lblResults}
					</h3>

					{result && (
						<div class="space-y-4">
							{[
								{ label: t.lblHnM, val: result.formatted, key: "formatted" },
								{ label: t.lblDecimal, val: `${result.decimal} ${t.unitHours}`, key: "decimal" },
								{
									label: t.lblTotalMin,
									val: `${result.minutes} ${lang === "en" ? "min" : "phút"}`,
									key: "minutes",
								},
								{
									label: t.lblTotalSec,
									val: `${result.seconds} ${lang === "en" ? "sec" : "giây"}`,
									key: "seconds",
								},
							].map((item) => (
								<div key={item.key} class="space-y-1.5">
									<label class="text-caption-uppercase text-muted block">{item.label}</label>
									<div class="flex gap-2">
										<input
											readOnly
											type="text"
											class="input w-full font-mono text-body-sm bg-surface-soft"
											value={item.val}
										/>
										<button
											class="btn-secondary py-1.5 px-3 text-xs whitespace-nowrap"
											onClick={() => handleCopy(item.val, item.key)}
										>
											{copiedFormat === item.key ? t.copied : t.copy}
										</button>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}
