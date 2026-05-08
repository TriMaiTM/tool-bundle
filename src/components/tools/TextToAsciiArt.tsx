import { useState, useMemo } from "preact/hooks";

const FONTS: Record<string, Record<string, string[]>> = {
	Block: {
		A: ["  █  ", " █ █ ", "█████", "█   █", "█   █"],
		B: ["████ ", "█   █", "████ ", "█   █", "████ "],
		C: [" ████", "█    ", "█    ", "█    ", " ████"],
		D: ["████ ", "█   █", "█   █", "█   █", "████ "],
		E: ["█████", "█    ", "████ ", "█    ", "█████"],
		F: ["█████", "█    ", "████ ", "█    ", "█    "],
		G: [" ████", "█    ", "█  ██", "█   █", " ████"],
		H: ["█   █", "█   █", "█████", "█   █", "█   █"],
		I: ["█████", "  █  ", "  █  ", "  █  ", "█████"],
		J: ["█████", "   █ ", "   █ ", "█  █ ", " ██  "],
		K: ["█   █", "█  █ ", "███  ", "█  █ ", "█   █"],
		L: ["█    ", "█    ", "█    ", "█    ", "█████"],
		M: ["█   █", "██ ██", "█ █ █", "█   █", "█   █"],
		N: ["█   █", "██  █", "█ █ █", "█  ██", "█   █"],
		O: [" ███ ", "█   █", "█   █", "█   █", " ███ "],
		P: ["████ ", "█   █", "████ ", "█    ", "█    "],
		Q: [" ███ ", "█   █", "█ █ █", "█  █ ", " ██ █"],
		R: ["████ ", "█   █", "████ ", "█  █ ", "█   █"],
		S: [" ████", "█    ", " ███ ", "    █", "████ "],
		T: ["█████", "  █  ", "  █  ", "  █  ", "  █  "],
		U: ["█   █", "█   █", "█   █", "█   █", " ███ "],
		V: ["█   █", "█   █", "█   █", " █ █ ", "  █  "],
		W: ["█   █", "█   █", "█ █ █", "██ ██", "█   █"],
		X: ["█   █", " █ █ ", "  █  ", " █ █ ", "█   █"],
		Y: ["█   █", " █ █ ", "  █  ", "  █  ", "  █  "],
		Z: ["█████", "   █ ", "  █  ", " █   ", "█████"],
		"0": [" ███ ", "█  ██", "█ █ █", "██  █", " ███ "],
		"1": ["  █  ", " ██  ", "  █  ", "  █  ", "█████"],
		"2": [" ███ ", "█   █", "  ██ ", " █   ", "█████"],
		"3": ["████ ", "    █", " ███ ", "    █", "████ "],
		"4": ["█   █", "█   █", "█████", "    █", "    █"],
		"5": ["█████", "█    ", "████ ", "    █", "████ "],
		"6": [" ████", "█    ", "████ ", "█   █", " ███ "],
		"7": ["█████", "    █", "   █ ", "  █  ", "  █  "],
		"8": [" ███ ", "█   █", " ███ ", "█   █", " ███ "],
		"9": [" ███ ", "█   █", " ████", "    █", "████ "],
		" ": ["     ", "     ", "     ", "     ", "     "],
	},
};

export default function TextToAsciiArt() {
	const [input, setInput] = useState("HELLO");
	const [font] = useState("Block");

	const result = useMemo(() => {
		if (!input) return "";
		const chars = input.toUpperCase().split("");
		const fontData = FONTS[font];
		const lines: string[] = ["", "", "", "", ""];
		for (const char of chars) {
			const glyph = fontData[char] ||
				fontData[" "] || ["     ", "     ", "     ", "     ", "     "];
			for (let i = 0; i < 5; i++) {
				lines[i] += `${glyph[i]} `;
			}
		}
		return lines.join("\n");
	}, [input, font]);

	const handleCopy = async () => {
		if (result) await navigator.clipboard.writeText(result);
	};

	return (
		<div>
			<div class="mb-4">
				<label class="text-caption-uppercase text-muted block mb-2">
					Text Input (A-Z, 0-9, space)
				</label>
				<input
					class="input"
					placeholder="Enter text..."
					value={input}
					onInput={(e) => setInput((e.target as HTMLInputElement).value)}
					maxLength={20}
				/>
			</div>
			<div>
				<div class="flex items-center justify-between mb-2">
					<label class="text-caption-uppercase text-muted">ASCII Art</label>
					{result && (
						<button
							class="text-body-sm text-primary hover:text-primary-pressed transition-colors"
							onClick={handleCopy}
						>
							Copy
						</button>
					)}
				</div>
				<pre
					class="code-block"
					style="white-space: pre; overflow-x: auto; font-size: 12px; line-height: 1.2;"
				>
					{result || "Enter text above..."}
				</pre>
			</div>
			<div class="text-caption text-muted mt-2">
				Tip: Works best with uppercase letters and numbers. Max 20 characters.
			</div>
		</div>
	);
}
