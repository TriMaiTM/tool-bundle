import { useState, useMemo } from "preact/hooks";

function parseTimeToSeconds(input: string): number | null {
	const clean = input.trim();

	// Try HH:MM:SS or MM:SS format
	const timeMatch = clean.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?(?:\.(\d+))?$/);
	if (timeMatch) {
		const parts = [
			Number.parseInt(timeMatch[1]),
			Number.parseInt(timeMatch[2]),
			Number.parseInt(timeMatch[3] || "0"),
		];
		const ms = timeMatch[4] ? Number.parseFloat(`0.${timeMatch[4]}`) : 0;
		return parts[0] * 3600 + parts[1] * 60 + parts[2] + ms;
	}

	// Try "Xh Ym Zs" format
	const hmsMatch = clean.match(/(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i);
	if (hmsMatch && (hmsMatch[1] || hmsMatch[2] || hmsMatch[3])) {
		return (
			Number.parseInt(hmsMatch[1] || "0") * 3600 +
			Number.parseInt(hmsMatch[2] || "0") * 60 +
			Number.parseInt(hmsMatch[3] || "0")
		);
	}

	// Try plain number (already seconds)
	const num = Number.parseFloat(clean);
	if (!isNaN(num)) return num;

	return null;
}

export default function TimeToSeconds() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return null;
		return parseTimeToSeconds(input);
	}, [input]);

	const handleCopy = async (text: string) => {
		await navigator.clipboard.writeText(text);
	};

	const examples = ["1:30:00", "00:05:30", "2h 30m 15s", "90:00", "3600"];

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Time Input</label>
				<input
					class="input"
					style="font-size: 24px; text-align: center; font-family: var(--font-mono)"
					placeholder="e.g. 1:30:00, 2h 30m 15s, 3600"
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
				/>
			</div>
			<div class="flex flex-wrap gap-2 mb-4">
				{examples.map((ex) => (
					<button
						class="btn-secondary"
						style="padding: 4px 10px; font-size: 12px;"
						onClick={() => setInput(ex)}
					>
						{ex}
					</button>
				))}
			</div>
			{result !== null ? (
				<div>
					<div class="bg-surface-card rounded-lg p-6 text-center mb-4">
						<div class="text-display-lg text-primary" style="font-family: var(--font-mono)">
							{result}
						</div>
						<div class="text-caption text-muted mt-1">total seconds</div>
					</div>
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						{[
							{ label: "Seconds", value: result.toFixed(0) },
							{ label: "Minutes", value: (result / 60).toFixed(4) },
							{ label: "Hours", value: (result / 3600).toFixed(6) },
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
									onClick={() => handleCopy(item.value)}
								>
									Copy
								</button>
							</div>
						))}
					</div>
				</div>
			) : (
				<div class="text-body-sm text-muted text-center py-8">
					Enter a time value above to convert to seconds
				</div>
			)}
		</div>
	);
}
