import { useState, useMemo } from "preact/hooks";

function rotN(text: string, shift: number): string {
	return Array.from(text)
		.map((char) => {
			const code = char.codePointAt(0)!;
			if (code >= 65 && code <= 90)
				return String.fromCodePoint(((((code - 65 + shift) % 26) + 26) % 26) + 65);
			if (code >= 97 && code <= 122)
				return String.fromCodePoint(((((code - 97 + shift) % 26) + 26) % 26) + 97);
			return char;
		})
		.join("");
}

export default function Rot13Encoder() {
	const [input, setInput] = useState("");
	const [shift, setShift] = useState(13);

	const result = useMemo(() => {
		if (!input) return "";
		return rotN(input, shift);
	}, [input, shift]);

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result) {
			setInput(result);
		}
	};

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-1">Shift (1-25)</label>
					<input
						class="input"
						style="width: 80px"
						type="number"
						min="1"
						max="25"
						value={shift}
						onInput={(e) => setShift(Number((e.target as HTMLInputElement).value) || 13)}
					/>
				</div>
				<div class="flex gap-2">
					{[1, 3, 5, 7, 13, 25].map((n) => (
						<button
							class={shift === n ? "btn-primary" : "btn-secondary"}
							style="padding: 6px 12px; font-size: 12px;"
							onClick={() => setShift(n)}
						>
							ROT{n}
						</button>
					))}
				</div>
				<button class="btn-secondary" onClick={handleSwap}>
					⇄ Swap
				</button>
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">Input</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder="Enter text to encode/decode..."
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result (ROT{shift})</label>
						{result && (
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
						style="min-height: 200px; font-family: var(--font-mono)"
						value={result}
						readOnly
						placeholder="Result..."
					/>
				</div>
			</div>
			<div class="text-caption text-muted mt-2">
				ROT13 is its own inverse — applying it twice returns the original text.
			</div>
		</div>
	);
}
