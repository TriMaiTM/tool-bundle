import { useState, useMemo } from "preact/hooks";

export default function TextToHex() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"text-to-hex" | "hex-to-text">("text-to-hex");
	const [separator, setSeparator] = useState<"space" | "none" | "0x">("space");

	const result = useMemo(() => {
		if (!input) return "";
		if (mode === "text-to-hex") {
			return Array.from(input)
				.map((char) => {
					const hex = char.codePointAt(0)!.toString(16).toUpperCase().padStart(2, "0");
					if (separator === "0x") return `0x${hex}`;
					return hex;
				})
				.join(separator === "none" ? "" : " ");
		}
		try {
			const clean = input
				.trim()
				.replace(/0x/gi, "")
				.replace(/[^0-9a-fA-F]/g, " ");
			const hexPairs = clean.trim().split(/\s+/).filter(Boolean);
			return hexPairs.map((h) => String.fromCodePoint(Number.parseInt(h, 16))).join("");
		} catch {
			return "Invalid hex";
		}
	}, [input, mode, separator]);

	const handleCopy = async () => {
		if (result && result !== "Invalid hex") await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result && result !== "Invalid hex") {
			setInput(result);
			setMode(mode === "text-to-hex" ? "hex-to-text" : "text-to-hex");
		}
	};

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<button
					class={mode === "text-to-hex" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("text-to-hex")}
				>
					Text → Hex
				</button>
				<button
					class={mode === "hex-to-text" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("hex-to-text")}
				>
					Hex → Text
				</button>
				<button class="btn-secondary" onClick={handleSwap}>
					⇄ Swap
				</button>
				{mode === "text-to-hex" && (
					<select
						class="input"
						style="width: auto"
						value={separator}
						onChange={(e) => setSeparator((e.target as HTMLSelectElement).value as any)}
					>
						<option value="space">Space separated</option>
						<option value="none">No separator</option>
						<option value="0x">0x prefix</option>
					</select>
				)}
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "text-to-hex" ? "Text Input" : "Hex Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={mode === "text-to-hex" ? "Enter text..." : "48 65 6C 6C 6F"}
						value={input}
						onInput={(e) => setInput((e.target as HTMLTextAreaElement).value)}
					/>
				</div>
				<div>
					<div class="flex items-center justify-between mb-2">
						<label class="text-caption-uppercase text-muted">Result</label>
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
		</div>
	);
}
