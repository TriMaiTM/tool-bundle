import { useState, useMemo } from "preact/hooks";

export default function HexToDecimal() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const clean = input.trim().replace(/^0x/i, "").replace(/\s/g, "");
		if (!/^[0-9a-fA-F]+$/.test(clean)) return "Invalid hex (0-9, A-F)";
		return Number.parseInt(clean, 16).toString();
	}, [input]);

	const handleCopy = async () => {
		if (result && !result.startsWith("Invalid")) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">Hex Input</label>
				<textarea
					class="textarea"
					placeholder="Enter hex (e.g. FF, 1A2B)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					style="font-family: var(--font-mono)"
				/>
			</div>
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">Decimal Output</label>
					{result && !result.startsWith("Invalid") && (
						<button
							class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
							onClick={handleCopy}
						>
							Copy
						</button>
					)}
				</div>
				<textarea class="textarea" value={result} readOnly placeholder="Decimal result..." />
			</div>
		</div>
	);
}
