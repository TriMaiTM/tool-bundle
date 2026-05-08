import { useState, useMemo } from "preact/hooks";

export default function BinaryToDecimal() {
	const [input, setInput] = useState("");

	const result = useMemo(() => {
		if (!input.trim()) return "";
		const clean = input.trim().replace(/\s/g, "");
		if (!/^[01]+$/.test(clean)) return "Invalid binary (only 0 and 1)";
		return Number.parseInt(clean, 2).toString();
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
					placeholder="Enter binary (e.g. 10110100)..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
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
