import { useMemo, useState } from "preact/hooks";

function diffDates(start: Date, end: Date) {
	const msDiff = end.getTime() - start.getTime();
	const absMs = Math.abs(msDiff);
	const direction = msDiff >= 0 ? 1 : -1;

	// Years, months, days breakdown
	let years = end.getFullYear() - start.getFullYear();
	let months = end.getMonth() - start.getMonth();
	let days = end.getDate() - start.getDate();

	if (days < 0) {
		months--;
		const prevMonth = new Date(end.getFullYear(), end.getMonth(), 0);
		days += prevMonth.getDate();
	}
	if (months < 0) {
		years--;
		months += 12;
	}

	const totalDays = Math.floor(absMs / (1000 * 60 * 60 * 24));
	const totalHours = Math.floor(absMs / (1000 * 60 * 60));
	const totalMinutes = Math.floor(absMs / (1000 * 60));
	const totalSeconds = Math.floor(absMs / 1000);
	const totalWeeks = Math.floor(totalDays / 7);
	const totalMonths = years * 12 + months;

	return {
		years: Math.abs(years),
		months: Math.abs(months),
		days: Math.abs(days),
		totalMonths,
		totalWeeks,
		totalDays,
		totalHours,
		totalMinutes,
		totalSeconds,
		direction,
	};
}

function isLeapYear(year: number): boolean {
	return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function formatNumber(n: number): string {
	return n.toLocaleString();
}

export default function DateDifferenceCalculator() {
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const result = useMemo(() => {
		if (!startDate || !endDate) return null;
		const start = new Date(`${startDate}T00:00:00`);
		const end = new Date(`${endDate}T00:00:00`);
		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
		return diffDates(start, end);
	}, [startDate, endDate]);

	const startDayOfWeek = useMemo(() => {
		if (!startDate) return null;
		return new Date(`${startDate}T00:00:00`).toLocaleDateString("en-US", {
			weekday: "long",
		});
	}, [startDate]);

	const endDayOfWeek = useMemo(() => {
		if (!endDate) return null;
		return new Date(`${endDate}T00:00:00`).toLocaleDateString("en-US", {
			weekday: "long",
		});
	}, [endDate]);

	const startLeap = useMemo(() => {
		if (!startDate) return null;
		return isLeapYear(new Date(`${startDate}T00:00:00`).getFullYear());
	}, [startDate]);

	const endLeap = useMemo(() => {
		if (!endDate) return null;
		return isLeapYear(new Date(`${endDate}T00:00:00`).getFullYear());
	}, [endDate]);

	const today = new Date().toISOString().split("T")[0];

	return (
		<div class="space-y-6">
			{/* Inputs */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">Start Date</label>
						<input
							type="date"
							class="input w-full"
							value={startDate}
							onInput={(e) => setStartDate((e.target as HTMLInputElement).value)}
						/>
						{startDate && (
							<div class="text-caption text-primary mt-1">
								{startDayOfWeek} · {startLeap ? "Leap year" : "Not a leap year"}
							</div>
						)}
					</div>
					<div>
						<label class="text-caption-uppercase text-muted block mb-2">End Date</label>
						<input
							type="date"
							class="input w-full"
							value={endDate}
							onInput={(e) => setEndDate((e.target as HTMLInputElement).value)}
						/>
						{endDate && (
							<div class="text-caption text-primary mt-1">
								{endDayOfWeek} · {endLeap ? "Leap year" : "Not a leap year"}
							</div>
						)}
					</div>
				</div>

				{/* Quick presets */}
				<div class="flex flex-wrap gap-2">
					<button class="btn-secondary text-sm" onClick={() => setStartDate(today)}>
						From Now (start = today)
					</button>
					<button
						class="btn-secondary text-sm"
						onClick={() => {
							setEndDate(today);
						}}
					>
						To Today (end = today)
					</button>
					<button
						class="btn-secondary text-sm"
						onClick={() => {
							setStartDate("1990-01-01");
							setEndDate(today);
						}}
					>
						Birthday Example
					</button>
				</div>
			</div>

			{/* Results */}
			{result && (
				<div class="space-y-4">
					{/* Main display */}
					<div class="bg-surface-elevated rounded-lg p-6 text-center">
						<div class="text-caption-uppercase text-muted mb-2">Difference</div>
						<div class="text-title-lg text-primary" style="font-size: 32px; letter-spacing: -1px">
							{result.years} <span class="text-body text-muted">years</span> {result.months}{" "}
							<span class="text-body text-muted">months</span> {result.days}{" "}
							<span class="text-body text-muted">days</span>
						</div>
						<div class="text-body-sm text-muted mt-2">
							{result.direction >= 0
								? "Start date is before end date"
								: "Start date is after end date"}
						</div>
					</div>

					{/* Stat boxes */}
					<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalMonths)}</div>
							<div class="text-caption text-muted mt-1">Total Months</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalWeeks)}</div>
							<div class="text-caption text-muted mt-1">Total Weeks</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalDays)}</div>
							<div class="text-caption text-muted mt-1">Total Days</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalHours)}</div>
							<div class="text-caption text-muted mt-1">Total Hours</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalMinutes)}</div>
							<div class="text-caption text-muted mt-1">Total Minutes</div>
						</div>
						<div class="bg-surface-elevated rounded-lg p-3 text-center">
							<div class="text-title-lg text-primary">{formatNumber(result.totalSeconds)}</div>
							<div class="text-caption text-muted mt-1">Total Seconds</div>
						</div>
					</div>
				</div>
			)}

			{!startDate && !endDate && (
				<div class="text-center py-8">
					<p class="text-muted">Select two dates to calculate the difference between them.</p>
				</div>
			)}
		</div>
	);
}
