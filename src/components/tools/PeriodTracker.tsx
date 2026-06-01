import { useEffect, useState } from "preact/hooks";

interface SavedTrackerData {
	lastPeriodDate: string;
	cycleLength: number;
	periodLength: number;
}

export default function PeriodTracker() {
	const [lang, setLang] = useState<"en" | "vi">("en");

	// Input State
	const [lastPeriodDate, setLastPeriodDate] = useState<string>(
		new Date().toISOString().split("T")[0],
	);
	const [cycleLength, setCycleLength] = useState<number>(28);
	const [periodLength, setPeriodLength] = useState<number>(5);

	// Multi-language strings
	const t = {
		en: {
			settings: "Tracker Setup",
			lastPeriodDate: "Start Date of Last Period",
			cycleLength: "Average Cycle Length",
			periodLength: "Period Duration",
			days: "days",
			save: "Save & Predict",
			predictions: "Predictions",
			nextPeriod: "Next Period Starts",
			fertileWindow: "Fertile Window (High Chance)",
			ovulationDay: "Ovulation Day",
			calendar: "Fertility Calendar",
			legendPeriod: "Menstruation",
			legendFertile: "Fertile Window",
			legendOvulation: "Ovulation Day",
			privacyNotice:
				"Privacy first: All health data is saved locally on your device and never uploaded to any servers.",
			forecastTitle: "Next 3 Cycles Forecast",
			mon: "Mo",
			tue: "Tu",
			wed: "We",
			thu: "Th",
			fri: "Fr",
			sat: "Sa",
			sun: "Su",
			daysWarn: "Invalid range. Cycle should be 20-45 days, period 3-10 days.",
		},
		vi: {
			settings: "Cài đặt theo dõi",
			lastPeriodDate: "Ngày bắt đầu kỳ kinh gần nhất",
			cycleLength: "Độ dài chu kỳ trung bình",
			periodLength: "Số ngày hành kinh",
			days: "ngày",
			save: "Lưu & Dự báo",
			predictions: "Kết quả dự báo",
			nextPeriod: "Kỳ kinh tiếp theo bắt đầu",
			fertileWindow: "Cơ hội thụ thai cao (Giai đoạn dễ thụ thai)",
			ovulationDay: "Ngày rụng trứng",
			calendar: "Lịch theo dõi sức khỏe",
			legendPeriod: "Ngày hành kinh",
			legendFertile: "Giai đoạn dễ thụ thai",
			legendOvulation: "Ngày rụng trứng",
			privacyNotice:
				"Bảo mật tuyệt đối: Mọi dữ liệu sức khỏe được lưu trữ offline trên trình duyệt của bạn, 0KB gửi lên máy chủ.",
			forecastTitle: "Dự báo 3 chu kỳ kế tiếp",
			mon: "T2",
			tue: "T3",
			wed: "T4",
			thu: "T5",
			fri: "T6",
			sat: "T7",
			sun: "CN",
			daysWarn: "Phạm vi không hợp lệ. Chu kỳ nên từ 20-45 ngày, số ngày hành kinh từ 3-10 ngày.",
		},
	}[lang];

	// Load saved data
	useEffect(() => {
		const savedLang = localStorage.getItem("toolbundle_lang");
		if (savedLang === "vi" || savedLang === "en") {
			setLang(savedLang as "vi" | "en");
		}

		const savedData = localStorage.getItem("toolbundle_period_tracker");
		if (savedData) {
			try {
				const parsed = JSON.parse(savedData) as SavedTrackerData;
				if (parsed.lastPeriodDate) setLastPeriodDate(parsed.lastPeriodDate);
				if (parsed.cycleLength) setCycleLength(parsed.cycleLength);
				if (parsed.periodLength) setPeriodLength(parsed.periodLength);
			} catch (e) {
				console.error("Error loading tracker data", e);
			}
		}
	}, []);

	// Save to localStorage
	const handleSave = () => {
		const data: SavedTrackerData = {
			lastPeriodDate,
			cycleLength,
			periodLength,
		};
		localStorage.setItem("toolbundle_period_tracker", JSON.stringify(data));
	};

	// Perform calculations for next 3 cycles
	const cyclesForecast = [];
	const baseDate = new Date(lastPeriodDate);

	// Validate inputs
	const isValid = cycleLength >= 20 && cycleLength <= 45 && periodLength >= 3 && periodLength <= 10;

	if (isValid && lastPeriodDate) {
		for (let i = 0; i < 3; i++) {
			const cycleStart = new Date(baseDate.getTime() + i * cycleLength * 24 * 60 * 60 * 1000);
			const cycleEnd = new Date(cycleStart.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000);

			// Ovulation is roughly 14 days before the next cycle starts
			const nextCycleStart = new Date(cycleStart.getTime() + cycleLength * 24 * 60 * 60 * 1000);
			const ovulationDate = new Date(nextCycleStart.getTime() - 14 * 24 * 60 * 60 * 1000);

			// Fertile window is 5 days before ovulation + 1 day after ovulation
			const fertileStart = new Date(ovulationDate.getTime() - 5 * 24 * 60 * 60 * 1000);
			const fertileEnd = new Date(ovulationDate.getTime() + 1 * 24 * 60 * 60 * 1000);

			cyclesForecast.push({
				periodStart: cycleStart,
				periodEnd: cycleEnd,
				ovulation: ovulationDate,
				fertileStart,
				fertileEnd,
			});
		}
	}

	// Helper to determine day status (Period, Fertile, Ovulation, Normal)
	const getDayStatus = (date: Date) => {
		const time = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

		for (const cycle of cyclesForecast) {
			const start = new Date(
				cycle.periodStart.getFullYear(),
				cycle.periodStart.getMonth(),
				cycle.periodStart.getDate(),
			).getTime();
			const end = new Date(
				cycle.periodEnd.getFullYear(),
				cycle.periodEnd.getMonth(),
				cycle.periodEnd.getDate(),
			).getTime();

			if (time >= start && time <= end) {
				return "period";
			}

			const ovulation = new Date(
				cycle.ovulation.getFullYear(),
				cycle.ovulation.getMonth(),
				cycle.ovulation.getDate(),
			).getTime();
			if (time === ovulation) {
				return "ovulation";
			}

			const fertileStart = new Date(
				cycle.fertileStart.getFullYear(),
				cycle.fertileStart.getMonth(),
				cycle.fertileStart.getDate(),
			).getTime();
			const fertileEnd = new Date(
				cycle.fertileEnd.getFullYear(),
				cycle.fertileEnd.getMonth(),
				cycle.fertileEnd.getDate(),
			).getTime();
			if (time >= fertileStart && time <= fertileEnd) {
				return "fertile";
			}
		}

		return "normal";
	};

	// Generate grid calendar for current month and next month
	const renderCalendarGrid = (year: number, month: number) => {
		const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
		// Adjust firstDayIndex to make Monday index 0
		const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

		const daysInMonth = new Date(year, month + 1, 0).getDate();

		const days = [];
		// Padding days
		for (let i = 0; i < adjustedFirstDay; i++) {
			days.push(null);
		}
		// Calendar days
		for (let i = 1; i <= daysInMonth; i++) {
			days.push(new Date(year, month, i));
		}

		return days;
	};

	const now = new Date();
	const currentMonthDays = renderCalendarGrid(now.getFullYear(), now.getMonth());
	const nextMonthDays = renderCalendarGrid(now.getFullYear(), now.getMonth() + 1);

	const monthNames = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];
	const monthNamesVi = [
		"Tháng 1",
		"Tháng 2",
		"Tháng 3",
		"Tháng 4",
		"Tháng 5",
		"Tháng 6",
		"Tháng 7",
		"Tháng 8",
		"Tháng 9",
		"Tháng 10",
		"Tháng 11",
		"Tháng 12",
	];

	const formatDate = (date: Date) => {
		return date.toLocaleDateString(lang === "vi" ? "vi-VN" : "en-US", {
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	return (
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
			{/* Setup Panel Column */}
			<div class="lg:col-span-4 space-y-6">
				<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-5">
					<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="18"
							height="18"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2.5"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="12" cy="12" r="10" />
							<path d="M12 8v8" />
							<path d="M8 12h8" />
						</svg>
						{t.settings}
					</h3>

					<div>
						<label class="text-caption-uppercase text-muted block mb-2">{t.lastPeriodDate}</label>
						<input
							type="date"
							class="input w-full"
							value={lastPeriodDate}
							onInput={(e) => {
								setLastPeriodDate((e.target as HTMLInputElement).value);
								handleSave();
							}}
						/>
					</div>

					<div>
						<label class="text-caption-uppercase text-muted block mb-2">
							{t.cycleLength} ({cycleLength} {t.days})
						</label>
						<input
							type="range"
							min="20"
							max="45"
							class="w-full accent-primary"
							value={cycleLength}
							onInput={(e) => {
								setCycleLength(Number.parseInt((e.target as HTMLInputElement).value));
								handleSave();
							}}
						/>
					</div>

					<div>
						<label class="text-caption-uppercase text-muted block mb-2">
							{t.periodLength} ({periodLength} {t.days})
						</label>
						<input
							type="range"
							min="3"
							max="10"
							class="w-full accent-primary"
							value={periodLength}
							onInput={(e) => {
								setPeriodLength(Number.parseInt((e.target as HTMLInputElement).value));
								handleSave();
							}}
						/>
					</div>

					{!isValid && <p class="text-caption text-error">{t.daysWarn}</p>}

					<button class="btn-primary w-full py-2.5" onClick={handleSave} disabled={!isValid}>
						{t.save}
					</button>
				</div>

				{/* Privacy notice info */}
				<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm flex gap-3 text-caption text-muted">
					<svg
						class="text-primary flex-shrink-0"
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2.5"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
						<path d="M7 11V7a5 5 0 0 1 10 0v4" />
					</svg>
					<p>{t.privacyNotice}</p>
				</div>
			</div>

			{/* Calendar and Forecast Column */}
			<div class="lg:col-span-8 space-y-6">
				{isValid && cyclesForecast.length > 0 ? (
					<div class="space-y-6">
						{/* Predictions summary */}
						<div class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4">
							<h3 class="text-body-strong text-ink border-b border-hairline pb-2 mb-2 flex items-center gap-2">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="18"
									height="18"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
									<path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
								</svg>
								{t.forecastTitle}
							</h3>

							<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
								{cyclesForecast.map((cycle, idx) => (
									<div
										key={idx}
										class="p-4 bg-surface-soft rounded-lg border border-hairline space-y-3"
									>
										<div class="text-caption-uppercase text-muted font-bold">Cycle #{idx + 1}</div>

										<div>
											<div class="text-caption text-muted">{t.nextPeriod}</div>
											<div class="text-body-sm-strong text-error">
												{formatDate(cycle.periodStart)}
											</div>
										</div>

										<div>
											<div class="text-caption text-muted">{t.ovulationDay}</div>
											<div class="text-body-sm-strong text-accent-purple-deep">
												{formatDate(cycle.ovulation)}
											</div>
										</div>

										<div>
											<div class="text-caption text-muted">{t.fertileWindow}</div>
											<div class="text-caption font-semibold text-success-deep">
												{formatDate(cycle.fertileStart)} - {formatDate(cycle.fertileEnd)}
											</div>
										</div>
									</div>
								))}
							</div>
						</div>

						{/* Legend */}
						<div class="bg-surface-elevated rounded-lg p-4 border border-hairline shadow-sm flex flex-wrap gap-4 justify-center text-caption font-bold">
							<div class="flex items-center gap-2">
								<span class="w-4 h-4 rounded-full bg-error/20 border border-error" />
								<span>{t.legendPeriod}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="w-4 h-4 rounded-full bg-success-pale border border-success-deep/30" />
								<span>{t.legendFertile}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="w-4 h-4 rounded-full bg-accent-purple/20 border border-accent-purple" />
								<span>{t.legendOvulation}</span>
							</div>
						</div>

						{/* Calendars grids */}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
							{[now, new Date(now.getFullYear(), now.getMonth() + 1, 1)].map(
								(targetMonth, mIdx) => {
									const days = mIdx === 0 ? currentMonthDays : nextMonthDays;
									const monthLabel =
										lang === "vi"
											? monthNamesVi[targetMonth.getMonth()]
											: `${monthNames[targetMonth.getMonth()]} ${targetMonth.getFullYear()}`;

									return (
										<div
											key={mIdx}
											class="bg-surface-elevated rounded-lg p-5 border border-hairline shadow-sm space-y-4"
										>
											<h4 class="text-body-strong text-ink text-center font-bold">{monthLabel}</h4>

											<div class="grid grid-cols-7 gap-1 text-center text-xs font-bold border-b border-hairline pb-2 mb-2">
												<span>{t.mon}</span>
												<span>{t.tue}</span>
												<span>{t.wed}</span>
												<span>{t.thu}</span>
												<span>{t.fri}</span>
												<span>{t.sat}</span>
												<span class="text-error">{t.sun}</span>
											</div>

											<div class="grid grid-cols-7 gap-1">
												{days.map((day, idx) => {
													if (!day) return <span key={idx} />;

													const status = getDayStatus(day);
													let bgClass = "bg-surface-soft hover:bg-hairline text-ink";

													if (status === "period") {
														bgClass = "bg-error/20 border border-error text-error font-bold";
													} else if (status === "ovulation") {
														bgClass =
															"bg-accent-purple/20 border border-accent-purple text-accent-purple-deep font-bold";
													} else if (status === "fertile") {
														bgClass =
															"bg-success-pale border border-success-deep/20 text-success-deep font-bold";
													}

													const isToday = day.toDateString() === now.toDateString();
													const todayRing = isToday ? "ring-2 ring-primary ring-offset-2" : "";

													return (
														<span
															key={idx}
															class={`aspect-square flex items-center justify-center rounded-lg text-caption font-mono ${bgClass} ${todayRing}`}
															title={formatDate(day)}
														>
															{day.getDate()}
														</span>
													);
												})}
											</div>
										</div>
									);
								},
							)}
						</div>
					</div>
				) : (
					<div class="bg-surface-elevated rounded-lg p-8 border border-hairline shadow-sm text-center">
						<p class="text-muted">
							Enter valid cycle configurations to generate your fertility calendar and cycle
							predictions.
						</p>
					</div>
				)}
			</div>
		</div>
	);
}
