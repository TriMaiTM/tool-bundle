import { useState, useMemo } from "preact/hooks";

export default function SecondsToTime() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return null;
		const totalSeconds = Number.parseFloat(input.trim().replace(/,/g, ""));
		if (isNaN(totalSeconds) || totalSeconds < 0) return null;

		const days = Math.floor(totalSeconds / 86400);
		const hours = Math.floor((totalSeconds % 86400) / 3600);
		const minutes = Math.floor((totalSeconds % 3600) / 60);
		const seconds = Math.floor(totalSeconds % 60);
		const milliseconds = Math.round((totalSeconds % 1) * 1000);

		const hhmmss = [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
		const fullFormat = days > 0 ? `${days}d ${hhmmss}` : hhmmss;

		return {
			full: fullFormat,
			hhmmss,
			days,
			hours,
			minutes,
			seconds,
			milliseconds,
			totalSeconds: totalSeconds,
			totalMinutes: totalSeconds / 60,
			totalHours: totalSeconds / 3600,
			totalDays: totalSeconds / 86400,
		};
	}, [input]);

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Seconds Input</label>
				<input
					class="input"
					style="font-size: 24px; text-align: center; font-family: var(--font-mono)"
					type="text"
					placeholder="Enter seconds (e.g. 3661)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
				/>
			</div>
			{result ? (
				<div>
					<div class="bg-surface-card rounded-lg p-6 text-center mb-4">
						<div class="text-display-lg text-primary" style="font-family: var(--font-mono)">
							{result.full}
						</div>
					</div>
					<div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
						{[
							{ label: "Days", value: result.days },
							{ label: "Hours", value: result.hours },
							{ label: "Minutes", value: result.minutes },
							{ label: "Seconds", value: result.seconds },
						].map((item) => (
							<div class="bg-surface-card rounded-lg p-4 text-center">
								<div class="text-title-lg text-primary">{item.value}</div>
								<div class="text-caption text-muted mt-1">{item.label}</div>
							</div>
						))}
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
						{[
							{ label: "HH:MM:SS", value: result.hhmmss },
							{ label: "Total Minutes", value: result.totalMinutes.toFixed(2) },
							{ label: "Total Hours", value: result.totalHours.toFixed(4) },
							{ label: "Total Days", value: result.totalDays.toFixed(6) },
						].map((item) => (
							<div class="bg-surface-card rounded-lg p-3 flex items-center justify-between">
								<div>
									<div class="text-caption text-muted">{item.label}</div>
									<code class="text-body-sm" style="font-family: var(--font-mono)">
										{item.value}
									</code>
								</div>
								<button
									class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
									onClick={() => handleCopy(String(item.value))}
								>
									Copy
								</button>
							</div>
						))}
					</div>
				</div>
			) : (
				<div class="text-body-sm text-muted text-center py-8">
					Enter seconds above to see the conversion
				</div>
			)}
		</div>
	);
}
