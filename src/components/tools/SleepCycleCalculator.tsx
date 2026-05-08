import { useEffect, useMemo, useState } from "preact/hooks";

type Mode = "wakeUp" | "goToBed";

interface SleepOption {
	time: string;
	cycles: number;
	duration: string;
	quality: "best" | "good" | "minimum";
}

const SLEEP_CYCLE_MINUTES = 90;
const FALL_ASLEEP_MINUTES = 14;

const SLEEP_TIPS = [
	"Maintain a consistent sleep schedule, even on weekends.",
	"Avoid screens (blue light) at least 30 minutes before bed.",
	"Keep your bedroom cool, dark, and quiet.",
	"Avoid caffeine at least 6 hours before bedtime.",
	"Exercise regularly, but not too close to bedtime.",
	"Avoid heavy meals within 2–3 hours of bedtime.",
	"Try relaxation techniques like deep breathing or meditation.",
	"Limit naps to 20–30 minutes earlier in the day.",
];

function formatTime(hours: number, minutes: number): string {
	const h = hours % 24;
	const m = minutes % 60;
	const period = h >= 12 ? "PM" : "AM";
	const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
	return `${displayH}:${m.toString().padStart(2, "0")} ${period}`;
}

function calculateSleepOptions(
	targetHour: number,
	targetMinute: number,
	mode: Mode,
): SleepOption[] {
	const options: SleepOption[] = [];
	const cycles = mode === "wakeUp" ? [6, 5, 4] : [6, 5, 4];

	for (const cycleCount of cycles) {
		const sleepMinutes = cycleCount * SLEEP_CYCLE_MINUTES;

		let totalMinutes: number;
		if (mode === "wakeUp") {
			// Calculate bedtime: subtract sleep duration + fall asleep time from wake time
			totalMinutes =
				(((targetHour * 60 + targetMinute - sleepMinutes - FALL_ASLEEP_MINUTES) % 1440) + 1440) %
				1440;
		} else {
			// Calculate wake time: add sleep duration + fall asleep time to bedtime
			totalMinutes = (targetHour * 60 + targetMinute + sleepMinutes + FALL_ASLEEP_MINUTES) % 1440;
		}

		const hours = Math.floor(totalMinutes / 60);
		const minutes = totalMinutes % 60;

		const durationHours = Math.floor(sleepMinutes / 60);
		const durationMinutes = sleepMinutes % 60;
		const durationStr =
			durationMinutes === 0 ? `${durationHours}h` : `${durationHours}h ${durationMinutes}m`;

		let quality: SleepOption["quality"];
		if (cycleCount === 6) quality = "best";
		else if (cycleCount === 5) quality = "good";
		else quality = "minimum";

		options.push({
			time: formatTime(hours, minutes),
			cycles: cycleCount,
			duration: durationStr,
			quality,
		});
	}

	return options;
}

