import { useEffect, useState } from "preact/hooks";

function getISOWeek(date: Date): number {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	const dayNum = d.getUTCDay() || 7;
	d.setUTCDate(d.getUTCDate() + 4 - dayNum);
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
	return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function getUSWeek(date: Date): number {
	const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
	// Find Sunday of current week
	const day = d.getDay();
	d.setDate(d.getDate() - day);
	// Find Jan 1 of same year
	const jan1 = new Date(d.getFullYear(), 0, 1);
	// Diff in days
	const diff = Math.round((d.getTime() - jan1.getTime()) / 86400000);
	return Math.floor(diff / 7) + 1;
}

export default function WeekNumberCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
	const [isoWeek, setIsoWeek] = useState(1);
	const [usWeek, setUsWeek] = useState(1);
	const [weekDates, setWeekDates] = useState<string[]>([]);
	const [copied, setCopied] = useState<number | null>(null);

	const t = {
		en: {
			title: "Week Number Calculator",
			desc: "Determine the exact ISO-8601 and US calendar week numbers for any date and list all surrounding dates in that week.",
			lblDate: "Select Date",
			lblResults: "Week Analysis",
			lblDatesInWeek: "Days of Selected Week",
			isoWeekLabel: "ISO-8601 Week",
			usWeekLabel: "US Calendar Week",
			dayOfWeek: "Day of Week",
			copied: "Copied!",
			copy: "Copy",
		},
		vi: {
			title: "Tính số thứ tự tuần",
			desc: "Xác định số thứ tự tuần theo chuẩn ISO-8601 và lịch Mỹ cho bất kỳ ngày nào, hiển thị chi tiết các ngày trong tuần.",
			lblDate: "Chọn ngày",
			lblResults: "Phân tích số tuần",
			lblDatesInWeek: "Chi tiết các ngày trong tuần",
			isoWeekLabel: "Tuần ISO-8601 (Bắt đầu Thứ Hai)",
			usWeekLabel: "Tuần theo Lịch Mỹ (Bắt đầu Chủ Nhật)",
			dayOfWeek: "Thứ trong tuần",
			copied: "Đã chép!",
			copy: "Sao chép",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Calculate week numbers and adjacent dates
	useEffect(() => {
		const dateObj = new Date(selectedDate);
		if (Number.isNaN(dateObj.getTime())) return;

		setIsoWeek(getISOWeek(dateObj));
		setUsWeek(getUSWeek(dateObj));

		// Get Monday of the ISO week
		const currentDay = dateObj.getDay();
		const offset = currentDay === 0 ? -6 : 1 - currentDay; // Distance to Monday
		const startOfWeek = new Date(dateObj);
		startOfWeek.setDate(startOfWeek.getDate() + offset);

		const list: string[] = [];
		for (let i = 0; i < 7; i++) {
			const d = new Date(startOfWeek);
			d.setDate(d.getDate() + i);
			list.push(
				d.toLocaleDateString(lang === "en" ? "en-US" : "vi-VN", {
					weekday: "long",
					year: "numeric",
					month: "short",
					day: "numeric",
				}),
			);
		}
		setWeekDates(list);
	}, [selectedDate, lang]);

	const handleCopy = (val: string, idx: number) => {
		navigator.clipboard.writeText(val);
		setCopied(idx);
		setTimeout(() => setCopied(null), 1500);
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

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblDate}</label>
						<input
							type="date"
							class="input w-full"
							value={selectedDate}
							onChange={(e) => setSelectedDate((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Week analysis */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h3>

						<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
							<div class="bg-surface-soft p-4 rounded-lg border border-hairline">
								<span class="text-body-xs text-muted block mb-1">{t.isoWeekLabel}</span>
								<span class="text-2xl font-mono font-bold text-primary">W{isoWeek}</span>
							</div>

							<div class="bg-surface-soft p-4 rounded-lg border border-hairline">
								<span class="text-body-xs text-muted block mb-1">{t.usWeekLabel}</span>
								<span class="text-2xl font-mono font-bold text-ink">W{usWeek}</span>
							</div>
						</div>
					</div>

					{/* List of dates in week */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblDatesInWeek}
						</h3>

						<div class="space-y-2">
							{weekDates.map((item, idx) => (
								<div
									key={idx}
									class="flex items-center justify-between bg-surface-soft p-2.5 rounded-lg border border-hairline hover:border-primary/30 transition-colors"
								>
									<span class="text-body-sm text-ink">{item}</span>
									<button
										class="btn-secondary text-[10px] py-1.5 px-3 whitespace-nowrap"
										onClick={() => handleCopy(item, idx)}
									>
										{copied === idx ? t.copied : t.copy}
									</button>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
