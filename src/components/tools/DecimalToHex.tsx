import { useState, useMemo } from "preact/hooks";

export default function DecimalToHex() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const num = Number.parseInt(input.trim(), 10);
		if (isNaN(num) || num < 0) return "Invalid positive integer";
		return num.toString(16).toUpperCase();
	}, [input]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Decimal Input</label>
				<input
					class="input"
					type="number"
					min="0"
					placeholder="Enter decimal (e.g. 255)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
				/>
			</div>
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Hex Output</label>
					{result && !result.startsWith("Invalid") && (
						<button
							class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
							onClick={handleCopy}
						>
							Copy
						</button>
					)}
				</div>
				<textarea
					class="textarea"
					value={result}
					readOnly
					placeholder="Hex result (e.g. FF)..."
					style="font-family: var(--font-mono)"
				/>
			</div>
		</div>
	);
}
