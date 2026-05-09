import { useState, useMemo } from "preact/hooks";

export default function HexToBinary() {
	const [input, setInput] = useState("");
	const [bits, setBits] = useState(0);

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const clean = input.trim().replace(/^0x/i, "").replace(/\s/g, "");
		if (!/^[0-9a-fA-F]+$/.test(clean)) return "Invalid hex (0-9, A-F)";
		const decimal = Number.parseInt(clean, 16);
		const bin = decimal.toString(2);
		return bits > 0 ? bin.padStart(bits, "0") : bin;
	}, [input, bits]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Hex Input</label>
					<input
						class="input"
						style="font-family: var(--font-mono)"
						placeholder="FF, 1A2B, 0x4F"
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
					style="min-height: 120px; font-family: var(--font-mono)"
					value={result}
					readOnly
					placeholder="Binary result..."
				/>
			</div>
		</div>
	);
}