export default function SleepCycleCalculator() {
	const [mode, setMode] = useState<Mode>("wakeUp");
	const [hour, setHour] = useState("7");
	const [minute, setMinute] = useState("0");
	const [ampm, setAmpm] = useState<"AM" | "PM">("AM");
	const [currentTime, setCurrentTime] = useState(new Date());

	// Update current time every minute
	useEffect(() => {
		const interval = setInterval(() => {
			setCurrentTime(new Date());
		}, 60000);
		return () => clearInterval(interval);
	}, []);

	const targetHour24 = useMemo(() => {
		const h = Number.parseInt(hour) || 0;
		if (ampm === "AM") return h === 12 ? 0 : h;
		return h === 12 ? 12 : h + 12;
	}, [hour, ampm]);

	const targetMinuteNum = useMemo(() => {
		return Number.parseInt(minute) || 0;
	}, [minute]);

	const options = useMemo(
		() => calculateSleepOptions(targetHour24, targetMinuteNum, mode),
		[targetHour24, targetMinuteNum, mode],
	);

	const getQualityColor = (quality: SleepOption["quality"]): string => {
		switch (quality) {
			case "best":
				return "text-accent-emerald";
			case "good":
				return "text-warning";
			case "minimum":
				return "text-accent-orange";
		}
	};

	const getQualityBg = (quality: SleepOption["quality"]): string => {
		switch (quality) {
			case "best":
				return "border-accent-emerald";
			case "good":
				return "border-warning";
			case "minimum":
				return "border-accent-orange";
		}
	};

	const getQualityLabel = (quality: SleepOption["quality"]): string => {
		switch (quality) {
			case "best":
				return "Best";
			case "good":
				return "Good";
			case "minimum":
				return "Minimum";
		}
	};

	return (
		<div class="space-y-6">
			{/* Current time */}
			<div class="bg-surface-elevated rounded-lg p-4 text-center">
				<div class="text-caption-uppercase text-muted mb-1">Current Time</div>
				<div class="text-title-lg text-primary">
					{currentTime.toLocaleTimeString("en-US", {
						hour: "numeric",
						minute: "2-digit",
						hour12: true,
					})}
				</div>
			</div>

			{/* Mode Toggle */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<div class="flex rounded-md overflow-hidden border border-hairline mb-6">
					<button
						class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
							mode === "wakeUp"
								? "bg-primary text-on-primary"
								: "bg-surface-elevated text-body hover:text-on-dark"
						}`}
						onClick={() => setMode("wakeUp")}
					>
						I want to wake up at...
					</button>
					<button
						class={`flex-1 px-3 py-2 text-body-sm font-medium transition-colors ${
							mode === "goToBed"
								? "bg-primary text-on-primary"
								: "bg-surface-elevated text-body hover:text-on-dark"
						}`}
						onClick={() => setMode("goToBed")}
					>
						I want to go to bed at...
					</button>
				</div>

				{/* Time Input */}
				<div class="flex items-center gap-2 justify-center">
					<select
						class="input w-20 text-center"
						value={hour}
						onChange={(e) => setHour((e.target as HTMLSelectElement).value)}
					>
						{Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
							<option key={h} value={h.toString()}>
								{h}
							</option>
						))}
					</select>
					<span class="text-title-lg text-muted">:</span>
					<select
						class="input w-20 text-center"
						value={minute}
						onChange={(e) => setMinute((e.target as HTMLSelectElement).value)}
					>
						{["00", "15", "30", "45"].map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
					<div class="flex rounded-md overflow-hidden border border-hairline">
						<button
							class={`px-3 py-2 text-body-sm font-medium transition-colors ${
								ampm === "AM"
									? "bg-primary text-on-primary"
									: "bg-surface-elevated text-body hover:text-on-dark"
							}`}
							onClick={() => setAmpm("AM")}
						>
							AM
						</button>
						<button
							class={`px-3 py-2 text-body-sm font-medium transition-colors ${
								ampm === "PM"
									? "bg-primary text-on-primary"
									: "bg-surface-elevated text-body hover:text-on-dark"
							}`}
							onClick={() => setAmpm("PM")}
						>
							PM
						</button>
					</div>
				</div>
			</div>

			{/* Results */}
			<div class="space-y-3">
				<h3 class="text-title-sm text-body-strong">
					{mode === "wakeUp" ? "You should go to bed at:" : "You should wake up at:"}
				</h3>
				{options.map((opt) => (
					<div
						key={opt.cycles}
						class={`bg-surface-elevated rounded-lg p-4 border-l-4 ${getQualityBg(opt.quality)}`}
					>
						<div class="flex items-center justify-between">
							<div>
								<div class="flex items-center gap-3">
									<span class="text-title-lg text-primary">{opt.time}</span>
									<span class={`badge ${opt.quality === "best" ? "badge-yellow" : ""}`}>
										{getQualityLabel(opt.quality)}
									</span>
								</div>
								<div class="flex items-center gap-4 mt-1">
									<span class="text-caption text-muted">
										{opt.cycles} sleep cycles ({opt.duration})
									</span>
								</div>
							</div>
							<div class="text-right">
								<div class={`text-body-sm font-medium ${getQualityColor(opt.quality)}`}>
									{opt.quality === "best"
										? "⭐ Recommended"
										: opt.quality === "good"
											? "✓ Good option"
											: "Minimum sleep"}
								</div>
							</div>
						</div>
					</div>
				))}
			</div>

			{/* Sleep cycle info */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-3">About Sleep Cycles</h3>
				<div class="space-y-3 text-body-sm text-muted">
					<p>
						Each sleep cycle lasts approximately <strong class="text-primary">90 minutes</strong>,
						and a good night's sleep consists of 4–6 complete cycles.
					</p>
					<p>
						It takes the average person about <strong class="text-primary">14 minutes</strong> to
						fall asleep. These calculations account for that.
					</p>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
						<div class="p-3 rounded-lg bg-surface-soft text-center">
							<div class="text-accent-emerald">6 cycles</div>
							<div class="text-caption text-muted">9 hours — Best</div>
						</div>
						<div class="p-3 rounded-lg bg-surface-soft text-center">
							<div class="text-warning">5 cycles</div>
							<div class="text-caption text-muted">7.5 hours — Good</div>
						</div>
						<div class="p-3 rounded-lg bg-surface-soft text-center">
							<div class="text-accent-orange">4 cycles</div>
							<div class="text-caption text-muted">6 hours — Minimum</div>
						</div>
					</div>
				</div>
			</div>

			{/* Sleep Hygiene Tips */}
			<div class="bg-surface-elevated rounded-lg p-6">
				<h3 class="text-title-sm text-body-strong mb-3">Sleep Hygiene Tips</h3>
				<div class="space-y-2">
					{SLEEP_TIPS.map((tip, i) => (
						<div key={i} class="flex items-start gap-3 p-2 rounded-lg">
							<span class="text-accent-blue mt-0.5">🌙</span>
							<span class="text-body-sm text-muted">{tip}</span>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
