import { useState, useMemo } from "preact/hooks";

export default function DecimalToBinary() {
	const [input, setInput] = useState("");
	const [bits, setBits] = useState(8);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const num = Number.parseInt(input.trim(), 10);
		if (isNaN(num) || num < 0) return "Invalid positive integer";
		const bin = num.toString(2);
		return bits > 0 ? bin.padStart(bits, "0") : bin;
	}, [input, bits]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Decimal Input</label>
					<input
						class="input"
						type="number"
						min="0"
						placeholder="Enter decimal (e.g. 180)..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					/>
				</div>
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Bit Width (0 = auto)</label>
					<select
						class="input"
						value={bits}
						onChange={(e) => setBits(Number((e.target as HTMLSelectElement).value))}
					>
						<option value="0">Auto</option>
						<option value="4">4 bits</option>
						<option value="8">8 bits</option>
						<option value="16">16 bits</option>
						<option value="32">32 bits</option>
					</select>
				</div>
			</div>
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Binary Output</label>
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
					placeholder="Binary result..."
					style="font-family: var(--font-mono)"
				/>
			</div>
		</div>
	);
}
