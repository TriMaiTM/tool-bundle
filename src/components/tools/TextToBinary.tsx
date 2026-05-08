import { useState } from "preact/hooks";

export default function TextToBinary() {
	const [input, setInput] = useState("");
	const [mode, setMode] = useState<"text-to-binary" | "binary-to-text">("text-to-binary");
	const [bits, setBits] = useState<7 | 8>(8);

	const result = (() => {
		if (!input) return "";
		if (mode === "text-to-binary") {
			return Array.from(input)
				.map((char) => char.codePointAt(0)!.toString(2).padStart(bits, "0"))
				.join(" ");
		}
		try {
			const clean = input.replace(/[^01\s]/g, "").trim();
			const bytes = clean.split(/\s+/).filter(Boolean);
			return bytes.map((b) => String.fromCodePoint(Number.parseInt(b, 2))).join("");
		} catch {
			return "Invalid binary";
		}
	})();

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};
	const handleSwap = () => {
		if (result) {
			setInput(result);
			setMode(mode === "text-to-binary" ? "binary-to-text" : "text-to-binary");
		}
	};

	return (
		<div>
			<div class="flex flex-wrap items-center gap-3 mb-4">
				<button
					class={mode === "text-to-binary" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("text-to-binary")}
				>
					Text → Binary
				</button>
				<button
					class={mode === "binary-to-text" ? "btn-primary" : "btn-secondary"}
					onClick={() => setMode("binary-to-text")}
				>
					Binary → Text
				</button>
				<button class="btn-secondary" onClick={handleSwap}>
					⇄ Swap
				</button>
				{mode === "text-to-binary" && (
					<select
						class="input"
						style="width: auto"
						value={bits}
						onChange={(e) => setBits(Number((e.target as HTMLSelectElement).value) as 7 | 8)}
					>
						<option value="7">7-bit (ASCII)</option>
						<option value="8">8-bit (UTF-8)</option>
					</select>
				)}
			</div>
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
				<div>
					<label class="text-caption-uppercase text-muted block mb-2">
						{mode === "text-to-binary" ? "Text Input" : "Binary Input"}
					</label>
					<textarea
						class="textarea"
						style="min-height: 200px; font-family: var(--font-mono)"
						placeholder={
							mode === "text-to-binary"
								? "Enter text..."
								: "01001000 01100101 01101100 01101100 01101111"
						}
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
