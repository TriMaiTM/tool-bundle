import { useState, useMemo } from "preact/hooks";

export default function BinaryToHex() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const clean = input.trim().replace(/\s/g, "");
		if (!/^[01]+$/.test(clean)) return "Invalid binary (only 0 and 1)";
		const decimal = Number.parseInt(clean, 2);
		return `0x${decimal.toString(16).toUpperCase()}`;
	}, [input]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Binary Input</label>
				<textarea
					class="textarea"
					style="min-height: 120px; font-family: var(--font-mono)"
					placeholder="Enter binary (e.g. 11111111 10101010)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
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
					style="min-height: 80px; font-family: var(--font-mono)"
					value={result}
					readOnly
					placeholder="Hex result..."
				/>
			</div>
		</div>
	);
}
