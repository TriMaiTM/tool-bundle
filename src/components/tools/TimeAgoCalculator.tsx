import { useEffect, useState } from "preact/hooks";

export default function TimeAgoCalculator() {
	const [lang, setLang] = useState<"en" | "vi">("en");
	const [inputDateTime, setInputDateTime] = useState(new Date().toISOString().substring(0, 16));
	const [relativeText, setRelativeText] = useState("");
	const [copied, setCopied] = useState(false);
	const [breakdowns, setBreakdowns] = useState({
		years: "0",
		months: "0",
		weeks: "0",
		days: "0",
		hours: "0",
		minutes: "0",
		seconds: "0",
	});

	const t = {
		en: {
			title: "Time Ago & Relative Calculator",
			desc: "Compute the exact relative time distance (past or future) and view breakdowns in years, months, days, minutes, and seconds.",
			lblInput: "Select Date and Time",
			lblResults: "Unit Breakdowns",
			lblRelative: "Relative Description",
			copied: "Copied!",
			copy: "Copy Relative Text",
			years: "Years",
			months: "Months",
			weeks: "Weeks",
			days: "Days",
			hours: "Hours",
			minutes: "Minutes",
			seconds: "Seconds",
			justNow: "just now",
			ago: "ago",
			in: "in",
			yearSingular: "year",
			yearPlural: "years",
			monthSingular: "month",
			monthPlural: "months",
			weekSingular: "week",
			weekPlural: "weeks",
			daySingular: "day",
			dayPlural: "days",
			hourSingular: "hour",
			hourPlural: "hours",
			minuteSingular: "minute",
			minutePlural: "minutes",
			secondSingular: "second",
			secondPlural: "seconds",
		},
		vi: {
			title: "Máy tính thời gian tương đối (Time Ago)",
			desc: "Tính khoảng cách thời gian tương đối tới một mốc quá khứ hoặc tương lai, đồng thời phân tích chi tiết các đơn vị thời gian.",
			lblInput: "Chọn ngày và giờ",
			lblResults: "Phân tích theo đơn vị",
			lblRelative: "Mô tả tương đối",
			copied: "Đã chép!",
			copy: "Sao chép mô tả",
			years: "Năm",
			months: "Tháng",
			weeks: "Tuần",
			days: "Ngày",
			hours: "Giờ",
			minutes: "Phút",
			seconds: "Giây",
			justNow: "vừa xong",
			ago: "trước",
			in: "trong",
			yearSingular: "năm",
			yearPlural: "năm",
			monthSingular: "tháng",
			monthPlural: "tháng",
			weekSingular: "tuần",
			weekPlural: "tuần",
			daySingular: "ngày",
			dayPlural: "ngày",
			hourSingular: "giờ",
			hourPlural: "giờ",
			minuteSingular: "phút",
			minutePlural: "phút",
			secondSingular: "giây",
			secondPlural: "giây",
		},
	}[lang];

	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}
	}, []);

	// Run computation whenever input changes
	useEffect(() => {
		const target = new Date(inputDateTime);
		if (Number.isNaN(target.getTime())) return;

		const now = new Date();
		const diffMs = target.getTime() - now.getTime();
		const absDiff = Math.abs(diffMs);

		// Calculate units
		const seconds = Math.floor(absDiff / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30.437); // Average month length
		const years = Math.floor(days / 365.24);

		setBreakdowns({
			years: years.toLocaleString(),
			months: months.toLocaleString(),
			weeks: weeks.toLocaleString(),
			days: days.toLocaleString(),
			hours: hours.toLocaleString(),
			minutes: minutes.toLocaleString(),
			seconds: seconds.toLocaleString(),
		});

		// Build verbal relative string
		const prefix = diffMs > 0 ? `${t.in} ` : "";
		const suffix = diffMs < 0 ? ` ${t.ago}` : "";

		let verbal = t.justNow;

		if (seconds >= 5) {
			if (years > 0) {
				const unit = years === 1 ? t.yearSingular : t.yearPlural;
				verbal = `${prefix}${years} ${unit}${suffix}`;
			} else if (months > 0) {
				const unit = months === 1 ? t.monthSingular : t.monthPlural;
				verbal = `${prefix}${months} ${unit}${suffix}`;
			} else if (weeks > 0) {
				const unit = weeks === 1 ? t.weekSingular : t.weekPlural;
				verbal = `${prefix}${weeks} ${unit}${suffix}`;
			} else if (days > 0) {
				const unit = days === 1 ? t.daySingular : t.dayPlural;
				verbal = `${prefix}${days} ${unit}${suffix}`;
			} else if (hours > 0) {
				const unit = hours === 1 ? t.hourSingular : t.hourPlural;
				verbal = `${prefix}${hours} ${unit}${suffix}`;
			} else if (minutes > 0) {
				const unit = minutes === 1 ? t.minuteSingular : t.minutePlural;
				verbal = `${prefix}${minutes} ${unit}${suffix}`;
			} else {
				const unit = seconds === 1 ? t.secondSingular : t.secondPlural;
				verbal = `${prefix}${seconds} ${unit}${suffix}`;
			}
		}

		setRelativeText(verbal);
	}, [inputDateTime, lang]);

	const handleCopy = () => {
		navigator.clipboard.writeText(relativeText);
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

					<div class="space-y-1.5">
						<label class="text-body-sm-strong text-ink block">{t.lblInput}</label>
						<input
							type="datetime-local"
							class="input w-full font-mono text-body-sm"
							value={inputDateTime}
							onChange={(e) => setInputDateTime((e.target as HTMLInputElement).value)}
						/>
					</div>
				</div>

				{/* Results panel */}
				<div class="lg:col-span-7 space-y-6">
					{/* Verbal Description Card */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-3">
						<h4 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblRelative}
						</h4>
						<div class="flex gap-2">
							<input
								readOnly
								type="text"
								class="input w-full font-mono text-body-sm bg-surface-soft font-bold text-primary"
								value={relativeText}
							/>
							<button
								class="btn-secondary py-2 px-4 text-xs whitespace-nowrap"
								onClick={handleCopy}
							>
								{copied ? t.copied : t.copy}
							</button>
						</div>
					</div>

					{/* Breakdowns Grid */}
					<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
						<h3 class="text-body-strong text-ink font-bold border-b border-hairline pb-2">
							{t.lblResults}
						</h3>

						<div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
							{[
								{ label: t.years, val: breakdowns.years },
								{ label: t.months, val: breakdowns.months },
								{ label: t.weeks, val: breakdowns.weeks },
								{ label: t.days, val: breakdowns.days },
								{ label: t.hours, val: breakdowns.hours },
								{ label: t.minutes, val: breakdowns.minutes },
								{ label: t.seconds, val: breakdowns.seconds },
							].map((item) => (
								<div
									key={item.label}
									class="bg-surface-soft p-3 rounded-lg border border-hairline text-center"
								>
									<span class="text-[10px] text-muted uppercase font-bold block mb-1">
										{item.label}
									</span>
									<span class="font-mono text-body-sm-strong font-bold text-ink">{item.val}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
